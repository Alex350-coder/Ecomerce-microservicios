import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { InventoryService } from './inventory.service';
import { InventoryItem } from './entities/inventory-item.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('InventoryService', () => {
  let service: InventoryService;
  let repo: jest.Mocked<Repository<InventoryItem>>;
  let dataSource: jest.Mocked<DataSource>;

  const mockItem = (overrides: Partial<InventoryItem> = {}): InventoryItem =>
    ({
      id: 'inv-uuid-1',
      productId: 'prod-uuid-1',
      quantity: 100,
      reserved: 10,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as InventoryItem;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: getRepositoryToken(InventoryItem),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(InventoryService);
    repo = module.get(getRepositoryToken(InventoryItem));
    dataSource = module.get(DataSource);
  });

  describe('getByProductId', () => {
    it('returns the inventory item when found', async () => {
      const item = mockItem();
      repo.findOne.mockResolvedValue(item);

      const result = await service.getByProductId('prod-uuid-1');

      expect(result).toEqual(item);
    });

    it('throws NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.getByProductId('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAvailable', () => {
    it('returns quantity minus reserved', async () => {
      repo.findOne.mockResolvedValue(mockItem({ quantity: 100, reserved: 30 }));

      const result = await service.getAvailable('prod-uuid-1');

      expect(result).toBe(70);
    });
  });

  describe('getBulk', () => {
    it('returns empty array for empty input', async () => {
      const result = await service.getBulk([]);
      expect(result).toEqual([]);
    });

    it('finds items by product IDs', async () => {
      const items = [mockItem({ productId: 'a' }), mockItem({ productId: 'b' })];
      repo.find.mockResolvedValue(items);

      const result = await service.getBulk(['a', 'b']);

      expect(result).toEqual(items);
    });
  });

  describe('adjust', () => {
    it('creates a new item when product does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      const created = mockItem({ quantity: 50, version: 1 });
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(created);

      const result = await service.adjust({ productId: 'new-prod', quantity: 50 });

      expect(repo.create).toHaveBeenCalledWith({
        productId: 'new-prod',
        quantity: 50,
        reserved: 0,
        version: 1,
      });
      expect(result.quantity).toBe(50);
    });

    it('updates existing item quantity and increments version', async () => {
      const existing = mockItem({ quantity: 100, version: 3 });
      repo.findOne.mockResolvedValue(existing);
      const saved = { ...existing, quantity: 200, version: 4 };
      repo.save.mockResolvedValue(saved);

      const result = await service.adjust({ productId: 'prod-uuid-1', quantity: 200 });

      expect(result.quantity).toBe(200);
      expect(result.version).toBe(4);
    });
  });

  describe('reserve', () => {
    it('reserves stock when available', async () => {
      const item = mockItem({ quantity: 100, reserved: 10 });
      dataSource.transaction.mockImplementation(async (fn: any) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(item),
          save: jest.fn().mockResolvedValue(item),
        };
        return fn(manager);
      });

      const result = await service.reserve({
        items: [{ productId: 'prod-uuid-1', quantity: 5 }],
      });

      expect(result.items[0].available).toBe(true);
      expect(item.reserved).toBe(15);
    });

    it('marks unavailable when stock insufficient', async () => {
      const item = mockItem({ quantity: 10, reserved: 8 });
      dataSource.transaction.mockImplementation(async (fn: any) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(item),
          save: jest.fn(),
        };
        return fn(manager);
      });

      const result = await service.reserve({
        items: [{ productId: 'prod-uuid-1', quantity: 5 }],
      });

      expect(result.items[0].available).toBe(false);
    });

    it('marks unavailable when product not found', async () => {
      dataSource.transaction.mockImplementation(async (fn: any) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(null),
          save: jest.fn(),
        };
        return fn(manager);
      });

      const result = await service.reserve({
        items: [{ productId: 'missing', quantity: 1 }],
      });

      expect(result.items[0].available).toBe(false);
    });

    it('generates reservationId when not provided', async () => {
      dataSource.transaction.mockImplementation(async (fn: any) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(null),
          save: jest.fn(),
        };
        return fn(manager);
      });

      const result = await service.reserve({
        items: [{ productId: 'missing', quantity: 1 }],
      });

      expect(result.reservationId).toBeDefined();
      expect(result.reservationId.length).toBeGreaterThan(0);
    });
  });

  describe('commit', () => {
    it('deducts quantity and reserved when sufficient reservation exists', async () => {
      const item = mockItem({ quantity: 100, reserved: 20 });
      dataSource.transaction.mockImplementation(async (fn: any) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(item),
          save: jest.fn().mockResolvedValue(item),
        };
        return fn(manager);
      });

      await service.commit({ items: [{ productId: 'prod-uuid-1', quantity: 10 }] });

      expect(item.quantity).toBe(90);
      expect(item.reserved).toBe(10);
    });

    it('throws NotFoundException when product not found', async () => {
      dataSource.transaction.mockImplementation(async (fn: any) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(null),
          save: jest.fn(),
        };
        return fn(manager);
      });

      await expect(
        service.commit({ items: [{ productId: 'missing', quantity: 1 }] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when reservation insufficient', async () => {
      const item = mockItem({ quantity: 100, reserved: 3 });
      dataSource.transaction.mockImplementation(async (fn: any) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(item),
          save: jest.fn(),
        };
        return fn(manager);
      });

      await expect(
        service.commit({ items: [{ productId: 'prod-uuid-1', quantity: 10 }] }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('release', () => {
    it('releases reserved stock', async () => {
      const item = mockItem({ quantity: 100, reserved: 20 });
      dataSource.transaction.mockImplementation(async (fn: any) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(item),
          save: jest.fn().mockResolvedValue(item),
        };
        return fn(manager);
      });

      await service.release({ items: [{ productId: 'prod-uuid-1', quantity: 5 }] });

      expect(item.reserved).toBe(15);
    });

    it('floors reserved at zero', async () => {
      const item = mockItem({ quantity: 100, reserved: 2 });
      dataSource.transaction.mockImplementation(async (fn: any) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(item),
          save: jest.fn().mockResolvedValue(item),
        };
        return fn(manager);
      });

      await service.release({ items: [{ productId: 'prod-uuid-1', quantity: 10 }] });

      expect(item.reserved).toBe(0);
    });

    it('throws NotFoundException when product not found', async () => {
      dataSource.transaction.mockImplementation(async (fn: any) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(null),
          save: jest.fn(),
        };
        return fn(manager);
      });

      await expect(
        service.release({ items: [{ productId: 'missing', quantity: 1 }] }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
