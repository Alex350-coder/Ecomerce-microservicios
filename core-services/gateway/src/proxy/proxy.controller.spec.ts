import { Test, TestingModule } from '@nestjs/testing';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';
import type { Request, Response } from 'express';

describe('ProxyController', () => {
  let controller: ProxyController;
  let proxyService: ProxyService;

  const mockForward = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProxyController],
      providers: [{ provide: ProxyService, useValue: { forward: mockForward } }],
    }).compile();

    controller = module.get(ProxyController);
    proxyService = module.get(ProxyService);
  });

  afterEach(() => jest.clearAllMocks());

  it('delegates to proxyService.forward', async () => {
    const req = { method: 'GET', url: '/products' } as unknown as Request;
    const res = {} as unknown as Response;

    await controller.proxy(req, res);

    expect(proxyService.forward).toHaveBeenCalledWith(req, res);
  });
});
