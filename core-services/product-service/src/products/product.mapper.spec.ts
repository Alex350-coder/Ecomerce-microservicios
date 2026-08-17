import { toProductDto } from './product.mapper';
import { Product } from './entities/product.entity';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    name: 'Producto',
    slug: 'producto',
    description: 'Descripción',
    price: '1000',
    discountPercent: null,
    validFrom: null,
    validTo: null,
    images: ['/img/a.jpg'],
    features: ['F1'],
    categoryId: 'c1',
    category: null,
    rating: '4.5',
    reviewCount: 3,
    isNew: true,
    isFeatured: true,
    isActive: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  } as Product;
}

describe('toProductDto', () => {
  it('maps base fields and converts decimals to numbers', () => {
    const dto = toProductDto(makeProduct());

    expect(dto.price).toBe(1000);
    expect(dto.originalPrice).toBeNull();
    expect(dto.rating).toBe(4.5);
    expect(dto.reviewCount).toBe(3);
    expect(dto.category).toBeNull();
  });

  it('applies an active discount computing current and original price', () => {
    const dto = toProductDto(
      makeProduct({
        discountPercent: 10,
        validFrom: new Date('2025-01-01'),
        validTo: new Date('2026-12-31'),
      }),
    );

    expect(dto.price).toBe(900);
    expect(dto.originalPrice).toBe(1000);
  });

  it('ignores a discount outside the validity window', () => {
    const dto = toProductDto(
      makeProduct({
        discountPercent: 50,
        validFrom: new Date('2020-01-01'),
        validTo: new Date('2020-12-31'),
      }),
    );

    expect(dto.price).toBe(1000);
    expect(dto.originalPrice).toBeNull();
  });

  it('maps the category relation', () => {
    const dto = toProductDto(
      makeProduct({
        category: { id: 'c1', name: 'Laptops', slug: 'laptops' } as Product['category'],
      }),
    );

    expect(dto.category).toEqual({ id: 'c1', name: 'Laptops', slug: 'laptops' });
  });
});
