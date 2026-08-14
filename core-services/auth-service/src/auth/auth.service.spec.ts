import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { User } from './shared/entities/user.entity';
import { RefreshToken } from './shared/entities/refresh-token.entity';
import { UserSyncService } from './internal/user-sync.service';
import { hashToken } from './tokens/token.util';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));

function createMockRepo<T>() {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn((entity: Partial<T>) => entity as T),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    delete: jest.fn(),
  };
}

const baseUser = {
  id: 'user-1',
  email: 'ana@example.com',
  password: 'hashed-password',
  firstName: 'Ana',
  lastName: 'Gómez',
  role: 'customer',
  isActive: true,
  emailVerified: false,
  loginAttempts: 0,
  lockedUntil: null,
  resetToken: null,
  resetTokenExpires: null,
  lastLogin: null,
};

function futureDate(ms: number): Date {
  return new Date(Date.now() + ms);
}

function pastDate(ms: number): Date {
  return new Date(Date.now() - ms);
}

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: ReturnType<typeof createMockRepo<User>>;
  let refreshRepo: ReturnType<typeof createMockRepo<RefreshToken>>;
  let jwtService: JwtService;
  let configService: ConfigService;
  let userSync: UserSyncService;

  beforeEach(() => {
    userRepo = createMockRepo<User>();
    refreshRepo = createMockRepo<RefreshToken>();
    jwtService = { sign: jest.fn().mockReturnValue('signed-token') } as unknown as JwtService;
    configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          JWT_SECRET: 'test-secret',
          JWT_EXPIRES_IN: '15m',
          REFRESH_TOKEN_TTL_DAYS: '30',
          USER_SERVICE_URL: 'http://localhost:3001',
        };
        return values[key];
      }),
    } as unknown as ConfigService;
    userSync = {
      notifyUserCreated: jest.fn().mockResolvedValue(undefined),
    } as unknown as UserSyncService;

    service = new AuthService(
      userRepo as unknown as Repository<User>,
      refreshRepo as unknown as Repository<RefreshToken>,
      jwtService,
      configService,
      userSync,
    );
  });

  describe('register', () => {
    const dto: RegisterDto = {
      email: 'ana@example.com',
      password: 'password123',
      firstName: 'Ana',
      lastName: 'Gómez',
    };

    it('creates a user with fixed customer role and hashed password', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.save.mockImplementation(async (user: User) => ({ ...user, id: 'user-1' }));

      const result = await service.register(dto);

      expect(result.user.role).toBe('customer');
      expect(result.user.email).toBe('ana@example.com');
      expect(result.user.password).toBeUndefined();
      const saved = userRepo.save.mock.calls[0][0] as User;
      expect(saved.password).toBe('hashed-password');
      expect(saved.password).not.toBe('password123');
      expect(saved.role).toBe('customer');
      expect(saved.emailVerified).toBe(false);
    });

    it('rejects duplicate email with a generic conflict and does not notify user-service', async () => {
      userRepo.findOne.mockResolvedValue(baseUser);

      await expect(service.register(dto)).rejects.toBeInstanceOf(ConflictException);
      expect(userSync.notifyUserCreated).not.toHaveBeenCalled();
    });

    it('notifies user-service after creation', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.save.mockImplementation(async (user: User) => ({ ...user, id: 'user-1' }));

      await service.register(dto);

      expect(userSync.notifyUserCreated).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'user-1', email: 'ana@example.com' }),
      );
    });

    it('tolerates a failure when syncing the user to user-service', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.save.mockImplementation(async (user: User) => ({ ...user, id: 'user-1' }));
      userSync.notifyUserCreated.mockRejectedValue(new Error('network down'));

      await expect(service.register(dto)).resolves.toBeDefined();
    });
  });

  describe('login', () => {
    const dto: LoginDto = { email: 'ana@example.com', password: 'password123' };

    it('returns accessToken, refreshToken and safe user', async () => {
      userRepo.findOne.mockResolvedValue(baseUser);

      const result = await service.login(dto);

      expect(result.accessToken).toBe('signed-token');
      expect(result.user.email).toBe('ana@example.com');
      expect(result.user.password).toBeUndefined();
      expect(result.refreshToken).toMatch(/^[a-f0-9]{64}$/);
      expect(refreshRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          familyId: expect.any(String),
        }),
      );
    });

    it('rejects invalid credentials and increments login attempts', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
      userRepo.findOne.mockResolvedValue(baseUser);

      await expect(service.login(dto)).rejects.toBeInstanceOf(UnauthorizedException);
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ loginAttempts: 1 }),
      );
    });

    it('rejects unknown email', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects login while account is locked', async () => {
      userRepo.findOne.mockResolvedValue({ ...baseUser, lockedUntil: futureDate(60_000) });

      await expect(service.login(dto)).rejects.toThrow(/bloqueada/);
      expect(userRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    const activeRecord: RefreshToken = {
      id: 'rt-1',
      userId: 'user-1',
      familyId: 'family-1',
      tokenHash: hashToken('valid-refresh-token'),
      expiresAt: futureDate(30 * 24 * 60 * 60 * 1000),
      revokedAt: null,
      createdAt: new Date(),
    } as RefreshToken;

    it('rotates the token, preserves the family and issues a new pair', async () => {
      refreshRepo.findOne.mockResolvedValue(activeRecord);
      userRepo.findOne.mockResolvedValue(baseUser);

      const result = await service.refresh('valid-refresh-token');

      expect(result.accessToken).toBe('signed-token');
      expect(result.refreshToken).toMatch(/^[a-f0-9]{64}$/);
      expect(result.refreshToken).not.toBe('valid-refresh-token');
      expect(refreshRepo.update).toHaveBeenCalledWith(
        { id: 'rt-1' },
        expect.objectContaining({ revokedAt: expect.any(Date) }),
      );
      const saved = refreshRepo.save.mock.calls[0][0] as RefreshToken;
      expect(saved.familyId).toBe('family-1');
      expect(saved.tokenHash).not.toBe('valid-refresh-token');
    });

    it('rejects an expired token and revokes the whole family (reuse suspicion)', async () => {
      refreshRepo.findOne.mockResolvedValue({
        ...activeRecord,
        expiresAt: pastDate(1000),
      } as RefreshToken);

      await expect(service.refresh('expired-refresh-token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(refreshRepo.update).toHaveBeenCalledWith(
        { familyId: 'family-1' },
        expect.objectContaining({ revokedAt: expect.any(Date) }),
      );
    });

    it('rejects a revoked token and revokes the whole family', async () => {
      refreshRepo.findOne.mockResolvedValue({
        ...activeRecord,
        revokedAt: new Date(),
      } as RefreshToken);

      await expect(service.refresh('reused-refresh-token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(refreshRepo.update).toHaveBeenCalledWith(
        { familyId: 'family-1' },
        expect.objectContaining({ revokedAt: expect.any(Date) }),
      );
    });

    it('rejects an unknown token without side effects', async () => {
      refreshRepo.findOne.mockResolvedValue(null);

      await expect(service.refresh('unknown-token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(refreshRepo.update).not.toHaveBeenCalled();
      expect(refreshRepo.save).not.toHaveBeenCalled();
    });

    it('rejects a missing token', async () => {
      await expect(service.refresh()).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('revokes the presented refresh token', async () => {
      refreshRepo.findOne.mockResolvedValue({
        id: 'rt-1',
        tokenHash: hashToken('valid-refresh-token'),
        revokedAt: null,
      } as RefreshToken);

      const result = await service.logout('valid-refresh-token');

      expect(refreshRepo.update).toHaveBeenCalledWith(
        { id: 'rt-1' },
        expect.objectContaining({ revokedAt: expect.any(Date) }),
      );
      expect(result).toEqual({ message: expect.any(String) });
    });

    it('succeeds silently when no token is provided', async () => {
      await expect(service.logout()).resolves.toBeDefined();
      expect(refreshRepo.update).not.toHaveBeenCalled();
    });

    it('succeeds when the token is unknown', async () => {
      refreshRepo.findOne.mockResolvedValue(null);

      await expect(service.logout('unknown-token')).resolves.toBeDefined();
    });
  });

  describe('me', () => {
    it('returns the user without sensitive fields', async () => {
      userRepo.findOne.mockResolvedValue(baseUser);

      const user = await service.me('user-1');

      expect(user.id).toBe('user-1');
      expect(user.email).toBe('ana@example.com');
      expect(user.role).toBe('customer');
      expect(user.password).toBeUndefined();
      expect(user.resetToken).toBeUndefined();
      expect(user.loginAttempts).toBeUndefined();
    });

    it('throws when the user does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.me('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('changePassword', () => {
    const dto: ChangePasswordDto = {
      currentPassword: 'old-password',
      newPassword: 'new-password-123',
    };

    it('updates the password hashed when current password matches', async () => {
      userRepo.findOne.mockResolvedValue({ ...baseUser, password: 'hashed-password' });

      const result = await service.changePassword('user-1', dto);

      expect(userRepo.update).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ password: 'hashed-password' }),
      );
      expect(result).toEqual({ message: expect.any(String) });
    });

    it('rejects when current password is wrong', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
      userRepo.findOne.mockResolvedValue({ ...baseUser, password: 'hashed-password' });

      await expect(service.changePassword('user-1', dto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(userRepo.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for an unknown user', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.changePassword('missing', dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('forgotPassword', () => {
    const dto: ForgotPasswordDto = { email: 'ana@example.com' };

    it('stores a hashed reset token and returns a generic message', async () => {
      userRepo.findOne.mockResolvedValue(baseUser);

      const result = await service.forgotPassword(dto);

      const saved = userRepo.save.mock.calls[0][0] as User;
      expect(saved.resetToken).toBeDefined();
      expect(saved.resetToken).toMatch(/^[a-f0-9]{64}$/);
      expect(saved.resetToken).not.toBe(baseUser.resetToken);
      expect(result.message).toContain('Si el email existe');
    });

    it('returns a generic message for unknown emails', async () => {
      userRepo.findOne.mockResolvedValue(null);

      const result = await service.forgotPassword(dto);

      expect(result.message).toContain('Si el email existe');
      expect(userRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    const dto: ResetPasswordDto = { token: 'valid-token', newPassword: 'new-password-123' };

    it('resets the password and clears the token', async () => {
      userRepo.findOne.mockResolvedValue({ ...baseUser, resetToken: 'valid-token' });

      const result = await service.resetPassword(dto);

      expect(result).toEqual({ message: expect.any(String) });
      const saved = userRepo.save.mock.calls[0][0] as User;
      expect(saved.password).toBe('hashed-password');
      expect(saved.resetToken).toBeNull();
      expect(saved.lockedUntil).toBeNull();
    });

    it('rejects an invalid or expired token', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.resetPassword(dto)).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('email verification', () => {
    it('initiates verification for an unverified user', async () => {
      userRepo.findOne.mockResolvedValue(baseUser);

      await expect(service.initiateEmailVerification('user-1')).resolves.toEqual({
        message: expect.any(String),
      });
    });

    it('rejects initiate verification when already verified', async () => {
      userRepo.findOne.mockResolvedValue({ ...baseUser, emailVerified: true });

      await expect(service.initiateEmailVerification('user-1')).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('verifies the email', async () => {
      userRepo.findOne.mockResolvedValue(baseUser);

      await service.verifyEmail('user-1');

      const saved = userRepo.save.mock.calls[0][0] as User;
      expect(saved.emailVerified).toBe(true);
    });

    it('rejects verify when already verified', async () => {
      userRepo.findOne.mockResolvedValue({ ...baseUser, emailVerified: true });

      await expect(service.verifyEmail('user-1')).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('account locking', () => {
    it('locks the account after 5 failed attempts', async () => {
      userRepo.findOne.mockResolvedValue(baseUser);

      for (let i = 1; i <= 5; i += 1) {
        await service.incrementLoginAttempts('ana@example.com');
      }

      const saved = userRepo.save.mock.calls[4][0] as User;
      expect(saved.loginAttempts).toBe(5);
      expect(saved.lockedUntil).toBeInstanceOf(Date);
    });

    it('resets attempts', async () => {
      await service.resetLoginAttempts('user-1');

      expect(userRepo.update).toHaveBeenCalledWith('user-1', {
        loginAttempts: 0,
        lockedUntil: null,
      });
    });

    it('unlocks an account', async () => {
      userRepo.findOne.mockResolvedValue({ ...baseUser, lockedUntil: futureDate(60_000) });

      const result = await service.unlockAccount('user-1');

      expect(result).toEqual({ message: expect.any(String) });
      expect(userRepo.update).toHaveBeenCalled();
    });

    it('throws NotFoundException when unlocking an unknown user', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.unlockAccount('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
