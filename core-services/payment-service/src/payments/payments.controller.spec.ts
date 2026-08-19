import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentStatus } from './enums/payment-status.enum';
import { PaymentMethod } from './enums/payment-method.enum';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: PaymentsService;

  const mockService = {
    createIntent: jest.fn(),
    findById: jest.fn(),
    findByOrderId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [{ provide: PaymentsService, useValue: mockService }],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    service = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createIntent', () => {
    it('should create a payment intent', async () => {
      const intent = {
        id: 'intent-1',
        orderId: 'order-1',
        amount: 50,
        method: PaymentMethod.CREDIT_CARD,
        status: PaymentStatus.APPROVED,
        failureReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockService.createIntent.mockResolvedValue(intent);

      const result = await controller.createIntent(
        { userId: 'u1', email: 'a@b.com', role: 'user' },
        { orderId: 'order-1', amount: 50, method: PaymentMethod.CREDIT_CARD, items: [] },
        'idem-key',
      );

      expect(result.id).toBe('intent-1');
      expect(result.status).toBe(PaymentStatus.APPROVED);
      expect(service.createIntent).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a payment intent', async () => {
      const intent = {
        id: 'intent-1',
        orderId: 'order-1',
        amount: 100,
        method: PaymentMethod.PAYPAL,
        status: PaymentStatus.PENDING,
        failureReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockService.findById.mockResolvedValue(intent);

      const result = await controller.findOne('intent-1');
      expect(result.id).toBe('intent-1');
    });
  });

  describe('findByOrderId', () => {
    it('should return a payment intent by order id', async () => {
      const intent = {
        id: 'intent-1',
        orderId: 'order-1',
        amount: 100,
        method: PaymentMethod.BANK_TRANSFER,
        status: PaymentStatus.APPROVED,
        failureReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockService.findByOrderId.mockResolvedValue(intent);

      const result = await controller.findByOrderId('order-1');
      expect(result.orderId).toBe('order-1');
    });
  });
});
