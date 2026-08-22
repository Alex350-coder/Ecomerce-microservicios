import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Global, Module } from '@nestjs/common';
import { CartModule } from './cart.module';
import { CartService } from './cart.service';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';

@Global()
@Module({
  providers: [{ provide: DataSource, useValue: {} }],
  exports: [DataSource],
})
class TestDbModule {}

describe('CartModule', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret-0123456789';
  });

  it('compiles the full dependency graph', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        TestDbModule,
        CartModule,
      ],
    })
      .overrideProvider(getRepositoryToken(Cart))
      .useValue({})
      .overrideProvider(getRepositoryToken(CartItem))
      .useValue({})
      .compile();

    expect(moduleRef.get(CartService)).toBeDefined();
  });
});
