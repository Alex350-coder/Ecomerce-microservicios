import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
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

  it('should throw 503 when upstreams are down (liveness)', async () => {
    await expect(controller.check()).rejects.toThrow(ServiceUnavailableException);
  });

  it('should throw 503 when upstreams are down (readiness)', async () => {
    await expect(controller.ready()).rejects.toThrow(ServiceUnavailableException);
  });
});
