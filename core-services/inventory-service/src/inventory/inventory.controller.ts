import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { ReserveStockDto } from './dto/reserve-stock.dto';
import { CommitStockDto, ReleaseStockDto } from './dto/commit-release-stock.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get(':productId')
  async getByProductId(@Param('productId', new ParseUUIDPipe()) productId: string) {
    const item = await this.inventoryService.getByProductId(productId);
    return {
      productId: item.productId,
      quantity: item.quantity,
      reserved: item.reserved,
      available: item.quantity - item.reserved,
    };
  }

  @Get()
  async getBulk(@Query('ids') ids: string) {
    const productIdList = ids ? ids.split(',').filter(Boolean) : [];
    const items = await this.inventoryService.getBulk(productIdList);
    return items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      reserved: item.reserved,
      available: item.quantity - item.reserved,
    }));
  }

  @Patch(':productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async adjust(
    @Param('productId', new ParseUUIDPipe()) productId: string,
    @Body() dto: AdjustStockDto,
  ) {
    const adjusted = await this.inventoryService.adjust({ ...dto, productId });
    return {
      productId: adjusted.productId,
      quantity: adjusted.quantity,
      reserved: adjusted.reserved,
      available: adjusted.quantity - adjusted.reserved,
      version: adjusted.version,
    };
  }

  @Post('reserve')
  async reserve(@Body() dto: ReserveStockDto) {
    return this.inventoryService.reserve(dto);
  }

  @Post('commit')
  async commit(@Body() dto: CommitStockDto) {
    await this.inventoryService.commit(dto);
    return { success: true };
  }

  @Post('release')
  async release(@Body() dto: ReleaseStockDto) {
    await this.inventoryService.release(dto);
    return { success: true };
  }
}
