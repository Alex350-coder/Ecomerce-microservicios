import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async check() {
    return this.healthService.report();
  }

  @Get('ready')
  async ready() {
    const report = await this.healthService.report();
    return {
      status: 'ok',
      service: 'gateway',
      dependencies: {
        upstreams: report.upstreams.map((u) => ({
          name: u.name,
          status: u.status,
        })),
      },
      timestamp: new Date().toISOString(),
    };
  }
}
