import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentsService } from './payments.service';
import { PaymentIntent } from './entities/payment-intent.entity';
import { PaymentStatus } from './enums/payment-status.enum';
import { PaymentMethod } from './enums/payment-method.enum';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';

type MockRepo<T extends object = Record<string, unknown>> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

const createMockRepo = <T extends object = Record<string, unknown>>(): MockRepo<T> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

describe('PaymentsService', () => {
  let service: PaymentsService;
  let paymentRepo: MockRepo<PaymentIntent>;

  beforeEach(async () => {
    paymentRepo = createMockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: getRepositoryToken(PaymentIntent), useValue: paymentRepo },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createIntent', () => {
    const dto = {
      orderId: 'order-uuid-1',
      amount: 99.99,
      method: PaymentMethod.CREDIT_CARD,
      items: [{ productId: 'prod-1', quantity: 1, unitPrice: 99.99 }],
    };

    it('should create a new payment intent and process it', async () => {
      (paymentRepo.findOne as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      (paymentRepo.create as jest.Mock).mockImplementation((entity: Record<string, unknown>) => ({
        id: 'intent-uuid-1',
        ...entity,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      (paymentRepo.save as jest.Mock).mockImplementation((entity: Record<string, unknown>) =>
        Promise.resolve(entity),
      );

      const result = await service.createIntent(dto, 'test-idempotency-key');

      expect(result.status).toBe(PaymentStatus.APPROVED);
      expect(result.orderId).toBe('order-uuid-1');
      expect(result.amount).toBe(99.99);
      expect(paymentRepo.create).toHaveBeenCalled();
      expect(paymentRepo.save).toHaveBeenCalled();
    });

    it('should return existing intent on idempotent hit', async () => {
      const existingIntent = {
        id: 'existing-intent',
        orderId: 'order-uuid-1',
        status: PaymentStatus.APPROVED,
        idempotencyKey: 'test-key',
      };
      (paymentRepo.findOne as jest.Mock).mockResolvedValue(existingIntent);

      const result = await service.createIntent(dto, 'test-key');

      expect(result.id).toBe('existing-intent');
      expect(paymentRepo.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if order already has a payment intent', async () => {
      (paymentRepo.findOne as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'existing', orderId: 'order-uuid-1' });

      await expect(service.createIntent(dto, 'new-key')).rejects.toThrow(ConflictException);
    });

    it('should decline payment when deterministic rule triggers', async () => {
      (paymentRepo.findOne as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      (paymentRepo.create as jest.Mock).mockImplementation((entity: Record<string, unknown>) => ({
        id: 'intent-decline',
        ...entity,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      (paymentRepo.save as jest.Mock).mockImplementation((entity: Record<string, unknown>) =>
        Promise.resolve(entity),
      );

      const declineKey = 'dtest-key';
      const result = await service.createIntent(dto, declineKey);

      expect(result.status).toBe(PaymentStatus.FAILED);
      expect(result.failureReason).toContain('rechazado');
    });

    it('should use generated uuid when no idempotency key provided', async () => {
      (paymentRepo.findOne as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      (paymentRepo.create as jest.Mock).mockImplementation((entity: Record<string, unknown>) => ({
        id: 'intent-uuid',
        ...entity,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      (paymentRepo.save as jest.Mock).mockImplementation((entity: Record<string, unknown>) =>
        Promise.resolve(entity),
      );

      const result = await service.createIntent(dto);

      expect(result.idempotencyKey).toBeDefined();
      expect([PaymentStatus.APPROVED, PaymentStatus.FAILED]).toContain(result.status);
    });
  });

  describe('findById', () => {
    it('should return a payment intent', async () => {
      const intent = { id: 'intent-1', status: PaymentStatus.APPROVED };
      (paymentRepo.findOne as jest.Mock).mockResolvedValue(intent);

      const result = await service.findById('intent-1');
      expect(result.id).toBe('intent-1');
    });

    it('should throw NotFoundException if not found', async () => {
      (paymentRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByOrderId', () => {
    it('should return a payment intent by order id', async () => {
      const intent = { id: 'intent-1', orderId: 'order-1' };
      (paymentRepo.findOne as jest.Mock).mockResolvedValue(intent);

      const result = await service.findByOrderId('order-1');
      expect(result.orderId).toBe('order-1');
    });

    it('should throw NotFoundException if not found', async () => {
      (paymentRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findByOrderId('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('approvePayment', () => {
    it('should approve a pending payment', async () => {
      const intent = { id: 'i1', status: PaymentStatus.PENDING };
      (paymentRepo.findOne as jest.Mock).mockResolvedValue(intent);
      (paymentRepo.save as jest.Mock).mockImplementation((e: Record<string, unknown>) =>
        Promise.resolve(e),
      );

      const result = await service.approvePayment('i1');
      expect(result.status).toBe(PaymentStatus.APPROVED);
    });

    it('should throw BadRequestException if already approved', async () => {
      const intent = { id: 'i1', status: PaymentStatus.APPROVED };
      (paymentRepo.findOne as jest.Mock).mockResolvedValue(intent);

      await expect(service.approvePayment('i1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('failPayment', () => {
    it('should fail a pending payment', async () => {
      const intent = { id: 'i1', status: PaymentStatus.PENDING };
      (paymentRepo.findOne as jest.Mock).mockResolvedValue(intent);
      (paymentRepo.save as jest.Mock).mockImplementation((e: Record<string, unknown>) =>
        Promise.resolve(e),
      );

      const result = await service.failPayment('i1', 'insufficient funds');
      expect(result.status).toBe(PaymentStatus.FAILED);
      expect(result.failureReason).toBe('insufficient funds');
    });

    it('should throw BadRequestException if already approved', async () => {
      const intent = { id: 'i1', status: PaymentStatus.APPROVED };
      (paymentRepo.findOne as jest.Mock).mockResolvedValue(intent);

      await expect(service.failPayment('i1', 'reason')).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelPayment', () => {
    it('should cancel a pending payment', async () => {
      const intent = { id: 'i1', status: PaymentStatus.PENDING };
      (paymentRepo.findOne as jest.Mock).mockResolvedValue(intent);
      (paymentRepo.save as jest.Mock).mockImplementation((e: Record<string, unknown>) =>
        Promise.resolve(e),
      );

      const result = await service.cancelPayment('i1');
      expect(result.status).toBe(PaymentStatus.CANCELLED);
    });

    it('should throw BadRequestException if already approved', async () => {
      const intent = { id: 'i1', status: PaymentStatus.APPROVED };
      (paymentRepo.findOne as jest.Mock).mockResolvedValue(intent);

      await expect(service.cancelPayment('i1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('deterministicRule', () => {
    it('should return true (decline) when first char code % 10 === 0', () => {
      expect(service.deterministicRule('Zabc')).toBe(true);
      expect(service.deterministicRule('dtest')).toBe(true);
      expect(service.deterministicRule('xfoo')).toBe(true);
    });

    it('should return false (approve) otherwise', () => {
      expect(service.deterministicRule('Aabc')).toBe(false);
      expect(service.deterministicRule('1xyz')).toBe(false);
      expect(service.deterministicRule('atest')).toBe(false);
    });
  });
});
