import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';
import { Product } from '../products/entities/product.entity';
import type { JwtUser } from '../auth/decorators/current-user.decorator';

describe('CategoriesService', () => {
  let service: CategoriesService;
  const categoryRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    merge: jest.fn((target: unknown, source: unknown) => ({
      ...(target as object),
      ...(source as object),
    })),
  };
  const productRepo = { exist: jest.fn() };

  const admin: JwtUser = { userId: 'admin-1', email: 'admin@example.com', role: 'admin' };
  const baseCategory = {
    id: 'c1',
    name: 'Laptops',
    slug: 'laptops',
    isActive: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: getRepositoryToken(Category), useValue: categoryRepo },
        { provide: getRepositoryToken(Product), useValue: productRepo },
      ],
    }).compile();
    service = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('returns only active, non-deleted categories ordered by name', async () => {
      categoryRepo.find.mockResolvedValue([baseCategory]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(categoryRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ isActive: true }) }),
      );
    });
  });

  describe('create', () => {
    it('creates a category from the slugified name with audit', async () => {
      categoryRepo.findOne.mockResolvedValue(null);
      categoryRepo.create.mockReturnValue({ ...baseCategory, slug: 'smart-phones' });
      categoryRepo.save.mockImplementation(async (c: unknown) => c);

      const result = await service.create({ name: 'Smart Phones' }, admin);

      expect(categoryRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Smart Phones',
          slug: 'smart-phones',
          createdBy: 'admin-1',
          updatedBy: 'admin-1',
        }),
      );
      expect(result.slug).toBe('smart-phones');
    });

    it('throws ConflictException when the slug already exists', async () => {
      categoryRepo.findOne.mockResolvedValue(baseCategory);

      await expect(service.create({ name: 'Laptops' }, admin)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('updates name and regenerates the slug', async () => {
      categoryRepo.findOne.mockResolvedValueOnce(baseCategory).mockResolvedValueOnce(null);
      categoryRepo.save.mockImplementation(async (c: unknown) => c);

      const result = await service.update('c1', { name: 'Laptops Pro' }, admin);

      expect(result.name).toBe('Laptops Pro');
      expect(result.slug).toBe('laptops-pro');
    });

    it('throws NotFoundException for a missing category', async () => {
      categoryRepo.findOne.mockResolvedValue(null);

      await expect(service.update('c9', { name: 'X' }, admin)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('throws ConflictException when products reference the category', async () => {
      categoryRepo.findOne.mockResolvedValue(baseCategory);
      productRepo.exist.mockResolvedValue(true);

      await expect(service.remove('c1', admin)).rejects.toBeInstanceOf(ConflictException);
    });

    it('soft deletes the category when no products reference it', async () => {
      categoryRepo.findOne.mockResolvedValue(baseCategory);
      productRepo.exist.mockResolvedValue(false);

      await service.remove('c1', admin);

      expect(categoryRepo.update).toHaveBeenCalledWith(
        'c1',
        expect.objectContaining({
          isActive: false,
          deletedAt: expect.any(Date),
          updatedBy: 'admin-1',
        }),
      );
    });
  });
});
