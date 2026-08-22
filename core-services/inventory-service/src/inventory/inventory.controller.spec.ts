import { Test, TestingModule } from '@nestjs/testing';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryItem } from './entities/inventory-item.entity';

describe('InventoryController', () => {
  let controller: InventoryController;
  let service: jest.Mocked<InventoryService>;

  const mockItem = (overrides: Partial<InventoryItem> = {}): InventoryItem => ({
    id: 'inv-uuid-1',
    productId: 'prod-uuid-1',
    quantity: 100,
    reserved: 10,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryController],
      providers: [
        {
          provide: InventoryService,
          useValue: {
            getByProductId: jest.fn(),
            getBulk: jest.fn(),
            adjust: jest.fn(),
            reserve: jest.fn(),
            commit: jest.fn(),
            release: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(InventoryController);
    service = module.get(InventoryService);
  });

  describe('getByProductId', () => {
    it('returns inventory with computed available field', async () => {
      service.getByProductId.mockResolvedValue(mockItem({ quantity: 100, reserved: 30 }));

      const result = await controller.getByProductId('prod-uuid-1');

      expect(result).toEqual({
        productId: 'prod-uuid-1',
        quantity: 100,
        reserved: 30,
        available: 70,
      });
    });
  });

  describe('getBulk', () => {
    it('parses comma-separated ids and returns mapped items', async () => {
      service.getBulk.mockResolvedValue([mockItem({ productId: 'a', quantity: 50, reserved: 5 })]);

      const result = await controller.getBulk('a,b');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.getBulk).toHaveBeenCalledWith(['a', 'b']);
      expect(result[0].available).toBe(45);
    });

    it('returns empty array when ids is empty', async () => {
      service.getBulk.mockResolvedValue([]);

      const result = await controller.getBulk('');

      expect(result).toEqual([]);
    });
  });

  describe('adjust', () => {
    it('returns adjusted inventory with version', async () => {
      service.adjust.mockResolvedValue(mockItem({ quantity: 200, version: 2 }));

      const result = await controller.adjust('prod-uuid-1', { quantity: 200 } as any);

      expect(result.quantity).toBe(200);
      expect(result.version).toBe(2);
    });
  });

  describe('reserve', () => {
    it('returns reservation result', async () => {
      service.reserve.mockResolvedValue({
        reservationId: 'res-123',
        items: [{ productId: 'prod-uuid-1', quantity: 5, available: true }],
      });

      const result = await controller.reserve({
        items: [{ productId: 'prod-uuid-1', quantity: 5 }],
      });

      expect(result.reservationId).toBe('res-123');
    });
  });

  describe('commit', () => {
    it('returns success', async () => {
      service.commit.mockResolvedValue();

      const result = await controller.commit({
        items: [{ productId: 'prod-uuid-1', quantity: 5 }],
      });

      expect(result).toEqual({ success: true });
    });
  });

  describe('release', () => {
    it('returns success', async () => {
      service.release.mockResolvedValue();

      const result = await controller.release({
        items: [{ productId: 'prod-uuid-1', quantity: 5 }],
      });

      expect(result).toEqual({ success: true });
    });
  });
});
