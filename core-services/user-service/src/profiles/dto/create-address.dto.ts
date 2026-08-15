import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  label!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  recipientName?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  street!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  city!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  zipCode?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  country!: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
