import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import {
  JwtEdgeMiddleware,
  USER_ID_HEADER,
  USER_ROLE_HEADER,
  isPublicRoute,
} from './jwt-edge.middleware';

const JWT_SECRET = 'test-secret-0123456789';

interface MockResponse extends Response {
  status: jest.Mock;
  json: jest.Mock;
}

function mockResponse(): MockResponse {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as MockResponse;
}

function mockRequest(url: string, method = 'GET', headers: Record<string, string> = {}): Request {
  return {
    method,
    originalUrl: url,
    headers,
  } as unknown as Request;
}

describe('isPublicRoute', () => {
  it('marca como públicas las rutas de auth público y health', () => {
    expect(isPublicRoute('POST', '/auth/login')).toBe(true);
    expect(isPublicRoute('POST', '/auth/register')).toBe(true);
    expect(isPublicRoute('POST', '/auth/forgot-password')).toBe(true);
    expect(isPublicRoute('POST', '/auth/reset-password')).toBe(true);
    expect(isPublicRoute('POST', '/auth/refresh')).toBe(true);
    expect(isPublicRoute('POST', '/auth/logout')).toBe(true);
    expect(isPublicRoute('GET', '/health')).toBe(true);
    expect(isPublicRoute('GET', '/health/ready')).toBe(true);
    expect(isPublicRoute('GET', '/products')).toBe(true);
    expect(isPublicRoute('GET', '/products/1')).toBe(true);
  });

  it('marca como protegidas las rutas privadas', () => {
    expect(isPublicRoute('GET', '/users/me')).toBe(false);
    expect(isPublicRoute('GET', '/cart')).toBe(false);
    expect(isPublicRoute('GET', '/orders')).toBe(false);
    expect(isPublicRoute('POST', '/products')).toBe(false);
  });
});

describe('JwtEdgeMiddleware', () => {
  const config = { get: jest.fn().mockReturnValue(JWT_SECRET) } as unknown as ConfigService;
  const middleware = new JwtEdgeMiddleware(config);
  const next: NextFunction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deja pasar rutas públicas sin token', () => {
    const req = mockRequest('/auth/login', 'POST');
    middleware.use(req, mockResponse(), next);
    expect(next).toHaveBeenCalled();
  });

  it('deja pasar refresh/logout sin token (usan cookie httpOnly, no Bearer)', () => {
    const refresh = mockRequest('/auth/refresh', 'POST');
    middleware.use(refresh, mockResponse(), next);
    expect(next).toHaveBeenCalled();

    const logout = mockRequest('/auth/logout', 'POST');
    middleware.use(logout, mockResponse(), next);
    expect(next).toHaveBeenCalled();
  });

  it('rechaza ruta protegida sin token con 401 estándar', () => {
    const res = mockResponse();
    const req = mockRequest('/users/me');
    middleware.use(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401, error: 'AUTH_INVALID_TOKEN' }),
    );
  });

  it('rechaza token inválido con 401', () => {
    const res = mockResponse();
    const req = mockRequest('/users/me', 'GET', { authorization: 'Bearer invalid.token.here' });
    middleware.use(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('acepta token válido e inyecta X-User-Id/X-User-Role', () => {
    const token = jwt.sign({ sub: 'user-123', role: 'admin' }, JWT_SECRET);
    const req = mockRequest('/users/me', 'GET', { authorization: `Bearer ${token}` });
    middleware.use(req, mockResponse(), next);
    expect(next).toHaveBeenCalled();
    expect(req.headers[USER_ID_HEADER]).toBe('user-123');
    expect(req.headers[USER_ROLE_HEADER]).toBe('admin');
  });

  it('ignora X-User-Id/X-User-Role enviados por el cliente', () => {
    const token = jwt.sign({ sub: 'real-user', role: 'user' }, JWT_SECRET);
    const req = mockRequest('/cart', 'GET', {
      authorization: `Bearer ${token}`,
      [USER_ID_HEADER]: 'spoofed-user',
      [USER_ROLE_HEADER]: 'admin',
    });
    middleware.use(req, mockResponse(), next);
    expect(req.headers[USER_ID_HEADER]).toBe('real-user');
    expect(req.headers[USER_ROLE_HEADER]).toBe('user');
  });
});
