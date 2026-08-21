import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { MergeCartDto } from './dto/merge-cart.dto';
import { RequestContextService } from '../common/request-context.service';
import { fetchWithTimeout } from '../common/fetch-with-timeout';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);
  private readonly inventoryUrl: string;

  constructor(
    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepo: Repository<CartItem>,
    private readonly dataSource: DataSource,
    configService: ConfigService,
    private readonly requestContext: RequestContextService,
  ) {
    this.inventoryUrl =
      configService.get<string>('INVENTORY_SERVICE_URL') ?? 'http://localhost:3006';
  }

  async getOrCreateCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepo.findOne({
      where: { userId },
      relations: { items: true },
    });

    if (!cart) {
      cart = this.cartRepo.create({ userId, items: [] });
      cart = await this.cartRepo.save(cart);
      cart.items = [];
    }

    return cart;
  }

  async addItem(userId: string, dto: AddCartItemDto): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);

    const available = await this.checkStock(dto.productId, dto.quantity ?? 1);
    if (!available) {
      throw new BadRequestException(`Stock insuficiente para el producto ${dto.productId}`);
    }

    const existingItem = cart.items.find((i) => i.productId === dto.productId);

    if (existingItem) {
      const newQty = existingItem.quantity + (dto.quantity ?? 1);
      const stockOk = await this.checkStock(dto.productId, newQty);
      if (!stockOk) {
        throw new BadRequestException(
          `Stock insuficiente para cantidad ${newQty} del producto ${dto.productId}`,
        );
      }
      existingItem.quantity = newQty;
      await this.cartItemRepo.save(existingItem);
    } else {
      const item = this.cartItemRepo.create({
        cartId: cart.id,
        productId: dto.productId,
        productName: dto.productName,
        price: String(dto.price),
        quantity: dto.quantity ?? 1,
      });
      await this.cartItemRepo.save(item);
    }

    return this.getOrCreateCart(userId);
  }

  async updateItemQuantity(userId: string, itemId: string, dto: UpdateCartItemDto): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);
    const item = cart.items.find((i) => i.id === itemId);

    if (!item) {
      throw new NotFoundException(`Item ${itemId} no encontrado en el carrito`);
    }

    const stockOk = await this.checkStock(item.productId, dto.quantity);
    if (!stockOk) {
      throw new BadRequestException(
        `Stock insuficiente para cantidad ${dto.quantity} del producto ${item.productId}`,
      );
    }

    item.quantity = dto.quantity;
    await this.cartItemRepo.save(item);

    return this.getOrCreateCart(userId);
  }

  async removeItem(userId: string, itemId: string): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);
    const item = cart.items.find((i) => i.id === itemId);

    if (!item) {
      throw new NotFoundException(`Item ${itemId} no encontrado en el carrito`);
    }

    await this.cartItemRepo.remove(item);
    return this.getOrCreateCart(userId);
  }

  async clearCart(userId: string): Promise<void> {
    const cart = await this.getOrCreateCart(userId);
    await this.cartItemRepo.delete({ cartId: cart.id });
  }

  async mergeGuestCart(userId: string, dto: MergeCartDto): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);

    for (const guestItem of dto.items) {
      const existingItem = cart.items.find((i) => i.productId === guestItem.productId);

      if (existingItem) {
        const mergedQty = existingItem.quantity + guestItem.quantity;
        const stockOk = await this.checkStock(guestItem.productId, mergedQty);
        existingItem.quantity = stockOk
          ? mergedQty
          : await this.getMaxAvailable(guestItem.productId, existingItem.quantity);
        await this.cartItemRepo.save(existingItem);
      } else {
        const stockOk = await this.checkStock(guestItem.productId, guestItem.quantity);
        const qty = stockOk
          ? guestItem.quantity
          : await this.getMaxAvailable(guestItem.productId, 0);
        if (qty > 0) {
          const item = this.cartItemRepo.create({
            cartId: cart.id,
            productId: guestItem.productId,
            productName: guestItem.productName,
            price: String(guestItem.price),
            quantity: qty,
          });
          await this.cartItemRepo.save(item);
        }
      }
    }

    this.logger.log(`Guest cart merged for user ${userId}: ${dto.items.length} items`);
    return this.getOrCreateCart(userId);
  }

  async lockForCheckout(userId: string): Promise<void> {
    const cart = await this.getOrCreateCart(userId);
    if (cart.checkoutInProgress) {
      throw new BadRequestException('El carrito ya está en proceso de checkout');
    }
    cart.checkoutInProgress = true;
    await this.cartRepo.save(cart);
  }

  async unlockCheckout(userId: string): Promise<void> {
    const cart = await this.getOrCreateCart(userId);
    cart.checkoutInProgress = false;
    await this.cartRepo.save(cart);
  }

  private async checkStock(productId: string, quantity: number): Promise<boolean> {
    try {
      const requestId = this.requestContext.getRequestId();
      const response = await fetchWithTimeout(`${this.inventoryUrl}/inventory/${productId}`, {
        headers: { 'x-request-id': requestId },
      });
      if (!response.ok) return true;
      const data = (await response.json()) as { available: number };
      return data.available >= quantity;
    } catch {
      this.logger.warn(
        `Inventory service unreachable for product ${productId}, allowing operation`,
      );
      return true;
    }
  }

  private async getMaxAvailable(productId: string, currentQty: number): Promise<number> {
    try {
      const requestId = this.requestContext.getRequestId();
      const response = await fetchWithTimeout(`${this.inventoryUrl}/inventory/${productId}`, {
        headers: { 'x-request-id': requestId },
      });
      if (!response.ok) return currentQty;
      const data = (await response.json()) as { available: number };
      return Math.min(currentQty, data.available);
    } catch {
      return currentQty;
    }
  }
}
