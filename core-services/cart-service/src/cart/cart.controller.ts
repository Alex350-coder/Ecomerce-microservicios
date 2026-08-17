import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { MergeCartDto } from './dto/merge-cart.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@CurrentUser() user: JwtUser) {
    const cart = await this.cartService.getOrCreateCart(user.userId);
    return this.formatCart(cart);
  }

  @Post('items')
  async addItem(@CurrentUser() user: JwtUser, @Body() dto: AddCartItemDto) {
    const cart = await this.cartService.addItem(user.userId, dto);
    return this.formatCart(cart);
  }

  @Patch('items/:itemId')
  async updateItem(
    @CurrentUser() user: JwtUser,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    const cart = await this.cartService.updateItemQuantity(user.userId, itemId, dto);
    return this.formatCart(cart);
  }

  @Delete('items/:itemId')
  @HttpCode(HttpStatus.OK)
  async removeItem(
    @CurrentUser() user: JwtUser,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
  ) {
    const cart = await this.cartService.removeItem(user.userId, itemId);
    return this.formatCart(cart);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearCart(@CurrentUser() user: JwtUser): Promise<void> {
    await this.cartService.clearCart(user.userId);
  }

  @Post('merge')
  async mergeGuestCart(@CurrentUser() user: JwtUser, @Body() dto: MergeCartDto) {
    const cart = await this.cartService.mergeGuestCart(user.userId, dto);
    return this.formatCart(cart);
  }

  @Post('checkout-lock')
  @HttpCode(HttpStatus.OK)
  async checkoutLock(@CurrentUser() user: JwtUser) {
    await this.cartService.lockForCheckout(user.userId);
    return { success: true };
  }

  @Post('checkout-unlock')
  @HttpCode(HttpStatus.OK)
  async checkoutUnlock(@CurrentUser() user: JwtUser) {
    await this.cartService.unlockCheckout(user.userId);
    return { success: true };
  }

  private formatCart(cart: import('./entities/cart.entity').Cart) {
    const subtotal = cart.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    return {
      id: cart.id,
      userId: cart.userId,
      items: cart.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        price: Number(item.price),
        quantity: item.quantity,
        lineTotal: Number(item.price) * item.quantity,
      })),
      totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: Number(subtotal.toFixed(2)),
      checkoutInProgress: cart.checkoutInProgress,
    };
  }
}
