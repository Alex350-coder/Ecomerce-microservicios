import { isValidTransition, canCancel, canAdminUpdate } from './status-machine';
import { OrderStatus } from '../enums/order-status.enum';

describe('Status Machine', () => {
  describe('isValidTransition', () => {
    it('should allow PENDING → PAID', () => {
      expect(isValidTransition(OrderStatus.PENDING, OrderStatus.PAID)).toBe(true);
    });

    it('should allow PENDING → FAILED', () => {
      expect(isValidTransition(OrderStatus.PENDING, OrderStatus.FAILED)).toBe(true);
    });

    it('should allow PENDING → CANCELLED', () => {
      expect(isValidTransition(OrderStatus.PENDING, OrderStatus.CANCELLED)).toBe(true);
    });

    it('should allow PAID → SHIPPED', () => {
      expect(isValidTransition(OrderStatus.PAID, OrderStatus.SHIPPED)).toBe(true);
    });

    it('should allow PAID → CANCELLED', () => {
      expect(isValidTransition(OrderStatus.PAID, OrderStatus.CANCELLED)).toBe(true);
    });

    it('should allow SHIPPED → DELIVERED', () => {
      expect(isValidTransition(OrderStatus.SHIPPED, OrderStatus.DELIVERED)).toBe(true);
    });

    it('should allow FAILED → PENDING', () => {
      expect(isValidTransition(OrderStatus.FAILED, OrderStatus.PENDING)).toBe(true);
    });

    it('should reject CANCELLED → PAID', () => {
      expect(isValidTransition(OrderStatus.CANCELLED, OrderStatus.PAID)).toBe(false);
    });

    it('should reject DELIVERED → SHIPPED', () => {
      expect(isValidTransition(OrderStatus.DELIVERED, OrderStatus.SHIPPED)).toBe(false);
    });

    it('should reject PAID → PENDING', () => {
      expect(isValidTransition(OrderStatus.PAID, OrderStatus.PENDING)).toBe(false);
    });
  });

  describe('canCancel', () => {
    it('should allow cancel for PENDING', () => {
      expect(canCancel(OrderStatus.PENDING)).toBe(true);
    });

    it('should reject cancel for PAID', () => {
      expect(canCancel(OrderStatus.PAID)).toBe(false);
    });

    it('should reject cancel for SHIPPED', () => {
      expect(canCancel(OrderStatus.SHIPPED)).toBe(false);
    });

    it('should reject cancel for CANCELLED', () => {
      expect(canCancel(OrderStatus.CANCELLED)).toBe(false);
    });
  });

  describe('canAdminUpdate', () => {
    it('should allow admin update for PAID', () => {
      expect(canAdminUpdate(OrderStatus.PAID)).toBe(true);
    });

    it('should allow admin update for SHIPPED', () => {
      expect(canAdminUpdate(OrderStatus.SHIPPED)).toBe(true);
    });

    it('should allow admin update for DELIVERED', () => {
      expect(canAdminUpdate(OrderStatus.DELIVERED)).toBe(true);
    });

    it('should reject admin update for PENDING', () => {
      expect(canAdminUpdate(OrderStatus.PENDING)).toBe(false);
    });
  });
});
