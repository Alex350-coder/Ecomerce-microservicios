import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async check() {
    const report = await this.healthService.report();
    const hasDown = report.upstreams.some((u) => u.status === 'down');

    if (hasDown) {
      throw new ServiceUnavailableException({
        status: 'error',
        service: 'gateway',
        timestamp: new Date().toISOString(),
        upstreams: report.upstreams,
      });
    }

    return report;
  }

  @Get('ready')
  async ready() {
    const report = await this.healthService.report();
    const hasDown = report.upstreams.some((u) => u.status === 'down');

    const body = {
      status: hasDown ? 'error' : 'ok',
      service: 'gateway',
      dependencies: {
        upstreams: report.upstreams.map((u) => ({
          name: u.name,
          status: u.status,
        })),
      },
      timestamp: new Date().toISOString(),
    };

    if (hasDown) {
      throw new ServiceUnavailableException(body);
    }

    return body;
  }
}
