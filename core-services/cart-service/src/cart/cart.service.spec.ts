import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CartService } from './cart.service';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';

const mockCartRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockCartItemRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  delete: jest.fn(),
});

const mockDataSource = {};

const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === 'INVENTORY_SERVICE_URL') return 'http://localhost:3006';
    return undefined;
  }),
};

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

describe('CartService', () => {
  let service: CartService;
  let cartRepo: ReturnType<typeof mockCartRepo>;
  let cartItemRepo: ReturnType<typeof mockCartItemRepo>;
  let configService: typeof mockConfigService;

  beforeEach(async () => {
    cartRepo = mockCartRepo();
    cartItemRepo = mockCartItemRepo();
    configService = { ...mockConfigService, get: jest.fn(mockConfigService.get) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: getRepositoryToken(Cart), useValue: cartRepo },
        { provide: getRepositoryToken(CartItem), useValue: cartItemRepo },
        { provide: DataSource, useValue: mockDataSource },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(CartService);

    // Mock global fetch for stock checks
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ─── getOrCreateCart ────────────────────────────────────────────

  describe('getOrCreateCart', () => {
    it('returns existing cart with items', async () => {
      const cart = makeCart('u1', [makeCartItem()]);
      cartRepo.findOne.mockResolvedValue(cart);

      const result = await service.getOrCreateCart('u1');

      expect(result).toEqual(cart);
      expect(cartRepo.findOne).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        relations: { items: true },
      });
    });

    it('creates new cart when none exists', async () => {
      const newCart = makeCart('u1');
      cartRepo.findOne.mockResolvedValue(null);
      cartRepo.create.mockReturnValue(newCart);
      cartRepo.save.mockResolvedValue(newCart);

      const result = await service.getOrCreateCart('u1');

      expect(cartRepo.create).toHaveBeenCalledWith({ userId: 'u1', items: [] });
      expect(result.items).toEqual([]);
    });
  });

  // ─── addItem ────────────────────────────────────────────────────

  describe('addItem', () => {
    it('adds new item to empty cart', async () => {
      const cart = makeCart('u1', []);
      cartRepo.findOne.mockResolvedValue(cart);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ available: 10 }),
      });
      cartItemRepo.create.mockReturnValue(makeCartItem());
      cartItemRepo.save.mockResolvedValue(makeCartItem());

      // After save, getOrCreateCart returns cart with item
      const cartWithItem = makeCart('u1', [makeCartItem()]);
      cartRepo.findOne.mockResolvedValueOnce(cart).mockResolvedValueOnce(cartWithItem);

      const result = await service.addItem('u1', {
        productId: 'prod-1',
        productName: 'Widget',
        price: 25,
        quantity: 2,
      });

      expect(cartItemRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          cartId: 'cart-u1',
          productId: 'prod-1',
          quantity: 2,
        }),
      );
      expect(result.items).toHaveLength(1);
    });

    it('increments quantity when product already in cart', async () => {
      const existing = makeCartItem({ quantity: 2 });
      const cart = makeCart('u1', [existing]);
      cartRepo.findOne.mockResolvedValue(cart);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ available: 10 }),
      });
      cartItemRepo.save.mockResolvedValue(existing);

      const updated = makeCartItem({ quantity: 5 });
      const updatedCart = makeCart('u1', [updated]);
      cartRepo.findOne.mockResolvedValueOnce(cart).mockResolvedValueOnce(updatedCart);

      const result = await service.addItem('u1', {
        productId: 'prod-1',
        productName: 'Widget',
        price: 25,
        quantity: 3,
      });

      expect(existing.quantity).toBe(5);
      expect(cartItemRepo.save).toHaveBeenCalledWith(existing);
      expect(result.items[0].quantity).toBe(5);
    });

    it('throws BadRequestException when stock insufficient for new item', async () => {
      const cart = makeCart('u1', []);
      cartRepo.findOne.mockResolvedValue(cart);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ available: 0 }),
      });

      await expect(
        service.addItem('u1', {
          productId: 'prod-1',
          productName: 'Widget',
          price: 25,
          quantity: 1,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when cumulative quantity exceeds stock', async () => {
      const existing = makeCartItem({ quantity: 8 });
      const cart = makeCart('u1', [existing]);
      cartRepo.findOne.mockResolvedValue(cart);

      // First check (new qty 5) passes, second check (cumulative 13) fails
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ available: 10 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ available: 10 }),
        });

      await expect(
        service.addItem('u1', {
          productId: 'prod-1',
          productName: 'Widget',
          price: 25,
          quantity: 5,
        }),
      ).rejects.toThrow('Stock insuficiente para cantidad 13');
    });

    it('defaults quantity to 1 when not provided', async () => {
      const cart = makeCart('u1', []);
      cartRepo.findOne.mockResolvedValue(cart);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ available: 10 }),
      });
      cartItemRepo.create.mockReturnValue(makeCartItem({ quantity: 1 }));
      cartItemRepo.save.mockResolvedValue(makeCartItem({ quantity: 1 }));

      const cartWithItem = makeCart('u1', [makeCartItem({ quantity: 1 })]);
      cartRepo.findOne.mockResolvedValueOnce(cart).mockResolvedValueOnce(cartWithItem);

      await service.addItem('u1', {
        productId: 'prod-1',
        productName: 'Widget',
        price: 25,
      });

      expect(cartItemRepo.create).toHaveBeenCalledWith(expect.objectContaining({ quantity: 1 }));
    });
  });

  // ─── updateItemQuantity ─────────────────────────────────────────

  describe('updateItemQuantity', () => {
    it('updates quantity when stock is available', async () => {
      const item = makeCartItem({ quantity: 2 });
      const cart = makeCart('u1', [item]);
      cartRepo.findOne.mockResolvedValue(cart);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ available: 10 }),
      });
      cartItemRepo.save.mockResolvedValue(item);

      const updatedCart = makeCart('u1', [makeCartItem({ quantity: 5 })]);
      cartRepo.findOne.mockResolvedValueOnce(cart).mockResolvedValueOnce(updatedCart);

      const result = await service.updateItemQuantity('u1', 'item-1', { quantity: 5 });

      expect(item.quantity).toBe(5);
      expect(result.items[0].quantity).toBe(5);
    });

    it('throws NotFoundException when item not in cart', async () => {
      const cart = makeCart('u1', []);
      cartRepo.findOne.mockResolvedValue(cart);

      await expect(
        service.updateItemQuantity('u1', 'nonexistent', { quantity: 1 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when stock insufficient', async () => {
      const item = makeCartItem({ quantity: 2 });
      const cart = makeCart('u1', [item]);
      cartRepo.findOne.mockResolvedValue(cart);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ available: 3 }),
      });

      await expect(service.updateItemQuantity('u1', 'item-1', { quantity: 10 })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── removeItem ─────────────────────────────────────────────────

  describe('removeItem', () => {
    it('removes item from cart', async () => {
      const item = makeCartItem();
      const cart = makeCart('u1', [item]);
      cartRepo.findOne.mockResolvedValue(cart);
      cartItemRepo.remove.mockResolvedValue(item);

      const emptyCart = makeCart('u1', []);
      cartRepo.findOne.mockResolvedValueOnce(cart).mockResolvedValueOnce(emptyCart);

      const result = await service.removeItem('u1', 'item-1');

      expect(cartItemRepo.remove).toHaveBeenCalledWith(item);
      expect(result.items).toEqual([]);
    });

    it('throws NotFoundException when item not found', async () => {
      const cart = makeCart('u1', []);
      cartRepo.findOne.mockResolvedValue(cart);

      await expect(service.removeItem('u1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── clearCart ──────────────────────────────────────────────────

  describe('clearCart', () => {
    it('deletes all items from cart', async () => {
      const cart = makeCart('u1', [makeCartItem()]);
      cartRepo.findOne.mockResolvedValue(cart);
      cartItemRepo.delete.mockResolvedValue({ affected: 1 });

      await service.clearCart('u1');

      expect(cartItemRepo.delete).toHaveBeenCalledWith({ cartId: 'cart-u1' });
    });
  });

  // ─── mergeGuestCart ─────────────────────────────────────────────

  describe('mergeGuestCart', () => {
    it('adds guest items to empty user cart', async () => {
      const cart = makeCart('u1', []);
      cartRepo.findOne.mockResolvedValue(cart);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ available: 10 }),
      });
      cartItemRepo.create.mockReturnValue(makeCartItem());
      cartItemRepo.save.mockResolvedValue(makeCartItem());

      const cartWithItem = makeCart('u1', [makeCartItem()]);
      cartRepo.findOne.mockResolvedValueOnce(cart).mockResolvedValueOnce(cartWithItem);

      const result = await service.mergeGuestCart('u1', {
        items: [{ productId: 'prod-1', productName: 'Widget', price: 25, quantity: 3 }],
      });

      expect(cartItemRepo.create).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
    });

    it('merges quantities when product exists in both guest and user cart', async () => {
      const existing = makeCartItem({ quantity: 2 });
      const cart = makeCart('u1', [existing]);
      cartRepo.findOne.mockResolvedValue(cart);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ available: 10 }),
      });
      cartItemRepo.save.mockResolvedValue(existing);

      const merged = makeCartItem({ quantity: 5 });
      const mergedCart = makeCart('u1', [merged]);
      cartRepo.findOne.mockResolvedValueOnce(cart).mockResolvedValueOnce(mergedCart);

      const result = await service.mergeGuestCart('u1', {
        items: [{ productId: 'prod-1', productName: 'Widget', price: 25, quantity: 3 }],
      });

      expect(existing.quantity).toBe(5);
      expect(result.items[0].quantity).toBe(5);
    });

    it('caps quantity to available stock when merge would exceed', async () => {
      const existing = makeCartItem({ quantity: 5 });
      const cart = makeCart('u1', [existing]);
      cartRepo.findOne.mockResolvedValue(cart);

      // Merge would be 5+10=15, but available is 8
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ available: 8 }),
        })
        // getMaxAvailable returns 5 (currentQty capped at available)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ available: 8 }),
        });

      cartItemRepo.save.mockResolvedValue(existing);

      const capped = makeCartItem({ quantity: 5 });
      const cappedCart = makeCart('u1', [capped]);
      cartRepo.findOne.mockResolvedValueOnce(cart).mockResolvedValueOnce(cappedCart);

      await service.mergeGuestCart('u1', {
        items: [{ productId: 'prod-1', productName: 'Widget', price: 25, quantity: 10 }],
      });

      expect(existing.quantity).toBe(5);
    });

    it('skips guest item when stock is zero and item is new', async () => {
      const cart = makeCart('u1', []);
      cartRepo.findOne.mockResolvedValue(cart);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ available: 0 }),
      });

      await service.mergeGuestCart('u1', {
        items: [{ productId: 'prod-1', productName: 'Widget', price: 25, quantity: 1 }],
      });

      expect(cartItemRepo.create).not.toHaveBeenCalled();
    });
  });

  // ─── lockForCheckout / unlockCheckout ────────────────────────────

  describe('lockForCheckout', () => {
    it('locks cart for checkout', async () => {
      const cart = makeCart('u1');
      cartRepo.findOne.mockResolvedValue(cart);
      cartRepo.save.mockResolvedValue({ ...cart, checkoutInProgress: true });

      await service.lockForCheckout('u1');

      expect(cart.checkoutInProgress).toBe(true);
      expect(cartRepo.save).toHaveBeenCalledWith(cart);
    });

    it('throws when cart already locked', async () => {
      const cart = makeCart('u1');
      cart.checkoutInProgress = true;
      cartRepo.findOne.mockResolvedValue(cart);

      await expect(service.lockForCheckout('u1')).rejects.toThrow(
        'El carrito ya está en proceso de checkout',
      );
    });
  });

  describe('unlockCheckout', () => {
    it('unlocks cart', async () => {
      const cart = makeCart('u1');
      cart.checkoutInProgress = true;
      cartRepo.findOne.mockResolvedValue(cart);
      cartRepo.save.mockResolvedValue({ ...cart, checkoutInProgress: false });

      await service.unlockCheckout('u1');

      expect(cart.checkoutInProgress).toBe(false);
    });
  });

  // ─── checkStock fallback ────────────────────────────────────────

  describe('checkStock fallback', () => {
    it('allows operation when inventory service is unreachable', async () => {
      const cart = makeCart('u1', []);
      cartRepo.findOne.mockResolvedValue(cart);
      (global.fetch as jest.Mock).mockRejectedValue(new Error('ECONNREFUSED'));
      cartItemRepo.create.mockReturnValue(makeCartItem());
      cartItemRepo.save.mockResolvedValue(makeCartItem());

      const cartWithItem = makeCart('u1', [makeCartItem()]);
      cartRepo.findOne.mockResolvedValueOnce(cart).mockResolvedValueOnce(cartWithItem);

      const result = await service.addItem('u1', {
        productId: 'prod-1',
        productName: 'Widget',
        price: 25,
        quantity: 1,
      });

      expect(result.items).toHaveLength(1);
    });

    it('allows operation when inventory returns non-ok status', async () => {
      const cart = makeCart('u1', []);
      cartRepo.findOne.mockResolvedValue(cart);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
      });
      cartItemRepo.create.mockReturnValue(makeCartItem());
      cartItemRepo.save.mockResolvedValue(makeCartItem());

      const cartWithItem = makeCart('u1', [makeCartItem()]);
      cartRepo.findOne.mockResolvedValueOnce(cart).mockResolvedValueOnce(cartWithItem);

      const result = await service.addItem('u1', {
        productId: 'prod-1',
        productName: 'Widget',
        price: 25,
        quantity: 1,
      });

      expect(result.items).toHaveLength(1);
    });
  });

  // ─── ownership isolation ────────────────────────────────────────

  describe('ownership isolation', () => {
    it('each user gets their own cart', async () => {
      const cartU1 = makeCart('u1');
      const cartU2 = makeCart('u2');
      cartRepo.findOne.mockResolvedValueOnce(cartU1).mockResolvedValueOnce(cartU2);

      const c1 = await service.getOrCreateCart('u1');
      const c2 = await service.getOrCreateCart('u2');

      expect(c1.userId).toBe('u1');
      expect(c2.userId).toBe('u2');
      expect(c1.id).not.toBe(c2.id);
    });
  });
});
