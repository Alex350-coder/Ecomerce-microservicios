import { Test, TestingModule } from '@nestjs/testing';
import { AuthProxyController } from './auth-proxy.controller';
import { ProxyService } from './proxy.service';
import type { Request, Response } from 'express';

describe('AuthProxyController', () => {
  let controller: AuthProxyController;
  let proxyService: ProxyService;

  const mockForward = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthProxyController],
      providers: [{ provide: ProxyService, useValue: { forward: mockForward } }],
    }).compile();

    controller = module.get(AuthProxyController);
    proxyService = module.get(ProxyService);
  });

  afterEach(() => jest.clearAllMocks());

  it('delegates to proxyService.forward for rate-limited routes', async () => {
    const req = { method: 'POST', url: '/auth/login' } as unknown as Request;
    const res = {} as unknown as Response;

    await controller.rateLimited(req, res);

    expect(proxyService.forward).toHaveBeenCalledWith(req, res);
  });
});
