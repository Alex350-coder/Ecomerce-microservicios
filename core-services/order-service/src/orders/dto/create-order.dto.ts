import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

class OrderItemDto {
  @IsUUID()
  @IsNotEmpty()
  productId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  productName!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(999999.99)
  price!: number;

  @IsInt()
  @Min(1)
  @Max(100)
  quantity!: number;
}

class AddressDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  fullName!: string;

  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  phone!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  address!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  city!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  postalCode!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  country!: string;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @ValidateNested()
  @Type(() => AddressDto)
  address!: AddressDto;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  shippingMethod?: string;

  @IsOptional()
  @IsUUID()
  @MaxLength(36)
  idempotencyKey?: string;
}
