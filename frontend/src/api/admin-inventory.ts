import { apiClient } from './client';
import { type InventoryItem } from './admin';

export async function adminFetchInventory(): Promise<InventoryItem[]> {
  return apiClient<InventoryItem[]>('/inventory');
}

export async function adminAdjustStock(
  productId: string,
  adjustment: number,
  reason?: string,
): Promise<InventoryItem> {
  return apiClient<InventoryItem>(`/inventory/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify({ adjustment, reason: reason ?? '' }),
  });
}
