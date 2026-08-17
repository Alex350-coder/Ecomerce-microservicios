import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class AddCartItemDto {
  @IsUUID()
  @IsNotEmpty()
  productId!: string;

  @IsString()
  @IsNotEmpty()
  productName!: string;

  @IsNotEmpty()
  price!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  quantity?: number;
}
