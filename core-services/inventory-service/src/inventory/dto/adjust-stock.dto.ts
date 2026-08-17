import { IsInt, IsNotEmpty, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class AdjustStockDto {
  @IsUUID()
  @IsNotEmpty()
  productId!: string;

  @IsInt()
  @Min(0)
  @Max(100000)
  quantity!: number;

  @IsOptional()
  reason?: string;
}
