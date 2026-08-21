import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Idempotency } from './entities/idempotency.entity';
import { OrderStatus } from './enums/order-status.enum';
import { CreateOrderDto } from './dto/create-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { AdminUpdateOrderDto } from './dto/admin-update-order.dto';
import { calculateOrderTotals } from './helpers/price-calculator';
import { isValidTransition, canCancel } from './helpers/status-machine';
import { RequestContextService } from '../common/request-context.service';
import { fetchWithTimeout } from '../common/fetch-with-timeout';

interface InventoryResponse {
  reservationId: string;
  items: { productId: string; quantity: number; available: boolean }[];
}

interface PaymentResponse {
  id: string;
  status: string;
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private readonly inventoryUrl: string;
  private readonly paymentUrl: string;

  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Idempotency)
    private readonly idempotencyRepo: Repository<Idempotency>,
    private readonly dataSource: DataSource,
    configService: ConfigService,
    private readonly requestContext: RequestContextService,
  ) {
    this.inventoryUrl =
      configService.get<string>('INVENTORY_SERVICE_URL') ?? 'http://localhost:3006';
    this.paymentUrl =
      configService.get<string>('PAYMENT_SERVICE_URL') ?? 'http://localhost:3007';
  }

  async createOrder(
    userId: string,
    dto: CreateOrderDto,
    idempotencyKey?: string,
  ): Promise<Order> {
    const key = idempotencyKey ?? dto.idempotencyKey ?? crypto.randomUUID();

    const existingIdempotency = await this.idempotencyRepo.findOne({
      where: { key },
    });

    if (existingIdempotency) {
      this.logger.log(`Idempotent hit for key ${key}`);
      const existingOrder = await this.orderRepo.findOne({
        where: { id: existingIdempotency.resourceId },
        relations: { items: true },
      });
      if (existingOrder) return existingOrder;
    }

    const totals = calculateOrderTotals(dto.items, dto.shippingMethod);

    const order = this.orderRepo.create({
      userId,
      status: OrderStatus.PENDING,
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      tax: totals.tax,
      total: totals.total,
      shippingMethod: dto.shippingMethod ?? 'standard',
      addressSnapshot: dto.address as unknown as Record<string, string>,
      idempotencyKey: key,
    });

    const savedOrder = await this.orderRepo.save(order);

    const orderItems = dto.items.map((item) =>
      this.orderItemRepo.create({
        orderId: savedOrder.id,
        productId: item.productId,
        productName: item.productName,
        price: item.price,
        quantity: item.quantity,
      }),
    );
    await this.orderItemRepo.save(orderItems);

    const idempotencyRecord = this.idempotencyRepo.create({
      key,
      resourceId: savedOrder.id,
      resourceType: 'order',
    });
    await this.idempotencyRepo.save(idempotencyRecord);

    this.logger.log(`Order created: ${savedOrder.id} for user ${userId}`);

    try {
      await this.executeSaga(savedOrder, dto.items);
    } catch (error) {
      this.logger.error(`Saga failed for order ${savedOrder.id}: ${error}`);
    }

    return this.orderRepo.findOne({
      where: { id: savedOrder.id },
      relations: { items: true },
    }) as Promise<Order>;
  }

  private async executeSaga(
    order: Order,
    items: CreateOrderDto['items'],
  ): Promise<void> {
    this.logger.log(`Executing saga for order ${order.id}`);

    const reservationId = crypto.randomUUID();
    let reservationSuccess = false;

    try {
      const reserveResult = await this.reserveStock(items, reservationId);
      reservationSuccess = reserveResult.items.every((r) => r.available);

      if (!reservationSuccess) {
        this.logger.warn(`Stock reservation failed for order ${order.id}`);
        order.status = OrderStatus.FAILED;
        await this.orderRepo.save(order);
        return;
      }

      const paymentResult = await this.processPayment(order, items);

      if (paymentResult.status === 'approved') {
        await this.commitStock(items, reservationId);
        order.status = OrderStatus.PAID;
        order.paymentIntentId = paymentResult.id;
        await this.orderRepo.save(order);
        this.logger.log(`Order ${order.id} PAID successfully`);
      } else {
        await this.releaseStock(items, reservationId);
        order.status = OrderStatus.FAILED;
        await this.orderRepo.save(order);
        this.logger.warn(`Order ${order.id} FAILED - payment declined`);
      }
    } catch (error) {
      this.logger.error(`Saga error for order ${order.id}: ${error}`);

      if (reservationSuccess) {
        try {
          await this.releaseStock(items, reservationId);
        } catch (releaseError) {
          this.logger.error(`Compensation release failed: ${releaseError}`);
        }
      }

      order.status = OrderStatus.FAILED;
      await this.orderRepo.save(order);
    }
  }

  private async reserveStock(
    items: CreateOrderDto['items'],
    reservationId: string,
  ): Promise<InventoryResponse> {
    const requestId = this.requestContext.getRequestId();
    const response = await fetchWithTimeout(`${this.inventoryUrl}/inventory/reserve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': requestId,
      },
      body: JSON.stringify({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        reservationId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Inventory reserve failed: ${response.status}`);
    }

    return response.json() as Promise<InventoryResponse>;
  }

  private async commitStock(
    items: CreateOrderDto['items'],
    reservationId: string,
  ): Promise<void> {
    const requestId = this.requestContext.getRequestId();
    const response = await fetchWithTimeout(`${this.inventoryUrl}/inventory/commit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': requestId,
      },
      body: JSON.stringify({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        reservationId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Inventory commit failed: ${response.status}`);
    }
  }

  private async releaseStock(
    items: CreateOrderDto['items'],
    reservationId: string,
  ): Promise<void> {
    const requestId = this.requestContext.getRequestId();
    const response = await fetchWithTimeout(`${this.inventoryUrl}/inventory/release`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': requestId,
      },
      body: JSON.stringify({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        reservationId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Inventory release failed: ${response.status}`);
    }
  }

  private async processPayment(
    order: Order,
    items: CreateOrderDto['items'],
  ): Promise<PaymentResponse> {
    const idempotencyKey = `order-${order.id}`;
    const requestId = this.requestContext.getRequestId();

    const response = await fetchWithTimeout(`${this.paymentUrl}/payments/intents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'idempotency-key': idempotencyKey,
        'x-request-id': requestId,
      },
      body: JSON.stringify({
        orderId: order.id,
        amount: order.total,
        method: 'credit_card',
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.price,
        })),
      }),
    });

    if (!response.ok) {
      throw new Error(`Payment intent failed: ${response.status}`);
    }

    return response.json() as Promise<PaymentResponse>;
  }

  async findByUser(userId: string): Promise<Order[]> {
    return this.orderRepo.find({
      where: { userId },
      relations: { items: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findByIdAndUser(id: string, userId: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Pedido ${id} no encontrado`);
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('No tienes acceso a este pedido');
    }

    return order;
  }

  async cancelOrder(id: string, userId: string, dto?: CancelOrderDto): Promise<Order> {
    const order = await this.findByIdAndUser(id, userId);

    if (!canCancel(order.status)) {
      throw new BadRequestException(
        `No se puede cancelar un pedido en estado ${order.status}`,
      );
    }

    order.status = OrderStatus.CANCELLED;
    await this.orderRepo.save(order);

    this.logger.log(`Order ${id} cancelled by user ${userId}`);

    return this.orderRepo.findOne({
      where: { id },
      relations: { items: true },
    }) as Promise<Order>;
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepo.find({
      relations: { items: true },
      order: { createdAt: 'DESC' },
    });
  }

  async adminUpdateStatus(id: string, dto: AdminUpdateOrderDto): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Pedido ${id} no encontrado`);
    }

    if (!isValidTransition(order.status, dto.status)) {
      throw new BadRequestException(
        `Transición inválida: ${order.status} → ${dto.status}`,
      );
    }

    order.status = dto.status;
    await this.orderRepo.save(order);

    this.logger.log(`Admin updated order ${id}: ${dto.status}`);

    return this.orderRepo.findOne({
      where: { id },
      relations: { items: true },
    }) as Promise<Order>;
  }
}
