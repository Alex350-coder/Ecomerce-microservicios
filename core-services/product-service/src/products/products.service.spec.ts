import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { ProductSort } from './dto/list-products-query.dto';
import { Category } from '../categories/entities/category.entity';
import type { JwtUser } from '../auth/decorators/current-user.decorator';

describe('ProductsService', () => {
  let service: ProductsService;
  const productRepo = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    exist: jest.fn(),
    merge: jest.fn((target: unknown, source: unknown) => ({
      ...(target as object),
      ...(source as object),
    })),
  };
  const categoryRepo = { findOne: jest.fn(), exist: jest.fn() };

  const admin: JwtUser = { userId: 'admin-1', email: 'admin@example.com', role: 'admin' };

  const baseProduct = {
    id: 'p1',
    name: 'MacBook Air M2',
    slug: 'macbook-air-m2',
    description: 'Laptop ultraligera',
    price: '1200',
    discountPercent: null,
    validFrom: null,
    validTo: null,
    images: ['/img/macbook.jpg'],
    features: ['16GB RAM'],
    category: { id: 'c1', name: 'Laptops', slug: 'laptops' },
    rating: '4.5',
    reviewCount: 10,
    isNew: false,
    isFeatured: true,
    isActive: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: productRepo },
        { provide: getRepositoryToken(Category), useValue: categoryRepo },
      ],
    }).compile();
    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('returns only active products with pagination metadata', async () => {
      productRepo.findAndCount.mockResolvedValue([[{ ...baseProduct }], 1]);

      const result = await service.findAll({ page: 1, limit: 12 });

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 12, totalPages: 1 });
      expect(productRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ isActive: true }) }),
      );
    });

    it('caps the limit at 100 per quality gate', async () => {
      productRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 1, limit: 999 });

      expect(productRepo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({ take: 100 }));
    });

    it('applies search, category filter, sort and offset', async () => {
      productRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({
        search: 'macbook',
        categoryId: 'c1',
        sort: ProductSort.PRICE_DESC,
        page: 2,
        limit: 20,
      });

      const call = productRepo.findAndCount.mock.calls[0][0];
      expect(call.skip).toBe(20);
      expect(call.take).toBe(20);
      expect(call.order.price).toBe('DESC');
      expect(call.where).toEqual(
        expect.objectContaining({ categoryId: 'c1', name: expect.any(Object) }),
      );
    });

    it('filters by isFeatured when requested', async () => {
      productRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ isFeatured: true, page: 1, limit: 3 });

      expect(productRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ isFeatured: true }) }),
      );
    });

    it('computes effective price when a discount is active', async () => {
      const discounted = {
        ...baseProduct,
        price: '1000',
        discountPercent: 10,
        validFrom: new Date('2025-01-01'),
        validTo: new Date('2026-12-31'),
      };
      productRepo.findAndCount.mockResolvedValue([[discounted], 1]);

      const result = await service.findAll({ page: 1, limit: 12 });

      expect(result.data[0].price).toBe(900);
      expect(result.data[0].originalPrice).toBe(1000);
    });
  });

  describe('findOne', () => {
    it('returns the product only when active and not deleted', async () => {
      productRepo.findOne.mockResolvedValue({ ...baseProduct });

      const result = await service.findOne('p1');

      expect(result.id).toBe('p1');
      expect(productRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ id: 'p1', isActive: true }) }),
      );
    });

    it('throws NotFoundException when the product does not exist', async () => {
      productRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('p9')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates a product with audit fields and a unique slug', async () => {
      categoryRepo.findOne.mockResolvedValue({ id: 'c1', isActive: true });
      productRepo.exist.mockResolvedValue(false);
      productRepo.create.mockReturnValue({
        id: 'p1',
        name: 'MacBook Air M2',
        description: 'Laptop ultraligera',
        price: '1200',
        categoryId: 'c1',
        images: ['/img/macbook.jpg'],
        features: ['16GB RAM'],
        slug: 'macbook-air-m2',
        createdBy: admin.userId,
        updatedBy: admin.userId,
      });
      productRepo.save.mockImplementation(async (e: unknown) => ({
        ...(e as object),
        rating: 0,
        reviewCount: 0,
        isNew: false,
        isFeatured: false,
        isActive: true,
        discountPercent: null,
        validFrom: null,
        validTo: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      }));

      const dto = {
        name: 'MacBook Air M2',
        description: 'Laptop ultraligera',
        price: 1200,
        categoryId: 'c1',
        images: ['/img/macbook.jpg'],
        features: ['16GB RAM'],
      };
      const result = await service.create(dto, admin);

      expect(productRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'macbook-air-m2', createdBy: 'admin-1' }),
      );
      expect(result.slug).toBe('macbook-air-m2');
    });

    it('disambiguates the slug when it already exists', async () => {
      categoryRepo.findOne.mockResolvedValue({ id: 'c1', isActive: true });
      productRepo.exist.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
      productRepo.create.mockReturnValue({ id: 'p1', name: 'MacBook Air M2' });
      productRepo.save.mockImplementation(async (e: unknown) => e);

      await service.create(
        {
          name: 'MacBook Air M2',
          description: 'x',
          price: 1200,
          categoryId: 'c1',
          images: [],
          features: [],
        },
        admin,
      );

      expect(productRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'macbook-air-m2-2' }),
      );
    });

    it('throws BadRequestException when the category does not exist or is inactive', async () => {
      categoryRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create(
          { name: 'X', description: 'x', price: 1, categoryId: 'c9', images: [], features: [] },
          admin,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('update', () => {
    it('updates fields and regenerates the slug when name changes', async () => {
      productRepo.findOne.mockResolvedValue({ ...baseProduct });
      productRepo.exist.mockResolvedValue(false);
      productRepo.save.mockImplementation(async (e: unknown) => e);

      const result = await service.update('p1', { name: 'MacBook Air M3', price: 1300 }, admin);

      expect(result.name).toBe('MacBook Air M3');
      expect(productRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'macbook-air-m3', updatedBy: 'admin-1' }),
      );
    });

    it('throws NotFoundException for a missing product', async () => {
      productRepo.findOne.mockResolvedValue(null);

      await expect(service.update('p9', { price: 1 }, admin)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws BadRequestException when the target category is invalid', async () => {
      productRepo.findOne.mockResolvedValue({ ...baseProduct });
      categoryRepo.findOne.mockResolvedValue(null);

      await expect(service.update('p1', { categoryId: 'c9' }, admin)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('soft deletes the product preserving audit fields', async () => {
      productRepo.findOne.mockResolvedValue({ ...baseProduct });

      await service.remove('p1', admin);

      expect(productRepo.update).toHaveBeenCalledWith(
        'p1',
        expect.objectContaining({
          updatedBy: 'admin-1',
          isActive: false,
          deletedAt: expect.any(Date),
        }),
      );
    });

    it('throws NotFoundException for a missing product', async () => {
      productRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('p9', admin)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
