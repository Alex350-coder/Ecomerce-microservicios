import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

class MergeCartItemDto {
  @IsUUID()
  @IsNotEmpty()
  productId!: string;

  @IsString()
  @IsNotEmpty()
  productName!: string;

  @IsNotEmpty()
  price!: number;

  @IsNotEmpty()
  quantity!: number;
}

export class MergeCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MergeCartItemDto)
  items!: MergeCartItemDto[];

  @IsOptional()
  @IsString()
  guestId?: string;
}
