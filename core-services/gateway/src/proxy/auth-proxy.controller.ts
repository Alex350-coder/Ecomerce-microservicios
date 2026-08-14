import { All, Controller, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { ProxyService } from './proxy.service';

@Controller('auth')
@Throttle({ default: { limit: 10, ttl: 60000 } })
export class AuthProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @All('login')
  @All('register')
  @All('forgot-password')
  @All('reset-password')
  async rateLimited(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.proxyService.forward(req, res);
  }
}
