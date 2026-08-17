import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { CartProvider, useCart } from './CartContext';

vi.mock('../api/cart', () => ({
  fetchCart: vi.fn(),
  addToCart: vi.fn(),
  updateCartItem: vi.fn(),
  removeCartItem: vi.fn(),
  clearCartApi: vi.fn(),
  mergeGuestCart: vi.fn(),
}));

vi.mock('../api/auth', () => ({
  getAccessToken: vi.fn(),
}));

import {
  fetchCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCartApi,
  mergeGuestCart,
} from '../api/cart';
import { getAccessToken } from '../api/auth';

const mockFetchCart = vi.mocked(fetchCart);
const mockApiAddToCart = vi.mocked(addToCart);
const mockApiUpdateCartItem = vi.mocked(updateCartItem);
const mockApiRemoveCartItem = vi.mocked(removeCartItem);
const mockClearCartApi = vi.mocked(clearCartApi);
const mockMergeGuestCart = vi.mocked(mergeGuestCart);
const mockGetAccessToken = vi.mocked(getAccessToken);

const cartDto = (
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    price: number;
    quantity: number;
  }>,
) => ({
  id: 'cart-1',
  userId: 'user-1',
  items: items.map((i) => ({ ...i, lineTotal: i.price * i.quantity })),
  totalItems: items.reduce((s, i) => s + i.quantity, 0),
  subtotal: items.reduce((s, i) => s + i.price * i.quantity, 0),
  checkoutInProgress: false,
});

const wrapper = ({ children }: { children: ReactNode }) => <CartProvider>{children}</CartProvider>;

describe('CartContext (API mode - authenticated)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('fetches cart from API on mount when authenticated', async () => {
    mockGetAccessToken.mockReturnValue('token');
    mockFetchCart.mockResolvedValue(
      cartDto([{ id: 'ci-1', productId: 'p1', productName: 'X', price: 10, quantity: 2 }]),
    );

    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockFetchCart).toHaveBeenCalled();
    expect(result.current.items).toEqual([
      { id: 'ci-1', productId: 'p1', name: 'X', price: 10, quantity: 2 },
    ]);
    expect(result.current.totalItems).toBe(2);
    expect(result.current.totalPrice).toBe(20);
  });

  it('merges guest cart on login', async () => {
    localStorage.setItem(
      'cart-items',
      JSON.stringify([{ id: 'g1', productId: 'pg1', name: 'Guest Item', price: 5, quantity: 1 }]),
    );
    mockGetAccessToken.mockReturnValue('token');
    mockMergeGuestCart.mockResolvedValue(
      cartDto([{ id: 'ci-2', productId: 'pg1', productName: 'Guest Item', price: 5, quantity: 1 }]),
    );

    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockMergeGuestCart).toHaveBeenCalledWith([
      { productId: 'pg1', productName: 'Guest Item', price: 5, quantity: 1 },
    ]);
    expect(result.current.items).toEqual([
      { id: 'ci-2', productId: 'pg1', name: 'Guest Item', price: 5, quantity: 1 },
    ]);
  });

  it('addItem calls API when authenticated', async () => {
    mockGetAccessToken.mockReturnValue('token');
    mockFetchCart.mockResolvedValue(cartDto([]));
    mockApiAddToCart.mockResolvedValue(
      cartDto([{ id: 'ci-3', productId: 'p2', productName: 'Y', price: 50, quantity: 1 }]),
    );

    const { result } = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.addItem({ id: 'p2', name: 'Y', price: 50 });
    });

    expect(mockApiAddToCart).toHaveBeenCalledWith({
      productId: 'p2',
      productName: 'Y',
      price: 50,
      quantity: 1,
    });
    expect(result.current.items).toEqual([
      { id: 'ci-3', productId: 'p2', name: 'Y', price: 50, quantity: 1 },
    ]);
  });

  it('removeItem calls API when authenticated', async () => {
    mockGetAccessToken.mockReturnValue('token');
    mockFetchCart.mockResolvedValue(
      cartDto([
        { id: 'ci-4', productId: 'p3', productName: 'Z', price: 20, quantity: 1 },
        { id: 'ci-5', productId: 'p4', productName: 'W', price: 30, quantity: 2 },
      ]),
    );
    mockApiRemoveCartItem.mockResolvedValue(
      cartDto([{ id: 'ci-5', productId: 'p4', productName: 'W', price: 30, quantity: 2 }]),
    );

    const { result } = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(result.current.items.length).toBe(2));

    await act(async () => {
      await result.current.removeItem('p3');
    });

    expect(mockApiRemoveCartItem).toHaveBeenCalledWith('ci-4');
    expect(result.current.items.length).toBe(1);
  });

  it('updateQuantity calls API when authenticated', async () => {
    mockGetAccessToken.mockReturnValue('token');
    mockFetchCart.mockResolvedValue(
      cartDto([{ id: 'ci-6', productId: 'p5', productName: 'Q', price: 10, quantity: 1 }]),
    );
    mockApiUpdateCartItem.mockResolvedValue(
      cartDto([{ id: 'ci-6', productId: 'p5', productName: 'Q', price: 10, quantity: 5 }]),
    );

    const { result } = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(result.current.items.length).toBe(1));

    await act(async () => {
      await result.current.updateQuantity('p5', 5);
    });

    expect(mockApiUpdateCartItem).toHaveBeenCalledWith('ci-6', 5);
    expect(result.current.items[0]?.quantity).toBe(5);
  });

  it('clearCart calls API when authenticated', async () => {
    mockGetAccessToken.mockReturnValue('token');
    mockFetchCart.mockResolvedValue(
      cartDto([{ id: 'ci-7', productId: 'p6', productName: 'R', price: 15, quantity: 3 }]),
    );
    mockClearCartApi.mockResolvedValue(undefined as never);

    const { result } = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(result.current.items.length).toBe(1));

    await act(async () => {
      await result.current.clearCart();
    });

    expect(mockClearCartApi).toHaveBeenCalled();
    expect(result.current.items).toEqual([]);
  });

  it('does not persist to localStorage when authenticated', async () => {
    mockGetAccessToken.mockReturnValue('token');
    mockFetchCart.mockResolvedValue(cartDto([]));

    renderHook(() => useCart(), { wrapper });

    expect(localStorage.getItem('cart-items')).toBeNull();
  });
});

