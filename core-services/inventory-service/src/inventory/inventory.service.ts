import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { InventoryItem } from './entities/inventory-item.entity';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { ReserveStockDto } from './dto/reserve-stock.dto';
import { CommitStockDto, ReleaseStockDto } from './dto/commit-release-stock.dto';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectRepository(InventoryItem)
    private readonly inventoryRepo: Repository<InventoryItem>,
    private readonly dataSource: DataSource,
  ) {}

  async getByProductId(productId: string): Promise<InventoryItem> {
    const item = await this.inventoryRepo.findOne({ where: { productId } });
    if (!item) {
      throw new NotFoundException(`Inventario del producto ${productId} no encontrado`);
    }
    return item;
  }

  async getAvailable(productId: string): Promise<number> {
    const item = await this.getByProductId(productId);
    return item.quantity - item.reserved;
  }

  async getBulk(productIds: string[]): Promise<InventoryItem[]> {
    if (productIds.length === 0) return [];
    return this.inventoryRepo.find({
      where: productIds.map((id) => ({ productId: id })),
    });
  }

  async adjust(dto: AdjustStockDto): Promise<InventoryItem> {
    let item = await this.inventoryRepo.findOne({ where: { productId: dto.productId } });

    if (!item) {
      item = this.inventoryRepo.create({
        productId: dto.productId,
        quantity: dto.quantity,
        reserved: 0,
        version: 1,
      });
    } else {
      item.quantity = dto.quantity;
      item.version += 1;
    }

    const saved = await this.inventoryRepo.save(item);
    this.logger.log(
      `Stock adjusted: product=${dto.productId} quantity=${dto.quantity} reason=${dto.reason ?? 'none'}`,
    );
    return saved;
  }

  async reserve(dto: ReserveStockDto): Promise<{
    reservationId: string;
    items: { productId: string; quantity: number; available: boolean }[];
  }> {
    const reservationId = dto.reservationId ?? crypto.randomUUID();

    const results = await this.dataSource.transaction(async (manager) => {
      const itemResults: { productId: string; quantity: number; available: boolean }[] = [];

      for (const item of dto.items) {
        const inventoryItem = await manager.findOne(InventoryItem, {
          where: { productId: item.productId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!inventoryItem) {
          itemResults.push({
            productId: item.productId,
            quantity: item.quantity,
            available: false,
          });
          continue;
        }

        const available = inventoryItem.quantity - inventoryItem.reserved;
        if (available < item.quantity) {
          itemResults.push({
            productId: item.productId,
            quantity: item.quantity,
            available: false,
          });
          continue;
        }

        inventoryItem.reserved += item.quantity;
        inventoryItem.version += 1;
        await manager.save(inventoryItem);

        itemResults.push({ productId: item.productId, quantity: item.quantity, available: true });
      }

      return itemResults;
    });

    const allAvailable = results.every((r) => r.available);
    if (!allAvailable) {
      this.logger.warn(
        `Reservation failed: ${JSON.stringify(results.filter((r) => !r.available))}`,
      );
    }

    return { reservationId, items: results };
  }

  async commit(dto: CommitStockDto): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      for (const item of dto.items) {
        const inventoryItem = await manager.findOne(InventoryItem, {
          where: { productId: item.productId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!inventoryItem) {
          throw new NotFoundException(`Inventario del producto ${item.productId} no encontrado`);
        }

        if (inventoryItem.reserved < item.quantity) {
          throw new BadRequestException(
            `Reserva insuficiente para producto ${item.productId}: reservado=${inventoryItem.reserved}, solicitado=${item.quantity}`,
          );
        }

        inventoryItem.quantity -= item.quantity;
        inventoryItem.reserved -= item.quantity;
        inventoryItem.version += 1;
        await manager.save(inventoryItem);
      }
    });

    this.logger.log(`Stock committed: ${dto.items.length} items`);
  }

  async release(dto: ReleaseStockDto): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      for (const item of dto.items) {
        const inventoryItem = await manager.findOne(InventoryItem, {
          where: { productId: item.productId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!inventoryItem) {
          throw new NotFoundException(`Inventario del producto ${item.productId} no encontrado`);
        }

        inventoryItem.reserved = Math.max(0, inventoryItem.reserved - item.quantity);
        inventoryItem.version += 1;
        await manager.save(inventoryItem);
      }
    });

    this.logger.log(`Stock released: ${dto.items.length} items`);
  }
}
