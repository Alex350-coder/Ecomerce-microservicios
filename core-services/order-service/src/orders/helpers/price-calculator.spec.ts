import { calculateOrderTotals } from './price-calculator';

describe('Price Calculator', () => {
  const items = [
    { productId: 'p1', productName: 'Test Product 1', price: 100, quantity: 2 },
    { productId: 'p2', productName: 'Test Product 2', price: 50, quantity: 1 },
  ];

  it('should calculate subtotal correctly', () => {
    const result = calculateOrderTotals(items, 'standard');
    expect(result.subtotal).toBe(250);
  });

  it('should apply standard shipping rate', () => {
    const result = calculateOrderTotals(items, 'standard');
    expect(result.shipping).toBe(5.99);
  });

  it('should apply express shipping rate', () => {
    const result = calculateOrderTotals(items, 'express');
    expect(result.shipping).toBe(12.99);
  });

  it('should apply priority shipping rate', () => {
    const result = calculateOrderTotals(items, 'priority');
    expect(result.shipping).toBe(24.99);
  });

  it('should default to standard shipping for unknown method', () => {
    const result = calculateOrderTotals(items, 'unknown');
    expect(result.shipping).toBe(5.99);
  });

  it('should calculate tax at 8%', () => {
    const result = calculateOrderTotals(items, 'standard');
    expect(result.tax).toBe(20);
  });

  it('should calculate total as subtotal + shipping + tax', () => {
    const result = calculateOrderTotals(items, 'standard');
    expect(result.total).toBe(275.99);
  });

  it('should handle single item', () => {
    const singleItem = [{ productId: 'p1', productName: 'Test', price: 10, quantity: 1 }];
    const result = calculateOrderTotals(singleItem, 'standard');
    expect(result.subtotal).toBe(10);
    expect(result.tax).toBe(0.8);
    expect(result.total).toBe(16.79);
  });

  it('should handle empty items', () => {
    const result = calculateOrderTotals([], 'standard');
    expect(result.subtotal).toBe(0);
    expect(result.total).toBe(5.99);
  });
});
