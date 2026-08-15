import { IsEmail, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class InternalCreateUserDto {
  @IsUUID()
  id!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;
}
