import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('intents')
  async createIntent(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreatePaymentIntentDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const intent = await this.paymentsService.createIntent(dto, idempotencyKey);
    return this.formatIntent(intent);
  }

  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    const intent = await this.paymentsService.findById(id);
    return this.formatIntent(intent);
  }

  @Get('order/:orderId')
  async findByOrderId(@Param('orderId', new ParseUUIDPipe()) orderId: string) {
    const intent = await this.paymentsService.findByOrderId(orderId);
    return this.formatIntent(intent);
  }

  private formatIntent(intent: import('./entities/payment-intent.entity').PaymentIntent) {
    return {
      id: intent.id,
      orderId: intent.orderId,
      amount: Number(intent.amount),
      method: intent.method,
      status: intent.status,
      failureReason: intent.failureReason,
      createdAt: intent.createdAt,
      updatedAt: intent.updatedAt,
    };
  }
}
