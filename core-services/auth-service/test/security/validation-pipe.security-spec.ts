import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from '../../src/auth/dto/register.dto';
import { LoginDto } from '../../src/auth/dto/login.dto';

describe('Security: ValidationPipe (auth-service)', () => {
  describe('C1: whitelist strips unknown properties', () => {
    it('strips unknown fields when whitelist=true, forbidNonWhitelisted=false', async () => {
      const pipe = new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
      });

      const input = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'admin',
        hackField: 'injected',
      };

      const dto = plainToInstance(RegisterDto, input);
      const result = await pipe.transform(dto, { type: 'body', metatype: RegisterDto });

      expect(result).not.toHaveProperty('role');
      expect(result).not.toHaveProperty('hackField');
    });

    it('forbidNonWhitelisted=true throws on extra fields', async () => {
      const pipe = new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      });

      const input = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'admin',
      };

      const dto = plainToInstance(RegisterDto, input);
      await expect(
        pipe.transform(dto, { type: 'body', metatype: RegisterDto }),
      ).rejects.toThrow(BadRequestException);
    });

    it('strips unknown fields from login payload', async () => {
      const pipe = new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
      });

      const input = {
        email: 'test@example.com',
        password: 'password123',
        mfaCode: '123456',
        isAdmin: true,
      };

      const dto = plainToInstance(LoginDto, input);
      const result = await pipe.transform(dto, { type: 'body', metatype: LoginDto });

      expect(result).not.toHaveProperty('mfaCode');
      expect(result).not.toHaveProperty('isAdmin');
    });
  });

  describe('transform: converts types correctly', () => {
    it('preserves valid string fields', async () => {
      const pipe = new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      });

      const input = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      const dto = plainToInstance(RegisterDto, input);
      const result = await pipe.transform(dto, { type: 'body', metatype: RegisterDto });

      expect(typeof result.email).toBe('string');
      expect(typeof result.password).toBe('string');
    });
  });

  describe('C4: SQL injection in fields', () => {
    it('rejects SQL injection in email field', async () => {
      const dto = plainToInstance(RegisterDto, {
        email: "'; DROP TABLE users; --",
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects SQL injection in password field (too short)', async () => {
      const dto = plainToInstance(RegisterDto, {
        email: 'test@example.com',
        password: "' OR 1",
        firstName: 'Test',
        lastName: 'User',
      });
      const errors = await validate(dto);
      expect(errors.some(e => e.property === 'password')).toBe(true);
    });
  });
});
