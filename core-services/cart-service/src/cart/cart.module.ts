import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { RequestContextService } from '../common/request-context.service';

@Module({
  imports: [TypeOrmModule.forFeature([Cart, CartItem]), AuthModule],
  controllers: [CartController],
  providers: [CartService, RequestContextService],
  exports: [CartService],
})
export class CartModule {}
