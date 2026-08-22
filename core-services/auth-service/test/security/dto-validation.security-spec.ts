import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RegisterDto } from '../../src/auth/dto/register.dto';
import { LoginDto } from '../../src/auth/dto/login.dto';
import { ForgotPasswordDto } from '../../src/auth/dto/forgot-password.dto';
import { ResetPasswordDto } from '../../src/auth/dto/reset-password.dto';
import { ChangePasswordDto } from '../../src/auth/dto/change-password.dto';

describe('Security: DTO Validation (auth-service)', () => {
  describe('RegisterDto', () => {
    it('C2: rejects malformed email', async () => {
      const dto = plainToInstance(RegisterDto, {
        email: 'not-an-email',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'email')).toBe(true);
    });

    it('C1: rejects extra fields (whitelist)', async () => {
      const dto = plainToInstance(RegisterDto, {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'admin',
        hackField: 'injected',
      });
      const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
      expect(errors.length).toBeGreaterThan(0);
    });

    it('R1.6: rejects password shorter than 8 chars', async () => {
      const dto = plainToInstance(RegisterDto, {
        email: 'test@example.com',
        password: 'short',
        firstName: 'Test',
        lastName: 'User',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    });

    it('R1.2: rejects password longer than 72 chars (bcrypt limit)', async () => {
      const dto = plainToInstance(RegisterDto, {
        email: 'test@example.com',
        password: 'a'.repeat(73),
        firstName: 'Test',
        lastName: 'User',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    });

    it('rejects empty firstName', async () => {
      const dto = plainToInstance(RegisterDto, {
        email: 'test@example.com',
        password: 'password123',
        firstName: '',
        lastName: 'User',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'firstName')).toBe(true);
    });

    it('rejects firstName over 100 chars', async () => {
      const dto = plainToInstance(RegisterDto, {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'a'.repeat(101),
        lastName: 'User',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'firstName')).toBe(true);
    });
  });

  describe('LoginDto', () => {
    it('C2: rejects malformed email', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'invalid',
        password: 'password123',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'email')).toBe(true);
    });

    it('C6: rejects extremely long email (DoS)', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'a'.repeat(255) + '@example.com',
        password: 'password123',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'email')).toBe(true);
    });

    it('rejects short password', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'test@example.com',
        password: 'short',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    });
  });

  describe('ForgotPasswordDto', () => {
    it('C2: rejects malformed email', async () => {
      const dto = plainToInstance(ForgotPasswordDto, { email: 'bad' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'email')).toBe(true);
    });

    it('rejects empty email', async () => {
      const dto = plainToInstance(ForgotPasswordDto, { email: '' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'email')).toBe(true);
    });
  });

  describe('ResetPasswordDto', () => {
    it('rejects empty token', async () => {
      const dto = plainToInstance(ResetPasswordDto, {
        token: '',
        newPassword: 'new-password-123',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'token')).toBe(true);
    });

    it('rejects token over 512 chars (DoS)', async () => {
      const dto = plainToInstance(ResetPasswordDto, {
        token: 'a'.repeat(513),
        newPassword: 'new-password-123',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'token')).toBe(true);
    });

    it('R1.6: rejects short new password', async () => {
      const dto = plainToInstance(ResetPasswordDto, {
        token: 'valid-token',
        newPassword: 'short',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'newPassword')).toBe(true);
    });
  });

  describe('ChangePasswordDto', () => {
    it('rejects empty current password', async () => {
      const dto = plainToInstance(ChangePasswordDto, {
        currentPassword: '',
        newPassword: 'new-password-123',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'currentPassword')).toBe(true);
    });

    it('rejects current password over 72 chars', async () => {
      const dto = plainToInstance(ChangePasswordDto, {
        currentPassword: 'a'.repeat(73),
        newPassword: 'new-password-123',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'currentPassword')).toBe(true);
    });

    it('rejects short new password', async () => {
      const dto = plainToInstance(ChangePasswordDto, {
        currentPassword: 'old-password',
        newPassword: 'short',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'newPassword')).toBe(true);
    });
  });
});
