import { ConfigService } from '@nestjs/config';
import { EventEmitter } from 'events';
import * as http from 'http';
import { AddressInfo } from 'net';
import type { Request, Response } from 'express';
import { ProxyService } from './proxy.service';

let server: http.Server;
let port: number;
let lastHeaders: http.IncomingHttpHeaders;

const routes: Array<{
  method: string;
  url: string;
  status: number;
  body: string;
  headers?: http.OutgoingHttpHeaders;
}> = [];

beforeAll(async () => {
  server = http.createServer((req, res) => {
    lastHeaders = req.headers;
    const match = routes.find(
      (r) => r.method === req.method && req.url?.startsWith(r.url.split('?')[0]),
    );
    if (!match) {
      res.statusCode = 404;
      res.end(JSON.stringify({ statusCode: 404, message: 'Not Found' }));
      return;
    }
    res.statusCode = match.status;
    if (match.headers) {
      for (const [k, v] of Object.entries(match.headers)) res.setHeader(k, v as string);
    }
    res.end(match.body);
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  port = (server.address() as AddressInfo).port;
});

afterAll(() => {
  server.close();
});

function makeService(env: Record<string, string>): ProxyService {
  const config = { get: (key: string) => env[key] ?? undefined } as unknown as ConfigService;
  return new ProxyService(config);
}

function makeReq(method: string, url: string, headers: Record<string, string> = {}): Request {
  const req = new EventEmitter() as unknown as Request;
  req.method = method;
  req.originalUrl = url;
  req.headers = headers;
  queueMicrotask(() => req.emit('end'));
  return req;
}

interface MockResponse extends Response {
  status: jest.Mock;
  setHeader: jest.Mock;
  send: jest.Mock;
  json: jest.Mock;
}

function makeRes(): MockResponse {
  return {
    status: jest.fn().mockReturnThis(),
    setHeader: jest.fn(),
    send: jest.fn(),
    json: jest.fn(),
  } as unknown as MockResponse;
}

describe('ProxyService', () => {
  it('reenvía a rutas públicas por prefijo y reenvía el body', async () => {
    routes.length = 0;
    routes.push({ method: 'POST', url: '/auth/login', status: 200, body: '{"token":"abc"}' });

    const service = makeService({ AUTH_SERVICE_URL: `http://localhost:${port}` });
    const req = makeReq('POST', '/auth/login', { 'content-type': 'application/json' });
    const res = makeRes();

    await service.forward(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith('{"token":"abc"}');
  });

  it('reenvía URLs con query string preservando el prefijo', async () => {
    routes.length = 0;
    routes.push({
      method: 'GET',
      url: '/products?isFeatured=true&sort=rating&limit=3',
      status: 200,
      body: '{"data":[]}',
    });

    const service = makeService({ PRODUCT_SERVICE_URL: `http://localhost:${port}` });
    const req = makeReq('GET', '/products?isFeatured=true&sort=rating&limit=3');
    const res = makeRes();

    await service.forward(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith('{"data":[]}');
  });

  it('propaga X-User-Id/X-User-Role/X-Request-Id al upstream', async () => {
    routes.length = 0;
    routes.push({ method: 'GET', url: '/cart/me', status: 200, body: '{}' });

    const service = makeService({ CART_SERVICE_URL: `http://localhost:${port}` });
    const req = makeReq('GET', '/cart/me', {
      'x-user-id': 'user-123',
      'x-user-role': 'admin',
      'x-request-id': 'corr-1',
    });
    const res = makeRes();

    await service.forward(req, res);

    expect(lastHeaders['x-user-id']).toBe('user-123');
    expect(lastHeaders['x-user-role']).toBe('admin');
    expect(lastHeaders['x-request-id']).toBe('corr-1');
  });

  it('no reenvía cabeceras sensibles no permitidas', async () => {
    routes.length = 0;
    routes.push({ method: 'GET', url: '/users/me', status: 200, body: '{}' });

    const service = makeService({ USER_SERVICE_URL: `http://localhost:${port}` });
    const req = makeReq('GET', '/users/me', {
      host: 'internal-host',
      'x-forwarded-host': 'evil',
      connection: 'keep-alive',
      'x-request-id': 'corr-2',
    });
    const res = makeRes();

    await service.forward(req, res);

    expect(lastHeaders['x-forwarded-host']).toBeUndefined();
    expect(lastHeaders['x-request-id']).toBe('corr-2');
  });

  it('devuelve 404 estándar para prefijo desconocido', async () => {
    const service = makeService({});
    const req = makeReq('GET', '/unknown/route');
    const res = makeRes();

    await service.forward(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, error: 'ROUTE_NOT_FOUND' }),
    );
  });

  it('mapea errores 5xx del upstream a 502 sin leaks', async () => {
    routes.length = 0;
    routes.push({
      method: 'GET',
      url: '/users/me',
      status: 500,
      body: '{"error":"internal db secret"}',
    });

    const service = makeService({ USER_SERVICE_URL: `http://localhost:${port}` });
    const req = makeReq('GET', '/users/me');
    const res = makeRes();

    await service.forward(req, res);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 502, error: 'BAD_GATEWAY' }),
    );
  });

  it('devuelve 504 ante timeout del upstream', async () => {
    const serverTimeout = http.createServer(() => {
      // never responds
    });
    await new Promise<void>((resolve) => serverTimeout.listen(0, resolve));
    const tPort = (serverTimeout.address() as AddressInfo).port;

    const service = makeService({
      ORDER_SERVICE_URL: `http://localhost:${tPort}`,
      REQUEST_TIMEOUT_MS: '100',
    });
    const req = makeReq('GET', '/orders/me');
    const res = makeRes();

    await service.forward(req, res);

    expect(res.status).toHaveBeenCalledWith(504);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 504, error: 'GATEWAY_TIMEOUT' }),
    );
    serverTimeout.close();
  });
});
