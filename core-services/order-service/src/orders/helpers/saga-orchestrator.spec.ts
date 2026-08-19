import { SagaOrchestrator } from './saga-orchestrator';
import { OrderStatus } from '../enums/order-status.enum';

describe('SagaOrchestrator', () => {
  let orchestrator: SagaOrchestrator;

  beforeEach(() => {
    orchestrator = new SagaOrchestrator();
  });

  describe('determineCompensation', () => {
    it('should return deleteOrder when reserve fails', () => {
      const result = orchestrator.determineCompensation('reserve');
      expect(result).toEqual({ releaseStock: false, cancelPayment: false, deleteOrder: true });
    });

    it('should return releaseStock and cancelPayment when payment fails', () => {
      const result = orchestrator.determineCompensation('payment');
      expect(result).toEqual({ releaseStock: true, cancelPayment: true, deleteOrder: false });
    });

    it('should return all false for unknown step', () => {
      const result = orchestrator.determineCompensation('unknown' as any);
      expect(result).toEqual({ releaseStock: false, cancelPayment: false, deleteOrder: false });
    });
  });

  describe('validateTransition', () => {
    it('should validate PENDING to PAID', () => {
      expect(orchestrator.validateTransition(OrderStatus.PENDING, OrderStatus.PAID)).toBe(true);
    });

    it('should reject DELIVERED to PENDING', () => {
      expect(orchestrator.validateTransition(OrderStatus.DELIVERED, OrderStatus.PENDING)).toBe(false);
    });
  });

  describe('canUserCancel', () => {
    it('should allow cancel for PENDING', () => {
      expect(orchestrator.canUserCancel(OrderStatus.PENDING)).toBe(true);
    });

    it('should deny cancel for SHIPPED', () => {
      expect(orchestrator.canUserCancel(OrderStatus.SHIPPED)).toBe(false);
    });
  });
});
