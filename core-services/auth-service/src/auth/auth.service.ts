import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { User } from './shared/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    if (await this.isAccountLocked(email)) {
      throw new UnauthorizedException('Cuenta temporalmente bloqueada. Intenta más tarde.');
    }

    const user = await this.usersRepository.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'password',
        'firstName',
        'lastName',
        'role',
        'isActive',
        'emailVerified',
      ],
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      await this.incrementLoginAttempts(email);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.resetLoginAttempts(user.id);

    user.lastLogin = new Date();
    await this.usersRepository.save(user);

    const payload = { email: user.email, sub: user.id, role: user.role };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    };
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

    const resetToken =
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const resetTokenExpires = new Date();
    resetTokenExpires.setHours(resetTokenExpires.getHours() + 1);

    user.resetToken = resetToken;
    user.resetTokenExpires = resetTokenExpires;
    await this.usersRepository.save(user);

    console.log(`Token de recuperación para ${user.email}: ${resetToken}`);

    return { message: 'Si el email existe, se enviarán instrucciones de recuperación' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({
      where: {
        resetToken: resetPasswordDto.token,
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

    console.log(`Email de verificación enviado a: ${user.email}`);
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
