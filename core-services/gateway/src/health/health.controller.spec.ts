import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [HealthService, ConfigService],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should report ok on liveness', async () => {
    const result = await controller.check();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('gateway');
  });

  it('should report ok on readiness', async () => {
    const result = await controller.ready();
    expect(result.status).toBe('ok');
  });
});
