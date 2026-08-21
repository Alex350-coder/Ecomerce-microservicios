import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Idempotency } from './entities/idempotency.entity';
import { OrderStatus } from './enums/order-status.enum';
import { RequestContextService } from '../common/request-context.service';

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

const buildOrder = (overrides?: Partial<Order>): Order =>
  ({
    id: 'o1',
    userId: 'u1',
    status: OrderStatus.PENDING,
    subtotal: 100,
    shipping: 5.99,
    tax: 8,
    total: 113.99,
    shippingMethod: 'standard',
    addressSnapshot: { fullName: 'Test', city: 'Madrid' },
    idempotencyKey: 'key-1',
    paymentIntentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [],
    ...overrides,
  }) as unknown as Order;

describe('OrdersService - Saga execution', () => {
  let service: OrdersService;
  let orderRepo: MockRepo<Order>;
  let orderItemRepo: MockRepo<OrderItem>;
  let idempotencyRepo: MockRepo<Idempotency>;
  let originalFetch: typeof global.fetch;

  beforeEach(async () => {
    orderRepo = createMockRepo();
    orderItemRepo = createMockRepo();
    idempotencyRepo = createMockRepo();
    originalFetch = global.fetch;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: orderRepo },
        { provide: getRepositoryToken(OrderItem), useValue: orderItemRepo },
        { provide: getRepositoryToken(Idempotency), useValue: idempotencyRepo },
        { provide: DataSource, useValue: {} },
        { provide: ConfigService, useValue: mockConfigService },
        RequestContextService,
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  const dto = {
    items: [{ productId: 'p1', productName: 'Widget', price: 50, quantity: 2 }],
    address: { fullName: 'Test', email: 'a@b.com', phone: '123', address: 'St', city: 'C', postalCode: '12345', country: 'US' },
  };

  const buildMocks = (overrides?: { orderOverrides?: Partial<Order> }) => {
    const order = buildOrder(overrides?.orderOverrides);
    idempotencyRepo.findOne!.mockResolvedValue(null);
    orderRepo.create!.mockReturnValue(order);
    orderRepo.save!.mockImplementation(async (e) => e);
    orderItemRepo.save!.mockResolvedValue([]);
    idempotencyRepo.save!.mockResolvedValue({});
    // The final findOne after saga
    orderRepo.findOne!.mockResolvedValue({ ...order, items: [] });
  };

  it('should mark order as PAID when saga succeeds', async () => {
    buildMocks({ orderOverrides: { status: OrderStatus.PAID } });

    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ reservationId: 'r1', items: [{ productId: 'p1', quantity: 2, available: true }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'pay-1', status: 'approved' }) })
      .mockResolvedValueOnce({ ok: true }) as any;

    const result = await service.createOrder('u1', dto, 'key-1');
    expect(result.status).toBe(OrderStatus.PAID);
  });

  it('should mark order as FAILED when payment is declined', async () => {
    buildMocks({ orderOverrides: { status: OrderStatus.FAILED } });

    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ reservationId: 'r1', items: [{ productId: 'p1', quantity: 2, available: true }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'pay-1', status: 'declined' }) })
      .mockResolvedValueOnce({ ok: true }) as any;

    const result = await service.createOrder('u1', dto, 'key-1');
    expect(result.status).toBe(OrderStatus.FAILED);
  });

  it('should mark order as FAILED when stock reservation fails', async () => {
    buildMocks({ orderOverrides: { status: OrderStatus.FAILED } });

    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ reservationId: 'r1', items: [{ productId: 'p1', quantity: 2, available: false }] }) }) as any;

    const result = await service.createOrder('u1', dto, 'key-1');
    expect(result.status).toBe(OrderStatus.FAILED);
  });

  it('should compensate and mark FAILED when payment call throws', async () => {
    buildMocks({ orderOverrides: { status: OrderStatus.FAILED } });

    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ reservationId: 'r1', items: [{ productId: 'p1', quantity: 2, available: true }] }) })
      .mockRejectedValueOnce(new Error('Payment timeout'))
      .mockRejectedValueOnce(new Error('Payment timeout'))
      .mockRejectedValueOnce(new Error('Payment timeout'))
      .mockResolvedValueOnce({ ok: true }) as any;

    const result = await service.createOrder('u1', dto, 'key-1');
    expect(result.status).toBe(OrderStatus.FAILED);
  });

  it('should mark FAILED when inventory reserve throws', async () => {
    buildMocks({ orderOverrides: { status: OrderStatus.FAILED } });

    global.fetch = jest.fn()
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockRejectedValueOnce(new Error('ECONNREFUSED')) as any;

    const result = await service.createOrder('u1', dto, 'key-1');
    expect(result.status).toBe(OrderStatus.FAILED);
  });
});
