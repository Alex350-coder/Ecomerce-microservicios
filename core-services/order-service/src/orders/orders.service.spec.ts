import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Idempotency } from './entities/idempotency.entity';
import { OrderStatus } from './enums/order-status.enum';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';

type MockRepo<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepo = <T = any>(): MockRepo<T> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  delete: jest.fn(),
});

const mockConfigService = {
  get: jest.fn((key: string) => {
    const config: Record<string, string> = {
      INVENTORY_SERVICE_URL: 'http://localhost:3006',
      PAYMENT_SERVICE_URL: 'http://localhost:3007',
    };
    return config[key];
  }),
};

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepo: MockRepo<Order>;
  let orderItemRepo: MockRepo<OrderItem>;
  let idempotencyRepo: MockRepo<Idempotency>;

  beforeEach(async () => {
    orderRepo = createMockRepo();
    orderItemRepo = createMockRepo();
    idempotencyRepo = createMockRepo();
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: orderRepo },
        { provide: getRepositoryToken(OrderItem), useValue: orderItemRepo },
        { provide: getRepositoryToken(Idempotency), useValue: idempotencyRepo },
        { provide: DataSource, useValue: {} },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByIdAndUser', () => {
    it('should return an order when found and owned by user', async () => {
      const order = { id: 'o1', userId: 'u1', items: [] };
      orderRepo.findOne!.mockResolvedValue(order);

      const result = await service.findByIdAndUser('o1', 'u1');
      expect(result.id).toBe('o1');
    });

    it('should throw NotFoundException when order not found', async () => {
      orderRepo.findOne!.mockResolvedValue(null);

      await expect(service.findByIdAndUser('o1', 'u1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own order', async () => {
      const order = { id: 'o1', userId: 'u2', items: [] };
      orderRepo.findOne!.mockResolvedValue(order);

      await expect(service.findByIdAndUser('o1', 'u1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('cancelOrder', () => {
    it('should cancel a PENDING order', async () => {
      const order = { id: 'o1', userId: 'u1', status: OrderStatus.PENDING, items: [] };
      orderRepo.findOne!.mockResolvedValue(order);
      orderRepo.save!.mockImplementation(async (e) => e);

      const result = await service.cancelOrder('o1', 'u1');
      expect(result.status).toBe(OrderStatus.CANCELLED);
    });

    it('should throw BadRequestException when cancelling PAID order', async () => {
      const order = { id: 'o1', userId: 'u1', status: OrderStatus.PAID, items: [] };
      orderRepo.findOne!.mockResolvedValue(order);

      await expect(service.cancelOrder('o1', 'u1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all orders', async () => {
      const orders = [{ id: 'o1', items: [] }, { id: 'o2', items: [] }];
      orderRepo.find!.mockResolvedValue(orders);

      const result = await service.findAll();
      expect(result).toHaveLength(2);
    });
  });

  describe('adminUpdateStatus', () => {
    it('should update order status with valid transition', async () => {
      const order = { id: 'o1', userId: 'u1', status: OrderStatus.PAID, items: [] };
      orderRepo.findOne!.mockResolvedValue(order);
      orderRepo.save!.mockImplementation(async (e) => e);

      const result = await service.adminUpdateStatus('o1', { status: OrderStatus.SHIPPED });
      expect(result.status).toBe(OrderStatus.SHIPPED);
    });

    it('should throw BadRequestException for invalid transition', async () => {
      const order = { id: 'o1', userId: 'u1', status: OrderStatus.CANCELLED, items: [] };
      orderRepo.findOne!.mockResolvedValue(order);

      await expect(
        service.adminUpdateStatus('o1', { status: OrderStatus.PAID }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when order not found', async () => {
      orderRepo.findOne!.mockResolvedValue(null);

      await expect(
        service.adminUpdateStatus('o1', { status: OrderStatus.SHIPPED }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createOrder - idempotency', () => {
    it('should return existing order on idempotent hit', async () => {
      const existingOrder = { id: 'existing-o', userId: 'u1', items: [] };
      idempotencyRepo.findOne!.mockResolvedValue({
        key: 'existing-key',
        resourceId: 'existing-o',
      });
      orderRepo.findOne!.mockResolvedValue(existingOrder);

      const result = await service.createOrder('u1', {
        items: [{ productId: 'p1', productName: 'Test', price: 10, quantity: 1 }],
        address: { fullName: 'Test', email: 'a@b.com', phone: '123', address: 'St', city: 'C', postalCode: '12345', country: 'US' },
      }, 'existing-key');

      expect(result.id).toBe('existing-o');
      expect(orderRepo.create).not.toHaveBeenCalled();
    });

    it('should create new order when idempotency exists but order is missing', async () => {
      const newOrder = {
        id: 'new-o',
        userId: 'u1',
        status: OrderStatus.PENDING,
        subtotal: 10,
        shipping: 5.99,
        tax: 0.8,
        total: 16.79,
        shippingMethod: 'standard',
        addressSnapshot: { fullName: 'Test' },
        idempotencyKey: 'key1',
        paymentIntentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
      };

      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 }) as any;

      idempotencyRepo.findOne!.mockResolvedValue({
        key: 'key1',
        resourceId: 'missing-order',
      });
      orderRepo.findOne!.mockResolvedValueOnce(null);
      orderRepo.findOne!.mockResolvedValue({ ...newOrder, items: [] });
      orderRepo.create!.mockReturnValue(newOrder);
      orderRepo.save!.mockImplementation(async (e) => e);
      orderItemRepo.save!.mockResolvedValue([]);
      idempotencyRepo.save!.mockResolvedValue({});

      try {
        const result = await service.createOrder('u1', {
          items: [{ productId: 'p1', productName: 'Test', price: 10, quantity: 1 }],
          address: { fullName: 'Test', email: 'a@b.com', phone: '123', address: 'St', city: 'C', postalCode: '12345', country: 'US' },
        }, 'key1');

        expect(result).toBeDefined();
        expect(result.id).toBe('new-o');
      } finally {
        global.fetch = originalFetch;
      }
    });
  });
});
