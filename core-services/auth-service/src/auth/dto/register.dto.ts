import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(72, { message: 'La contraseña no puede superar los 72 caracteres' })
  password!: string;

  @IsString()
  @MinLength(1, { message: 'El nombre es requerido' })
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @MinLength(1, { message: 'El apellido es requerido' })
  @MaxLength(100)
  lastName!: string;
}
