import { RequestIdMiddleware } from './request-id.middleware';
import type { Request, Response, NextFunction } from 'express';

describe('RequestIdMiddleware', () => {
  let middleware: RequestIdMiddleware;

  beforeEach(() => {
    middleware = new RequestIdMiddleware();
  });

  const mockReqRes = (headers: Record<string, unknown> = {}) => {
    const req = {
      headers: { ...headers },
      method: 'GET',
      originalUrl: '/test',
    } as unknown as Request;
    const res = {
      setHeader: jest.fn(),
      on: jest.fn(),
      statusCode: 200,
    } as unknown as Response;
    const next = jest.fn() as NextFunction;
    return { req, res, next };
  };

  it('calls next()', () => {
    const { req, res, next } = mockReqRes();

    middleware.use(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('uses incoming x-request-id header when present', () => {
    const { req, res, next } = mockReqRes({ 'x-request-id': 'existing-id' });

    middleware.use(req, res, next);

    expect(req.headers['x-request-id']).toBe('existing-id');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', 'existing-id');
  });

  it('generates a new requestId when header is missing', () => {
    const { req, res, next } = mockReqRes();

    middleware.use(req, res, next);

    const id = req.headers['x-request-id'] as string;
    expect(id).toBeDefined();
    expect(id.length).toBeGreaterThan(0);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', id);
  });
});
