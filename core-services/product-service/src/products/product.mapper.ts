import { Product } from './entities/product.entity';

export interface ProductDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice: number | null;
  discountPercent: number | null;
  images: string[];
  features: string[];
  category: { id: string; name: string; slug: string } | null;
  rating: number | null;
  reviewCount: number;
  isNew: boolean;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const toNumber = (value: string | number | null | undefined): number | null =>
  value === null || value === undefined || value === '' ? null : Number(value);

export function toProductDto(product: Product, now: Date = new Date()): ProductDto {
  const base = Number(product.price);
  const discountPercent = product.discountPercent ?? 0;
  const discountActive =
    discountPercent > 0 &&
    discountPercent <= 100 &&
    (!product.validFrom || product.validFrom.getTime() <= now.getTime()) &&
    (!product.validTo || product.validTo.getTime() >= now.getTime());

  const price = discountActive ? Math.round(base * (1 - discountPercent / 100) * 100) / 100 : base;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price,
    originalPrice: discountActive ? base : null,
    discountPercent: product.discountPercent,
    images: product.images ?? [],
    features: product.features ?? [],
    category: product.category
      ? {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
        }
      : null,
    rating: toNumber(product.rating),
    reviewCount: product.reviewCount,
    isNew: product.isNew,
    isFeatured: product.isFeatured,
    isActive: product.isActive,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}
