import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { type ReactNode } from 'react';
import { CartProvider, useCart } from './CartContext';

const wrapper = ({ children }: { children: ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

describe('CartContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with an empty cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.items).toEqual([]);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.totalPrice).toBe(0);
  });

  it('addItem adds a new product', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem({ id: 'p1', name: 'iPhone', price: 999 });
    });

    expect(result.current.items).toEqual([
      { id: 'p1', name: 'iPhone', price: 999, quantity: 1 },
    ]);
    expect(result.current.totalItems).toBe(1);
    expect(result.current.totalPrice).toBe(999);
  });

  it('addItem increments quantity when the product already exists', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem({ id: 'p1', name: 'iPhone', price: 999 });
      result.current.addItem({ id: 'p1', name: 'iPhone', price: 999 });
    });

    expect(result.current.items).toEqual([
      { id: 'p1', name: 'iPhone', price: 999, quantity: 2 },
    ]);
    expect(result.current.totalPrice).toBe(1998);
  });

  it('removeItem deletes the product', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem({ id: 'p1', name: 'iPhone', price: 999 });
      result.current.addItem({ id: 'p2', name: 'MacBook', price: 1999 });
      result.current.removeItem('p1');
    });

    expect(result.current.items).toEqual([
      { id: 'p2', name: 'MacBook', price: 1999, quantity: 1 },
    ]);
  });

  it('updateQuantity changes quantity and clamps below 1', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem({ id: 'p1', name: 'iPhone', price: 999 });
      result.current.updateQuantity('p1', 3);
      result.current.updateQuantity('p1', 0);
    });

    expect(result.current.items[0]?.quantity).toBe(1);
  });

  it('clearCart empties the cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem({ id: 'p1', name: 'iPhone', price: 999 });
      result.current.clearCart();
    });

    expect(result.current.items).toEqual([]);
  });

  it('persists items to localStorage', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem({ id: 'p1', name: 'iPhone', price: 999 });
    });

    const stored = JSON.parse(localStorage.getItem('cart-items') || '[]');
    expect(stored).toEqual([{ id: 'p1', name: 'iPhone', price: 999, quantity: 1 }]);
  });

  it('hydrates from localStorage on mount', () => {
    localStorage.setItem(
      'cart-items',
      JSON.stringify([{ id: 'p1', name: 'iPhone', price: 999, quantity: 2 }]),
    );

    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.items).toEqual([
      { id: 'p1', name: 'iPhone', price: 999, quantity: 2 },
    ]);
    expect(result.current.totalItems).toBe(2);
  });
});
