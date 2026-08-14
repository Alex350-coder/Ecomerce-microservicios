import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as http from 'http';
import * as https from 'https';
import { SERVICE_ROUTES } from '../config/routes';

export interface UpstreamHealth {
  name: string;
  url: string;
  status: 'ok' | 'down';
  latencyMs: number | null;
}

export interface HealthReport {
  status: 'ok';
  service: 'gateway';
  timestamp: string;
  upstreams: UpstreamHealth[];
}

@Injectable()
export class HealthService {
  private readonly timeoutMs = 1500;

  constructor(private readonly configService: ConfigService) {}

  async report(): Promise<HealthReport> {
    const upstreams = await Promise.all(
      SERVICE_ROUTES.map(async (route) => {
        const url = this.configService.get<string>(route.envKey) ?? '';
        return this.checkUpstream(route.prefix, url);
      }),
    );

    return {
      status: 'ok',
      service: 'gateway',
      timestamp: new Date().toISOString(),
      upstreams,
    };
  }

  private checkUpstream(name: string, baseUrl: string): Promise<UpstreamHealth> {
    if (!baseUrl) {
      return Promise.resolve({ name, url: '', status: 'down', latencyMs: null });
    }
    return new Promise((resolve) => {
      const startedAt = Date.now();
      const url = new URL(`${baseUrl}/health`);

      const req = (url.protocol === 'https:' ? https : http).get(
        url,
        { timeout: this.timeoutMs },
        (res) => {
          res.resume();
          res.on('end', () => {
            resolve({
              name,
              url: baseUrl,
              status: res.statusCode === 200 ? 'ok' : 'down',
              latencyMs: Date.now() - startedAt,
            });
          });
        },
      );

      req.on('timeout', () => req.destroy());
      req.on('error', () => {
        resolve({ name, url: baseUrl, status: 'down', latencyMs: null });
      });
    });
  }
}
