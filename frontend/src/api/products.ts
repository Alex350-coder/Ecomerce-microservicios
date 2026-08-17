import { apiClient } from './client';

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice: number | null;
  discountPercent: number | null;
  images: string[];
  features: string[];
  category: ProductCategory | null;
  rating: number | null;
  reviewCount: number;
  isNew: boolean;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

export interface ProductListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductListResult {
  data: Product[];
  meta: ProductListMeta;
}

export type ProductSort = 'name' | 'price-asc' | 'price-desc' | 'rating' | 'newest';

export interface ProductListParams {
  search?: string;
  categoryId?: string;
  sort?: ProductSort;
  isFeatured?: boolean;
  page?: number;
  limit?: number;
}

export const PRODUCT_SORTS: { value: ProductSort; label: string }[] = [
  { value: 'name', label: 'Ordenar por nombre' },
  { value: 'price-asc', label: 'Precio: menor a mayor' },
  { value: 'price-desc', label: 'Precio: mayor a menor' },
  { value: 'rating', label: 'Mejor valorados' },
  { value: 'newest', label: 'Más nuevos primero' },
];

export async function fetchProducts(params: ProductListParams = {}): Promise<ProductListResult> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.categoryId) query.set('categoryId', params.categoryId);
  if (params.sort) query.set('sort', params.sort);
  if (params.isFeatured !== undefined) query.set('isFeatured', String(params.isFeatured));
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return apiClient<ProductListResult>(`/products${suffix}`);
}

export async function fetchProduct(id: string): Promise<Product> {
  return apiClient<Product>(`/products/${id}`);
}

export async function fetchCategories(): Promise<Category[]> {
  return apiClient<Category[]>('/categories');
}

export function formatPrice(value: number): string {
  const formatted = value
    .toFixed(2)
    .replace(/\.00$/, '')
    .replace(/(\.\d)0$/, '$1');
  return `$${formatted}`;
}
