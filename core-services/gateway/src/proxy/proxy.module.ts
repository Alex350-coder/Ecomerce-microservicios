import { Module } from '@nestjs/common';
import { AuthProxyController } from './auth-proxy.controller';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';

@Module({
  controllers: [AuthProxyController, ProxyController],
  providers: [ProxyService],
  exports: [ProxyService],
})
export class ProxyModule {}
