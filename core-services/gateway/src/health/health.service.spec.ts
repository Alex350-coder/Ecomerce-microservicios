import { ConfigService } from '@nestjs/config';
import { HealthService } from './health.service';
import * as http from 'http';

jest.mock('http');
jest.mock('https');

describe('HealthService', () => {
  const configService = {
    get: jest.fn((key: string) => {
      const urls: Record<string, string> = {
        AUTH_SERVICE_URL: 'http://auth:3002',
        USER_SERVICE_URL: 'http://user:3001',
      };
      return urls[key] ?? '';
    }),
  } as unknown as ConfigService;

  let service: HealthService;

  beforeEach(() => {
    service = new HealthService(configService);
    jest.clearAllMocks();
  });

  it('returns ok status with upstream health', async () => {
    const mockRes = { statusCode: 200, resume: jest.fn(), on: jest.fn((_, cb) => cb()) };
    (http.get as jest.Mock).mockReturnValue({ on: jest.fn() });

    // Mock the response stream
    (http.get as jest.Mock).mockImplementation((_url: any, _opts: any, cb: any) => {
      const res = { statusCode: 200, resume: jest.fn(), on: jest.fn((event: string, handler: Function) => { if (event === 'end') handler(); }) };
      cb(res);
      return { on: jest.fn() };
    });

    const report = await service.report();

    expect(report.status).toBe('ok');
    expect(report.service).toBe('gateway');
    expect(report.upstreams).toBeDefined();
    expect(report.upstreams.length).toBeGreaterThan(0);
  });

  it('marks upstream as down when url is empty', async () => {
    const emptyConfig = {
      get: jest.fn(() => ''),
    } as unknown as ConfigService;
    const svc = new HealthService(emptyConfig);

    const report = await svc.report();

    expect(report.upstreams.every((u) => u.status === 'down')).toBe(true);
  });
});
