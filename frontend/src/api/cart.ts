import { apiClient } from './client';

export interface CartItemDto {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  lineTotal: number;
}

export interface CartDto {
  id: string;
  userId: string;
  items: CartItemDto[];
  totalItems: number;
  subtotal: number;
  checkoutInProgress: boolean;
}

export interface AddCartItemInput {
  productId: string;
  productName: string;
  price: number;
  quantity?: number;
}

export interface MergeCartItemInput {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

export async function fetchCart(): Promise<CartDto> {
  return apiClient<CartDto>('/cart');
}

export async function addToCart(item: AddCartItemInput): Promise<CartDto> {
  return apiClient<CartDto>('/cart/items', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export async function updateCartItem(itemId: string, quantity: number): Promise<CartDto> {
  return apiClient<CartDto>(`/cart/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity }),
  });
}

export async function removeCartItem(itemId: string): Promise<CartDto> {
  return apiClient<CartDto>(`/cart/items/${itemId}`, {
    method: 'DELETE',
  });
}

export async function clearCartApi(): Promise<void> {
  await apiClient<void>('/cart', { method: 'DELETE' });
}

export async function mergeGuestCart(items: MergeCartItemInput[]): Promise<CartDto> {
  return apiClient<CartDto>('/cart/merge', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export async function lockCartForCheckout(): Promise<void> {
  await apiClient<{ success: boolean }>('/cart/checkout-lock', {
    method: 'POST',
  });
}

export async function unlockCartCheckout(): Promise<void> {
  await apiClient<{ success: boolean }>('/cart/checkout-unlock', {
    method: 'POST',
  });
}
