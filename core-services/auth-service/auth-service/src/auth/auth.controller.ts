import { 
  Controller, 
  Get,
  Post, 
  Body, 
  Param, 
  Patch,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  ParseUUIDPipe
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
@UsePipes(new ValidationPipe({ transform: true }))
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ✅ LOGIN (NUEVO)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // ✅ CAMBIO DE CONTRASEÑA
  @Patch(':id/password')
  async changePassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() changePasswordDto: ChangePasswordDto
  ): Promise<{ message: string }> {
    return this.authService.changePassword(id, changePasswordDto);
  }

  // ✅ VERIFICACIÓN DE EMAIL
  @Post(':id/verify-email')
  async initiateEmailVerification(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<{ message: string }> {
    return this.authService.initiateEmailVerification(id);
  }

  @Patch(':id/verify-email')
  async verifyEmail(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<{ message: string }> {
    return this.authService.verifyEmail(id);
  }

  // ✅ BLOQUEO TEMPORAL
  @Patch(':id/unlock')
  async unlockAccount(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<{ message: string }> {
    return this.authService.unlockAccount(id);
  }

  // ✅ RECUPERACIÓN DE CONTRASEÑA
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto
  ): Promise<{ message: string }> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto
  ): Promise<{ message: string }> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  // ✅ HEALTH CHECK
  @Get('health/status')
  @HttpCode(HttpStatus.OK)
  health() {
    return { 
      status: 'OK', 
      service: 'auth-service', 
      timestamp: new Date().toISOString() 
    };
  }
}