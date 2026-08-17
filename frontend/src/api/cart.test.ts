import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCartApi,
  mergeGuestCart,
  lockCartForCheckout,
  unlockCartCheckout,
} from './cart';

vi.mock('./client', () => ({
  apiClient: vi.fn(),
}));

import { apiClient } from './client';
const mockApiClient = vi.mocked(apiClient);

const mockCartResponse = {
  id: 'cart-1',
  userId: 'user-1',
  items: [],
  totalItems: 0,
  subtotal: 0,
  checkoutInProgress: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockApiClient.mockResolvedValue(mockCartResponse);
});

describe('cart api', () => {
  it('fetchCart calls GET /cart', async () => {
    const result = await fetchCart();
    expect(mockApiClient).toHaveBeenCalledWith('/cart');
    expect(result).toEqual(mockCartResponse);
  });

  it('addToCart calls POST /cart/items with serialized body', async () => {
    const item = { productId: 'p1', productName: 'Widget', price: 9.99, quantity: 2 };
    await addToCart(item);
    expect(mockApiClient).toHaveBeenCalledWith('/cart/items', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  });

  it('updateCartItem calls PATCH /cart/items/:itemId with quantity', async () => {
    await updateCartItem('item-1', 5);
    expect(mockApiClient).toHaveBeenCalledWith('/cart/items/item-1', {
      method: 'PATCH',
      body: JSON.stringify({ quantity: 5 }),
    });
  });

  it('removeCartItem calls DELETE /cart/items/:itemId', async () => {
    await removeCartItem('item-1');
    expect(mockApiClient).toHaveBeenCalledWith('/cart/items/item-1', {
      method: 'DELETE',
    });
  });

  it('clearCartApi calls DELETE /cart', async () => {
    await clearCartApi();
    expect(mockApiClient).toHaveBeenCalledWith('/cart', { method: 'DELETE' });
  });

  it('mergeGuestCart calls POST /cart/merge with items body', async () => {
    const items = [{ productId: 'p1', productName: 'A', price: 1, quantity: 1 }];
    await mergeGuestCart(items);
    expect(mockApiClient).toHaveBeenCalledWith('/cart/merge', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  });

  it('lockCartForCheckout calls POST /cart/checkout-lock', async () => {
    await lockCartForCheckout();
    expect(mockApiClient).toHaveBeenCalledWith('/cart/checkout-lock', {
      method: 'POST',
    });
  });

  it('unlockCartCheckout calls POST /cart/checkout-unlock', async () => {
    await unlockCartCheckout();
    expect(mockApiClient).toHaveBeenCalledWith('/cart/checkout-unlock', {
      method: 'POST',
    });
  });
});
