import { apiClient } from './client';

export interface OrderAddress {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface OrderItemDto {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderDto {
  id: string;
  userId: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'failed';
  items: OrderItemDto[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingMethod: string;
  addressSnapshot: OrderAddress;
  paymentIntentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  items: {
    productId: string;
    productName: string;
    price: number;
    quantity: number;
  }[];
  address: OrderAddress;
  shippingMethod?: string;
  idempotencyKey?: string;
}

export async function createOrder(input: CreateOrderInput): Promise<OrderDto> {
  return apiClient<OrderDto>('/orders', {
    method: 'POST',
    body: JSON.stringify(input),
    headers: {
      'idempotency-key': input.idempotencyKey ?? crypto.randomUUID(),
    },
  });
}

export async function fetchMyOrders(): Promise<OrderDto[]> {
  return apiClient<OrderDto[]>('/orders');
}

export async function fetchOrderById(id: string): Promise<OrderDto> {
  return apiClient<OrderDto>(`/orders/${id}`);
}

export async function cancelOrder(id: string, reason?: string): Promise<OrderDto> {
  return apiClient<OrderDto>(`/orders/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason ?? '' }),
  });
}
