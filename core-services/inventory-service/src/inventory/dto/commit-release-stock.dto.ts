import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CommitReleaseItemDto {
  @IsUUID()
  @IsNotEmpty()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CommitStockDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommitReleaseItemDto)
  items!: CommitReleaseItemDto[];

  @IsOptional()
  @IsString()
  reservationId?: string;
}

export class ReleaseStockDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommitReleaseItemDto)
  items!: CommitReleaseItemDto[];

  @IsOptional()
  @IsString()
  reservationId?: string;
}
