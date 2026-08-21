import { apiClient } from './client';
import { type OrderDto } from './orders';

export type AdminOrder = OrderDto;

export async function adminFetchAllOrders(): Promise<AdminOrder[]> {
  return apiClient<AdminOrder[]>('/orders/admin/orders');
}

export async function adminUpdateOrderStatus(
  id: string,
  status: string,
  reason?: string,
): Promise<AdminOrder> {
  return apiClient<AdminOrder>(`/orders/admin/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, reason: reason ?? '' }),
  });
}
