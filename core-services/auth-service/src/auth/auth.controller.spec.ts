import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { REFRESH_COOKIE_NAME } from './tokens/token.util';

function createMockService() {
  return {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    me: jest.fn(),
    changePassword: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    initiateEmailVerification: jest.fn(),
    verifyEmail: jest.fn(),
    unlockAccount: jest.fn(),
  };
}

function createMockRes() {
  return {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;
}

describe('AuthController', () => {
  let controller: AuthController;
  let service: ReturnType<typeof createMockService>;
  let configService: ConfigService;

  beforeEach(() => {
    service = createMockService();
    configService = {
      get: jest.fn((key: string) => (key === 'NODE_ENV' ? 'test' : undefined)),
    } as unknown as ConfigService;
    controller = new AuthController(service as unknown as AuthService, configService);
  });

  describe('POST /auth/register', () => {
    it('returns a uniform generic message (sin enumeración de emails)', async () => {
      service.register.mockResolvedValue({
        message: 'Si el email no está registrado, la cuenta ha sido creada correctamente.',
      });
      const dto: RegisterDto = {
        email: 'a@b.com',
        password: 'password123',
        firstName: 'Ana',
        lastName: 'Gómez',
      };

      const result = await controller.register(dto);

      expect(service.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual({
        message: expect.stringContaining('email no está registrado'),
      });
      expect(result).not.toHaveProperty('user');
    });
  });

  describe('POST /auth/login', () => {
    it('returns tokens and sets the refresh cookie', async () => {
      service.login.mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'r'.repeat(64),
        user: { id: 'user-1', email: 'a@b.com' },
      });
      const dto: LoginDto = { email: 'a@b.com', password: 'password123' };
      const res = createMockRes();

      const result = await controller.login(dto, res);

      expect(service.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual({
        accessToken: 'access',
        user: expect.objectContaining({ id: 'user-1' }),
      });
      expect(res.cookie).toHaveBeenCalledWith(
        REFRESH_COOKIE_NAME,
        'r'.repeat(64),
        expect.objectContaining({ httpOnly: true, sameSite: 'lax' }),
      );
    });
  });

  describe('POST /auth/refresh', () => {
    it('rotates the refresh token from the cookie', async () => {
      service.refresh.mockResolvedValue({ accessToken: 'new-access', refreshToken: 'new-refresh' });
      const req = { cookies: { [REFRESH_COOKIE_NAME]: 'old-refresh' } } as unknown as Request;
      const res = createMockRes();

      const result = await controller.refresh(req, res);

      expect(service.refresh).toHaveBeenCalledWith('old-refresh');
      expect(result).toEqual({ accessToken: 'new-access' });
      expect(res.cookie).toHaveBeenCalledWith(
        REFRESH_COOKIE_NAME,
        'new-refresh',
        expect.any(Object),
      );
    });
  });

  describe('POST /auth/logout', () => {
    it('revokes the token and clears the cookie', async () => {
      const req = { cookies: { [REFRESH_COOKIE_NAME]: 'some-token' } } as unknown as Request;
      const res = createMockRes();

      const result = await controller.logout(req, res);

      expect(service.logout).toHaveBeenCalledWith('some-token');
      expect(res.clearCookie).toHaveBeenCalledWith(REFRESH_COOKIE_NAME, expect.any(Object));
      expect(result).toEqual({ message: expect.any(String) });
    });
  });

  describe('GET /auth/me', () => {
    it('returns the current user via the auth service', async () => {
      service.me.mockResolvedValue({ id: 'user-1', email: 'a@b.com', role: 'customer' });

      const result = await controller.me({ userId: 'user-1', email: 'a@b.com', role: 'customer' });

      expect(service.me).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(expect.objectContaining({ id: 'user-1' }));
    });
  });

  describe('password flows', () => {
    it('changes password', async () => {
      service.changePassword.mockResolvedValue({ message: 'ok' });
      const dto: ChangePasswordDto = { currentPassword: 'old', newPassword: 'new-password-123' };

      const result = await controller.changePassword('user-1', dto);

      expect(service.changePassword).toHaveBeenCalledWith('user-1', dto);
      expect(result).toEqual({ message: 'ok' });
    });

    it('handles forgot-password with generic message', async () => {
      service.forgotPassword.mockResolvedValue({ message: 'Si el email existe...' });
      const dto: ForgotPasswordDto = { email: 'a@b.com' };

      const result = await controller.forgotPassword(dto);

      expect(service.forgotPassword).toHaveBeenCalledWith(dto);
      expect(result.message).toContain('Si el email existe');
    });

    it('resets password', async () => {
      service.resetPassword.mockResolvedValue({ message: 'ok' });
      const dto: ResetPasswordDto = { token: 't', newPassword: 'new-password-123' };

      const result = await controller.resetPassword(dto);

      expect(service.resetPassword).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ message: 'ok' });
    });
  });

  describe('email verification', () => {
    it('initiates verification', async () => {
      service.initiateEmailVerification.mockResolvedValue({ message: 'enviado' });

      const result = await controller.initiateEmailVerification('user-1');

      expect(service.initiateEmailVerification).toHaveBeenCalledWith('user-1');
      expect(result.message).toBe('enviado');
    });

    it('verifies email', async () => {
      service.verifyEmail.mockResolvedValue({ message: 'ok' });

      const result = await controller.verifyEmail('user-1');

      expect(service.verifyEmail).toHaveBeenCalledWith('user-1');
      expect(result.message).toBe('ok');
    });
  });

  describe('unlock', () => {
    it('unlocks an account', async () => {
      service.unlockAccount.mockResolvedValue({ message: 'desbloqueado' });

      const result = await controller.unlockAccount('user-1');

      expect(service.unlockAccount).toHaveBeenCalledWith('user-1');
      expect(result.message).toBe('desbloqueado');
    });
  });

  describe('health', () => {
    it('returns OK with service name', () => {
      const result = controller.health();

      expect(result.status).toBe('OK');
      expect(result.service).toBe('auth-service');
    });
  });
});
