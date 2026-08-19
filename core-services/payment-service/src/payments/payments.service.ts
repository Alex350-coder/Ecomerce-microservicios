import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentIntent } from './entities/payment-intent.entity';
import { PaymentStatus } from './enums/payment-status.enum';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(PaymentIntent)
    private readonly paymentRepo: Repository<PaymentIntent>,
  ) {}

  async createIntent(dto: CreatePaymentIntentDto, idempotencyKey?: string): Promise<PaymentIntent> {
    const key = idempotencyKey ?? dto.idempotencyKey ?? crypto.randomUUID();

    const existing = await this.paymentRepo.findOne({
      where: { idempotencyKey: key },
    });

    if (existing) {
      this.logger.log(`Idempotent hit for key ${key}, returning existing intent`);
      return existing;
    }

    const existingForOrder = await this.paymentRepo.findOne({
      where: { orderId: dto.orderId },
    });

    if (existingForOrder) {
      throw new ConflictException(
        `Ya existe un intent de pago para la orden ${dto.orderId}`,
      );
    }

    const intent = this.paymentRepo.create({
      orderId: dto.orderId,
      idempotencyKey: key,
      amount: dto.amount,
      method: dto.method,
      status: PaymentStatus.PENDING,
    });

    const saved = await this.paymentRepo.save(intent);

    this.logger.log(`Payment intent created: ${saved.id} for order ${dto.orderId}`);

    const result = await this.processPayment(saved);

    return result;
  }

  async findById(id: string): Promise<PaymentIntent> {
    const intent = await this.paymentRepo.findOne({ where: { id } });
    if (!intent) {
      throw new NotFoundException(`Payment intent ${id} no encontrado`);
    }
    return intent;
  }

  async findByOrderId(orderId: string): Promise<PaymentIntent> {
    const intent = await this.paymentRepo.findOne({ where: { orderId } });
    if (!intent) {
      throw new NotFoundException(`Payment intent para orden ${orderId} no encontrado`);
    }
    return intent;
  }

  async approvePayment(intentId: string): Promise<PaymentIntent> {
    const intent = await this.findById(intentId);

    if (intent.status !== PaymentStatus.PENDING && intent.status !== PaymentStatus.PROCESSING) {
      throw new BadRequestException(
        `No se puede aprobar un pago en estado ${intent.status}`,
      );
    }

    intent.status = PaymentStatus.APPROVED;
    return this.paymentRepo.save(intent);
  }

  async failPayment(intentId: string, reason: string): Promise<PaymentIntent> {
    const intent = await this.findById(intentId);

    if (intent.status === PaymentStatus.APPROVED) {
      throw new BadRequestException(
        `No se puede fallar un pago ya aprobado`,
      );
    }

    intent.status = PaymentStatus.FAILED;
    intent.failureReason = reason;
    return this.paymentRepo.save(intent);
  }

  async cancelPayment(intentId: string): Promise<PaymentIntent> {
    const intent = await this.findById(intentId);

    if (intent.status === PaymentStatus.APPROVED) {
      throw new BadRequestException(
        `No se puede cancelar un pago ya aprobado`,
      );
    }

    intent.status = PaymentStatus.CANCELLED;
    return this.paymentRepo.save(intent);
  }

  private async processPayment(intent: PaymentIntent): Promise<PaymentIntent> {
    intent.status = PaymentStatus.PROCESSING;
    await this.paymentRepo.save(intent);

    const shouldDecline = this.deterministicRule(intent.idempotencyKey);

    if (shouldDecline) {
      intent.status = PaymentStatus.FAILED;
      intent.failureReason = 'Pago rechazado por regla de simulación';
      const saved = await this.paymentRepo.save(intent);
      this.logger.warn(`Payment DECLINED for intent ${saved.id}`);
      return saved;
    }

    intent.status = PaymentStatus.APPROVED;
    const saved = await this.paymentRepo.save(intent);
    this.logger.log(`Payment APPROVED for intent ${saved.id}`);
    return saved;
  }

  deterministicRule(idempotencyKey: string): boolean {
    const firstCharCode = idempotencyKey.charCodeAt(0);
    return firstCharCode % 10 === 0;
  }
}
