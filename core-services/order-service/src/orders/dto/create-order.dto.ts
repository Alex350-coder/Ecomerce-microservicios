import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

class OrderItemDto {
  @IsUUID()
  @IsNotEmpty()
  productId!: string;

  @IsString()
  @Min(1)
  @Max(200)
  productName!: string;

  @IsNumber()
  @Min(0.01)
  price!: number;

  @IsInt()
  @Min(1)
  @Max(100)
  quantity!: number;
}

class AddressDto {
  @IsString()
  @Min(1)
  @Max(100)
  fullName!: string;

  @IsString()
  @Min(1)
  @Max(100)
  email!: string;

  @IsString()
  @Min(1)
  @Max(20)
  phone!: string;

  @IsString()
  @Min(1)
  @Max(200)
  address!: string;

  @IsString()
  @Min(1)
  @Max(100)
  city!: string;

  @IsString()
  @Min(1)
  @Max(20)
  postalCode!: string;

  @IsString()
  @Min(1)
  @Max(100)
  country!: string;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @ValidateNested()
  @Type(() => AddressDto)
  address!: AddressDto;

  @IsOptional()
  @IsString()
  shippingMethod?: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
