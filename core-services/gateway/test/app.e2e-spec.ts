import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as http from 'http';
import { AddressInfo } from 'net';
import * as jwt from 'jsonwebtoken';
import request from 'supertest';
import { envValidationSchema } from '../src/config/env.validation';
import { HealthModule } from '../src/health/health.module';
import { ProxyModule } from '../src/proxy/proxy.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { RequestIdMiddleware } from '../src/common/middlewares/request-id.middleware';
import { JwtEdgeMiddleware } from '../src/common/middlewares/jwt-edge.middleware';

const JWT_SECRET = 'e2e-secret-0123456789';

let upstream: http.Server;
let upstreamPort: number;
let capturedHeaders: http.IncomingHttpHeaders;
let app: INestApplication;

interface ApiBody {
  access_token?: string;
  requestId?: string;
  error?: string;
  status?: string;
  upstreams?: unknown[];
  statusCode?: number;
}

beforeAll(async () => {
  upstream = http.createServer((req, res) => {
    capturedHeaders = req.headers;
    const url = req.url ?? '';
    if (url.startsWith('/auth/login')) {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ access_token: 'dummy', user: { id: 'user-1', role: 'user' } }));
      return;
    }
    if (url.startsWith('/users/me')) {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ id: 'user-1', email: 'a@b.com' }));
      return;
    }
    if (url.startsWith('/cart/me')) {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ items: [] }));
      return;
    }
    if (url.startsWith('/products')) {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ products: [] }));
      return;
    }
    res.statusCode = 404;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ statusCode: 404, message: 'Not Found', error: 'NOT_FOUND' }));
  });
  await new Promise<void>((resolve) => upstream.listen(0, resolve));
  upstreamPort = (upstream.address() as AddressInfo).port;
});

afterAll(async () => {
  await app?.close();
  upstream?.close();
});

async function createApp(env: Record<string, string>): Promise<INestApplication> {
  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        validationSchema: envValidationSchema,
        validationOptions: { abortEarly: true },
        ignoreEnvFile: true,
      }),
      HealthModule,
      ProxyModule,
    ],
  })
    .overrideProvider(ConfigService)
    .useValue({
      get: (key: string): string | undefined => ({ ...env, JWT_SECRET })[key],
    })
    .compile();

  const appInstance = moduleRef.createNestApplication({ bodyParser: false });
  const configService = appInstance.get(ConfigService);

  appInstance.enableCors({
    origin: ['http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'Idempotency-Key'],
    credentials: true,
  });

  const requestIdMiddleware = new RequestIdMiddleware();
  const jwtEdgeMiddleware = new JwtEdgeMiddleware(configService);
  appInstance.use((req, res, next) => requestIdMiddleware.use(req, res, next));
  appInstance.use((req, res, next) => jwtEdgeMiddleware.use(req, res, next));

  appInstance.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  appInstance.useGlobalFilters(new HttpExceptionFilter());
  await appInstance.listen(0);
  return appInstance;
}

function baseUrl(): string {
  const server = app.getHttpServer() as unknown as { address: () => AddressInfo };
  return `http://127.0.0.1:${server.address().port}`;
}

describe('Gateway e2e', () => {
  beforeAll(async () => {
    const upstreamUrl = `http://127.0.0.1:${upstreamPort}`;
    app = await createApp({
      AUTH_SERVICE_URL: upstreamUrl,
      USER_SERVICE_URL: upstreamUrl,
      PRODUCT_SERVICE_URL: upstreamUrl,
      CART_SERVICE_URL: upstreamUrl,
      ORDER_SERVICE_URL: upstreamUrl,
      INVENTORY_SERVICE_URL: upstreamUrl,
      PAYMENT_SERVICE_URL: upstreamUrl,
      REQUEST_TIMEOUT_MS: '2000',
    });
  });

  it('proxy público POST /auth/login reenvía al upstream', async () => {
    const res = await request(baseUrl())
      .post('/auth/login')
      .set('content-type', 'application/json')
      .send({ email: 'a@b.com', password: 'password' })
      .expect(200);
    expect((res.body as ApiBody).access_token).toBe('dummy');
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('propaga X-Request-Id entrante y responde con él', async () => {
    const res = await request(baseUrl())
      .get('/users/me')
      .set('x-request-id', 'corr-abc-123')
      .set('authorization', `Bearer ${jwt.sign({ sub: 'user-1', role: 'user' }, JWT_SECRET)}`)
      .expect(200);
    expect(res.headers['x-request-id']).toBe('corr-abc-123');
    expect(capturedHeaders['x-request-id']).toBe('corr-abc-123');
  });

  it('inyecta X-User-Id/X-User-Role al upstream e ignora los del cliente', async () => {
    const token = jwt.sign({ sub: 'real-user', role: 'user' }, JWT_SECRET);
    await request(baseUrl())
      .get('/users/me')
      .set('authorization', `Bearer ${token}`)
      .set('x-user-id', 'spoofed')
      .set('x-user-role', 'admin')
      .expect(200);
    expect(capturedHeaders['x-user-id']).toBe('real-user');
    expect(capturedHeaders['x-user-role']).toBe('user');
  });

  it('401 con JWT inválido en ruta protegida', async () => {
    const res = await request(baseUrl())
      .get('/cart/me')
      .set('authorization', 'Bearer invalid.token.here')
      .expect(401);
    expect(res.body).toEqual(
      expect.objectContaining({ statusCode: 401, error: 'AUTH_INVALID_TOKEN' }),
    );
    expect((res.body as ApiBody).requestId).toBeDefined();
  });

  it('401 sin token en ruta protegida', async () => {
    const res = await request(baseUrl()).get('/cart/me').expect(401);
    expect((res.body as ApiBody).error).toBe('AUTH_INVALID_TOKEN');
  });

  it('CORS preflight con origin permitido', async () => {
    const res = await request(baseUrl())
      .options('/users/me')
      .set('origin', 'http://localhost:5173')
      .set('access-control-request-method', 'GET')
      .expect(204);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('CORS rechaza origin no permitido', async () => {
    const res = await request(baseUrl())
      .options('/users/me')
      .set('origin', 'http://evil.example')
      .set('access-control-request-method', 'GET');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('GET /health lista upstreams', async () => {
    const res = await request(baseUrl()).get('/health').expect(200);
    const body = res.body as ApiBody;
    expect(body.status).toBe('ok');
    expect(Array.isArray(body.upstreams)).toBe(true);
    expect(body.upstreams).toHaveLength(7);
  });

  it('GET /products público funciona sin token', async () => {
    await request(baseUrl()).get('/products').expect(200);
  });

  it('prefijo desconocido devuelve 404 estándar', async () => {
    const res = await request(baseUrl()).get('/unknown/path').expect(404);
    expect(res.body).toEqual(
      expect.objectContaining({ statusCode: 404, error: 'ROUTE_NOT_FOUND' }),
    );
  });

  it('NO expone stack traces ni secretos en errores', async () => {
    const res = await request(baseUrl()).get('/unknown/path').expect(404);
    expect(JSON.stringify(res.body)).not.toMatch(/stack|secret|JWT|at /i);
  });
});
