import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository, MoreThan } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './shared/entities/user.entity';
import { RefreshToken } from './shared/entities/refresh-token.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { generateRefreshToken, hashToken } from './tokens/token.util';
import { UserSyncService } from './internal/user-sync.service';
import { randomUUID } from 'crypto';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  emailVerified: boolean;
  isActive: boolean;
  lastLogin: Date | null;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

const SAFE_USER_FIELDS: (keyof User)[] = [
  'id',
  'email',
  'firstName',
  'lastName',
  'role',
  'isActive',
  'emailVerified',
  'lastLogin',
];

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokensRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userSyncService: UserSyncService,
  ) {}

  private toAuthUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      emailVerified: user.emailVerified,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
    };
  }

  private getRefreshTokenTtlMs(): number {
    const days = Number(this.configService.get<string>('REFRESH_TOKEN_TTL_DAYS') ?? '30');
    return days * 24 * 60 * 60 * 1000;
  }

  private signAccessToken(user: Pick<User, 'id' | 'email' | 'role'>): string {
    return this.jwtService.sign({ email: user.email, sub: user.id, role: user.role });
  }

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    const existing = await this.usersRepository.findOne({
      where: { email: registerDto.email },
    });

    if (!existing) {
      const hashedPassword = await bcrypt.hash(registerDto.password, 12);
      const user = this.usersRepository.create({
        email: registerDto.email,
        password: hashedPassword,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: 'customer',
        isActive: true,
        emailVerified: false,
      });

      const saved = await this.usersRepository.save(user);

      try {
        await this.userSyncService.notifyUserCreated({
          id: saved.id,
          email: saved.email,
          firstName: saved.firstName,
          lastName: saved.lastName,
        });
      } catch {
        // La creación del perfil en user-service es best-effort; no bloquea el registro.
      }
    }

    return {
      message: 'Si el email no está registrado, la cuenta ha sido creada correctamente.',
    };
  }

  async login(loginDto: LoginDto): Promise<LoginResult> {
    const { email, password } = loginDto;

    if (await this.isAccountLocked(email)) {
      this.logger.warn(
        JSON.stringify({
          event: 'LOGIN_BLOCKED_LOCKED_ACCOUNT',
          email,
          timestamp: new Date().toISOString(),
        }),
      );
      throw new UnauthorizedException('Cuenta temporalmente bloqueada. Intenta más tarde.');
    }

    const user = await this.usersRepository.findOne({
      where: { email },
      select: [...SAFE_USER_FIELDS, 'password'],
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      await this.incrementLoginAttempts(email);
      this.logger.warn(
        JSON.stringify({
          event: 'LOGIN_FAILED',
          email,
          timestamp: new Date().toISOString(),
        }),
      );
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.resetLoginAttempts(user.id);

    user.lastLogin = new Date();
    await this.usersRepository.save(user);

    const refreshToken = generateRefreshToken();
    const now = new Date();
    await this.refreshTokensRepository.save(
      this.refreshTokensRepository.create({
        userId: user.id,
        familyId: randomUUID(),
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(now.getTime() + this.getRefreshTokenTtlMs()),
        createdAt: now,
      }),
    );

    return {
      accessToken: this.signAccessToken(user),
      refreshToken,
      user: this.toAuthUser(user),
    };
  }

  async refresh(refreshToken?: string): Promise<{ accessToken: string; refreshToken: string }> {
    if (!refreshToken) {
      throw new UnauthorizedException('Sesión no válida');
    }

    const tokenHash = hashToken(refreshToken);
    const record = await this.refreshTokensRepository.findOne({ where: { tokenHash } });

    if (!record) {
      throw new UnauthorizedException('Sesión no válida');
    }

    const now = new Date();
    const isExpired = record.expiresAt.getTime() < now.getTime();

    if (record.revokedAt || isExpired) {
      await this.refreshTokensRepository.update({ familyId: record.familyId }, { revokedAt: now });
      this.logger.error(
        JSON.stringify({
          event: 'REFRESH_REUSE_DETECTED',
          userId: record.userId,
          familyId: record.familyId,
          revoked: !!record.revokedAt,
          expired: isExpired,
          timestamp: new Date().toISOString(),
        }),
      );
      throw new UnauthorizedException('Sesión no válida');
    }

    const newRefreshToken = generateRefreshToken();
    const expiresAt = new Date(now.getTime() + this.getRefreshTokenTtlMs());

    await this.refreshTokensRepository.update({ id: record.id }, { revokedAt: now });
    await this.refreshTokensRepository.save(
      this.refreshTokensRepository.create({
        userId: record.userId,
        familyId: record.familyId,
        tokenHash: hashToken(newRefreshToken),
        expiresAt,
        createdAt: now,
      }),
    );

    const user = await this.usersRepository.findOne({ where: { id: record.userId } });
    if (!user) {
      throw new UnauthorizedException('Sesión no válida');
    }

    return { accessToken: this.signAccessToken(user), refreshToken: newRefreshToken };
  }

  async logout(refreshToken?: string): Promise<{ message: string }> {
    if (refreshToken) {
      const record = await this.refreshTokensRepository.findOne({
        where: { tokenHash: hashToken(refreshToken) },
      });

      if (record && !record.revokedAt) {
        await this.refreshTokensRepository.update({ id: record.id }, { revokedAt: new Date() });
      }
    }

    return { message: 'Sesión cerrada' };
  }

  async me(userId: string): Promise<AuthUser> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: [...SAFE_USER_FIELDS],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.toAuthUser(user);
  }

  async changePassword(
    id: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: ['id', 'password'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, 12);
    await this.usersRepository.update(id, { password: hashedNewPassword });

    return { message: 'Contraseña actualizada correctamente' };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({
      where: { email: forgotPasswordDto.email },
    });

    if (!user) {
      return { message: 'Si el email existe, se enviarán instrucciones de recuperación' };
    }

    const resetToken = generateRefreshToken();
    const resetTokenExpires = new Date();
    resetTokenExpires.setHours(resetTokenExpires.getHours() + 1);

    user.resetToken = hashToken(resetToken);
    user.resetTokenExpires = resetTokenExpires;
    await this.usersRepository.save(user);

    return { message: 'Si el email existe, se enviarán instrucciones de recuperación' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({
      where: {
        resetToken: hashToken(resetPasswordDto.token),
        resetTokenExpires: MoreThan(new Date()),
      },
    });

    if (!user) {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 12);

    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpires = null;
    user.loginAttempts = 0;
    user.lockedUntil = null;

    await this.usersRepository.save(user);

    return { message: 'Contraseña restablecida correctamente' };
  }

  async initiateEmailVerification(id: string): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.emailVerified) {
      throw new ConflictException('El email ya está verificado');
    }

    return { message: 'Email de verificación enviado' };
  }

  async verifyEmail(id: string): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.emailVerified) {
      throw new ConflictException('El email ya está verificado');
    }

    user.emailVerified = true;
    await this.usersRepository.save(user);

    return { message: 'Email verificado correctamente' };
  }

  async incrementLoginAttempts(email: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) return;

    user.loginAttempts += 1;

    if (user.loginAttempts >= 5) {
      const lockTime = new Date();
      lockTime.setMinutes(lockTime.getMinutes() + 15);
      user.lockedUntil = lockTime;
      this.logger.warn(
        JSON.stringify({
          event: 'LOCKOUT_ACTIVATED',
          userId: user.id,
          attempts: user.loginAttempts,
          lockedUntil: lockTime.toISOString(),
          timestamp: new Date().toISOString(),
        }),
      );
    }

    await this.usersRepository.save(user);
  }

  async resetLoginAttempts(userId: string): Promise<void> {
    await this.usersRepository.update(userId, {
      loginAttempts: 0,
      lockedUntil: null,
    });
  }

  async isAccountLocked(email: string): Promise<boolean> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user || !user.lockedUntil) return false;

    if (new Date() > user.lockedUntil) {
      await this.resetLoginAttempts(user.id);
      return false;
    }

    return true;
  }

  async unlockAccount(id: string): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.resetLoginAttempts(id);
    return { message: 'Cuenta desbloqueada correctamente' };
  }
}
