import { apiClient } from './client';
import { type Product, type Category } from './products';

export interface AdminProductListResult {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images?: string[];
  features?: string[];
  categoryId?: string;
  isNew?: boolean;
  isFeatured?: boolean;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  originalPrice?: number;
  images?: string[];
  features?: string[];
  categoryId?: string;
  isNew?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
}

export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  stock: number;
  reservedStock: number;
  availableStock: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  updatedAt: string;
}

export async function adminFetchProducts(
  params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
  } = {},
): Promise<AdminProductListResult> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.search) query.set('search', params.search);
  if (params.categoryId) query.set('categoryId', params.categoryId);

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return apiClient<AdminProductListResult>(`/products${suffix}`);
}

export async function adminCreateProduct(input: CreateProductInput): Promise<Product> {
  return apiClient<Product>('/products', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function adminUpdateProduct(id: string, input: UpdateProductInput): Promise<Product> {
  return apiClient<Product>(`/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function adminDeleteProduct(id: string): Promise<void> {
  await apiClient(`/products/${id}`, { method: 'DELETE' });
}

export async function adminFetchCategories(): Promise<Category[]> {
  return apiClient<Category[]>('/categories');
}
