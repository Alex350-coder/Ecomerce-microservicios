import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

class CommitReleaseItemDto {
  @IsUUID()
  @IsNotEmpty()
  productId!: string;

  @IsInt()
  @Min(1)
  @Max(100)
  quantity!: number;
}

export class CommitStockDto {
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CommitReleaseItemDto)
  items!: CommitReleaseItemDto[];

  @IsOptional()
  @IsUUID()
  reservationId?: string;
}

export class ReleaseStockDto {
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CommitReleaseItemDto)
  items!: CommitReleaseItemDto[];

  @IsOptional()
  @IsUUID()
  reservationId?: string;
}
