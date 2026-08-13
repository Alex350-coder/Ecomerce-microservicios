import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should report ok on liveness', () => {
    const result = controller.check();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('gateway');
  });

  it('should report ok on readiness', () => {
    const result = controller.ready();
    expect(result.status).toBe('ok');
  });
});
