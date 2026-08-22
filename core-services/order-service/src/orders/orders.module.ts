import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Idempotency } from './entities/idempotency.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { SagaOrchestrator } from './helpers/saga-orchestrator';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Idempotency]), AuthModule],
  controllers: [OrdersController],
  providers: [OrdersService, SagaOrchestrator],
  exports: [OrdersService],
})
export class OrdersModule {}
