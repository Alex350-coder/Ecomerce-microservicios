import { All, Controller, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ProxyService } from './proxy.service';

@Controller()
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @All('*splat')
  async proxy(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.proxyService.forward(req, res);
  }
}
