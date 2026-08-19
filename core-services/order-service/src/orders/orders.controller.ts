import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { AdminUpdateOrderDto } from './dto/admin-update-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { Headers } from '@nestjs/common';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createOrder(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateOrderDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const order = await this.ordersService.createOrder(
      user.userId,
      dto,
      idempotencyKey,
    );
    return this.formatOrder(order);
  }

  @Get()
  async findMyOrders(@CurrentUser() user: JwtUser) {
    const orders = await this.ordersService.findByUser(user.userId);
    return orders.map((o) => this.formatOrder(o));
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const order = await this.ordersService.findByIdAndUser(id, user.userId);
    return this.formatOrder(order);
  }

  @Post(':id/cancel')
  async cancelOrder(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto?: CancelOrderDto,
  ) {
    const order = await this.ordersService.cancelOrder(id, user.userId, dto);
    return this.formatOrder(order);
  }

  @Get('admin/orders')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async findAllAdmin() {
    const orders = await this.ordersService.findAll();
    return orders.map((o) => this.formatOrder(o));
  }

  @Patch('admin/orders/:id/status')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async adminUpdateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AdminUpdateOrderDto,
  ) {
    const order = await this.ordersService.adminUpdateStatus(id, dto);
    return this.formatOrder(order);
  }

  private formatOrder(order: import('./entities/order.entity').Order) {
    return {
      id: order.id,
      userId: order.userId,
      status: order.status,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        price: Number(item.price),
        quantity: item.quantity,
        lineTotal: Number(item.price) * item.quantity,
      })),
      subtotal: Number(order.subtotal),
      shipping: Number(order.shipping),
      tax: Number(order.tax),
      total: Number(order.total),
      shippingMethod: order.shippingMethod,
      addressSnapshot: order.addressSnapshot,
      paymentIntentId: order.paymentIntentId,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
