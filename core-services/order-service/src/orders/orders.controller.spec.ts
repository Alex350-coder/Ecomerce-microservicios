import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderStatus } from './enums/order-status.enum';

describe('OrdersController', () => {
  let controller: OrdersController;

  const mockService = {
    createOrder: jest.fn(),
    findByUser: jest.fn(),
    findByIdAndUser: jest.fn(),
    cancelOrder: jest.fn(),
    findAll: jest.fn(),
    adminUpdateStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [{ provide: OrdersService, useValue: mockService }],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createOrder', () => {
    it('should create an order', async () => {
      const order = {
        id: 'o1',
        userId: 'u1',
        status: OrderStatus.PENDING,
        items: [],
        subtotal: 100,
        shipping: 5.99,
        tax: 8,
        total: 113.99,
        shippingMethod: 'standard',
        addressSnapshot: null,
        paymentIntentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockService.createOrder.mockResolvedValue(order);

      const result = await controller.createOrder(
        { userId: 'u1', email: 'a@b.com', role: 'user' },
        {
          items: [],
          address: {
            fullName: 'Test',
            email: 'a@b.com',
            phone: '123',
            address: 'St',
            city: 'C',
            postalCode: '12345',
            country: 'US',
          },
        },
        'idem-key',
      );

      expect(result.id).toBe('o1');
      expect(result.status).toBe(OrderStatus.PENDING);
    });
  });

  describe('findMyOrders', () => {
    it('should return user orders', async () => {
      const orders = [
        {
          id: 'o1',
          userId: 'u1',
          status: OrderStatus.PENDING,
          items: [],
          subtotal: 0,
          shipping: 0,
          tax: 0,
          total: 0,
          shippingMethod: 'standard',
          addressSnapshot: null,
          paymentIntentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockService.findByUser.mockResolvedValue(orders);

      const result = await controller.findMyOrders({
        userId: 'u1',
        email: 'a@b.com',
        role: 'user',
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a single order', async () => {
      const order = {
        id: 'o1',
        userId: 'u1',
        status: OrderStatus.PAID,
        items: [],
        subtotal: 100,
        shipping: 5.99,
        tax: 8,
        total: 113.99,
        shippingMethod: 'standard',
        addressSnapshot: null,
        paymentIntentId: 'pi-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockService.findByIdAndUser.mockResolvedValue(order);

      const result = await controller.findOne(
        { userId: 'u1', email: 'a@b.com', role: 'user' },
        'o1',
      );
      expect(result.id).toBe('o1');
    });
  });

  describe('cancelOrder', () => {
    it('should cancel an order', async () => {
      const order = {
        id: 'o1',
        userId: 'u1',
        status: OrderStatus.CANCELLED,
        items: [],
        subtotal: 100,
        shipping: 5.99,
        tax: 8,
        total: 113.99,
        shippingMethod: 'standard',
        addressSnapshot: null,
        paymentIntentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockService.cancelOrder.mockResolvedValue(order);

      const result = await controller.cancelOrder(
        { userId: 'u1', email: 'a@b.com', role: 'user' },
        'o1',
      );
      expect(result.status).toBe(OrderStatus.CANCELLED);
    });
  });

  describe('findAllAdmin', () => {
    it('should return all orders for admin', async () => {
      const orders = [
        {
          id: 'o1',
          userId: 'u1',
          status: OrderStatus.PENDING,
          items: [],
          subtotal: 0,
          shipping: 0,
          tax: 0,
          total: 0,
          shippingMethod: 'standard',
          addressSnapshot: null,
          paymentIntentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockService.findAll.mockResolvedValue(orders);

      const result = await controller.findAllAdmin();
      expect(result).toHaveLength(1);
    });
  });

  describe('adminUpdateStatus', () => {
    it('should update order status', async () => {
      const order = {
        id: 'o1',
        userId: 'u1',
        status: OrderStatus.SHIPPED,
        items: [],
        subtotal: 100,
        shipping: 5.99,
        tax: 8,
        total: 113.99,
        shippingMethod: 'standard',
        addressSnapshot: null,
        paymentIntentId: 'pi-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockService.adminUpdateStatus.mockResolvedValue(order);

      const result = await controller.adminUpdateStatus('o1', { status: OrderStatus.SHIPPED });
      expect(result.status).toBe(OrderStatus.SHIPPED);
    });
  });
});
