import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Global, Module } from '@nestjs/common';
import { OrdersModule } from './orders.module';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Idempotency } from './entities/idempotency.entity';

@Global()
@Module({
  providers: [{ provide: DataSource, useValue: {} }],
  exports: [DataSource],
})
class TestDbModule {}

describe('OrdersModule', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret-0123456789';
  });

  it('compiles the full dependency graph', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        TestDbModule,
        OrdersModule,
      ],
    })
      .overrideProvider(getRepositoryToken(Order))
      .useValue({})
      .overrideProvider(getRepositoryToken(OrderItem))
      .useValue({})
      .overrideProvider(getRepositoryToken(Idempotency))
      .useValue({})
      .compile();

    expect(moduleRef.get(OrdersService)).toBeDefined();
  });
});
