import { Test, TestingModule } from '@nestjs/testing';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { BadRequestException } from '@nestjs/common';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';

function makeCart(userId: string, items: CartItem[] = []): Cart {
  return {
    id: `cart-${userId}`,
    userId,
    guestId: null,
    items,
    checkoutInProgress: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function makeCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: 'item-1',
    cartId: 'cart-u1',
    cart: undefined as unknown as Cart,
    productId: 'prod-1',
    productName: 'Widget',
    price: '25.00',
    quantity: 2,
    ...overrides,
  };
}

const mockUser = { userId: 'u1', email: 'test@test.com', role: 'user' };

describe('CartController', () => {
  let controller: CartController;
  let service: jest.Mocked<CartService>;

  beforeEach(async () => {
    service = {
      getOrCreateCart: jest.fn(),
      addItem: jest.fn(),
      updateItemQuantity: jest.fn(),
      removeItem: jest.fn(),
      clearCart: jest.fn(),
      mergeGuestCart: jest.fn(),
      lockForCheckout: jest.fn(),
      unlockCheckout: jest.fn(),
    } as unknown as jest.Mocked<CartService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [{ provide: CartService, useValue: service }],
    }).compile();

    controller = module.get(CartController);
  });

  describe('GET /cart', () => {
    it('returns formatted cart with subtotal', async () => {
      const cart = makeCart('u1', [
        makeCartItem({ price: '10.00', quantity: 3 }),
        makeCartItem({ id: 'item-2', productId: 'prod-2', price: '5.50', quantity: 1 }),
      ]);
      service.getOrCreateCart.mockResolvedValue(cart);

      const result = await controller.getCart(mockUser);

      expect(result).toEqual({
        id: 'cart-u1',
        userId: 'u1',
        items: [
          {
            id: 'item-1',
            productId: 'prod-1',
            productName: 'Widget',
            price: 10,
            quantity: 3,
            lineTotal: 30,
          },
          {
            id: 'item-2',
            productId: 'prod-2',
            productName: 'Widget',
            price: 5.5,
            quantity: 1,
            lineTotal: 5.5,
          },
        ],
        totalItems: 4,
        subtotal: 35.5,
        checkoutInProgress: false,
      });
    });

    it('returns empty cart', async () => {
      service.getOrCreateCart.mockResolvedValue(makeCart('u1', []));

      const result = await controller.getCart(mockUser);

      expect(result.totalItems).toBe(0);
      expect(result.subtotal).toBe(0);
      expect(result.items).toEqual([]);
    });
  });

  describe('POST /cart/items', () => {
    it('adds item and returns formatted cart', async () => {
      const cartWithItem = makeCart('u1', [makeCartItem()]);
      service.addItem.mockResolvedValue(cartWithItem);

      const result = await controller.addItem(mockUser, {
        productId: 'prod-1',
        productName: 'Widget',
        price: 25,
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.addItem).toHaveBeenCalledWith('u1', {
        productId: 'prod-1',
        productName: 'Widget',
        price: 25,
      });
      expect(result.items).toHaveLength(1);
      expect(result.subtotal).toBe(50);
    });
  });

  describe('PATCH /cart/items/:itemId', () => {
    it('updates quantity and returns formatted cart', async () => {
      const updated = makeCart('u1', [makeCartItem({ quantity: 5 })]);
      service.updateItemQuantity.mockResolvedValue(updated);

      const result = await controller.updateItem(mockUser, 'item-1', { quantity: 5 });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.updateItemQuantity).toHaveBeenCalledWith('u1', 'item-1', {
        quantity: 5,
      });
      expect(result.items[0].quantity).toBe(5);
    });
  });

  describe('DELETE /cart/items/:itemId', () => {
    it('removes item and returns formatted cart', async () => {
      const emptyCart = makeCart('u1', []);
      service.removeItem.mockResolvedValue(emptyCart);

      const result = await controller.removeItem(mockUser, 'item-1');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.removeItem).toHaveBeenCalledWith('u1', 'item-1');
      expect(result.items).toEqual([]);
    });
  });

  describe('DELETE /cart', () => {
    it('clears cart and returns 204', async () => {
      service.clearCart.mockResolvedValue(undefined);

      await expect(controller.clearCart(mockUser as never)).resolves.toBeUndefined();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.clearCart).toHaveBeenCalledWith('u1');
    });
  });

  describe('POST /cart/merge', () => {
    it('merges guest cart and returns formatted result', async () => {
      const merged = makeCart('u1', [makeCartItem({ quantity: 5 })]);
      service.mergeGuestCart.mockResolvedValue(merged);

      const result = await controller.mergeGuestCart(mockUser, {
        items: [{ productId: 'prod-1', productName: 'Widget', price: 25, quantity: 3 }],
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.mergeGuestCart).toHaveBeenCalled();
      expect(result.items[0].quantity).toBe(5);
    });
  });

  describe('POST /cart/checkout-lock', () => {
    it('locks cart and returns success', async () => {
      service.lockForCheckout.mockResolvedValue(undefined);

      const result = await controller.checkoutLock(mockUser);

      expect(result).toEqual({ success: true });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.lockForCheckout).toHaveBeenCalledWith('u1');
    });

    it('propagates BadRequestException when already locked', async () => {
      service.lockForCheckout.mockRejectedValue(
        new BadRequestException('El carrito ya está en proceso de checkout'),
      );

      await expect(controller.checkoutLock(mockUser as never)).rejects.toThrow(BadRequestException);
    });
  });

  describe('POST /cart/checkout-unlock', () => {
    it('unlocks cart and returns success', async () => {
      service.unlockCheckout.mockResolvedValue(undefined);

      const result = await controller.checkoutUnlock(mockUser);

      expect(result).toEqual({ success: true });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.unlockCheckout).toHaveBeenCalledWith('u1');
    });
  });

  describe('formatCart subtotal calculation', () => {
    it('calculates subtotal correctly with multiple items', async () => {
      const cart = makeCart('u1', [
        makeCartItem({ price: '10.00', quantity: 2 }),
        makeCartItem({ id: 'item-2', productId: 'p2', price: '1.50', quantity: 2 }),
      ]);
      service.getOrCreateCart.mockResolvedValue(cart);

      const result = await controller.getCart(mockUser);

      expect(result.subtotal).toBe(23);
      expect(result.totalItems).toBe(4);
    });

    it('rounds subtotal to 2 decimal places', async () => {
      const cart = makeCart('u1', [makeCartItem({ price: '1.33', quantity: 3 })]);
      service.getOrCreateCart.mockResolvedValue(cart);

      const result = await controller.getCart(mockUser);

      expect(result.subtotal).toBe(3.99);
    });
  });
});