describe('CartContext (error resilience - API mode)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('keeps guest cart if merge API fails', async () => {
    localStorage.setItem(
      'cart-items',
      JSON.stringify([{ id: 'g2', productId: 'pg2', name: 'Backup', price: 10, quantity: 1 }]),
    );
    mockGetAccessToken.mockReturnValue('token');
    mockMergeGuestCart.mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.items).toEqual([
      { id: 'g2', productId: 'pg2', name: 'Backup', price: 10, quantity: 1 },
    ]);
  });

  it('addItem silently fails if API throws', async () => {
    mockGetAccessToken.mockReturnValue('token');
    mockFetchCart.mockResolvedValue(cartDto([]));
    mockApiAddToCart.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.addItem({ id: 'p7', name: 'F', price: 1 });
    });

    expect(result.current.items).toEqual([]);
  });

  it('removeItem silently fails if API throws', async () => {
    mockGetAccessToken.mockReturnValue('token');
    mockFetchCart.mockResolvedValue(
      cartDto([{ id: 'ci-8', productId: 'p8', productName: 'K', price: 5, quantity: 1 }]),
    );
    mockApiRemoveCartItem.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(result.current.items.length).toBe(1));

    await act(async () => {
      await result.current.removeItem('p8');
    });

    expect(result.current.items.length).toBe(1);
  });

  it('clearCart silently fails if API throws', async () => {
    mockGetAccessToken.mockReturnValue('token');
    mockFetchCart.mockResolvedValue(
      cartDto([{ id: 'ci-9', productId: 'p9', productName: 'L', price: 8, quantity: 1 }]),
    );
    mockClearCartApi.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(result.current.items.length).toBe(1));

    await act(async () => {
      await result.current.clearCart();
    });

    expect(result.current.items.length).toBe(1);
  });
});
