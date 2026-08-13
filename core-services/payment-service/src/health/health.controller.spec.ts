import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let dataSource: { query: jest.Mock };

  beforeEach(async () => {
    dataSource = { query: jest.fn().mockResolvedValue([[1]]) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: getDataSourceToken(),
          useValue: dataSource,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should report ok on liveness', () => {
    const result = controller.check();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('payment-service');
  });

  it('should report database up on readiness', async () => {
    const result = await controller.ready();
    expect(result.status).toBe('ok');
    expect(result.database).toBe('up');
  });

  it('should throw 503 when database is down', async () => {
    dataSource.query.mockRejectedValueOnce(new Error('connection refused'));
    await expect(controller.ready()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
