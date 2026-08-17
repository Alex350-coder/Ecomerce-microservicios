import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as http from 'http';
import * as https from 'https';
import { IncomingMessage, RequestOptions } from 'http';
import type { Request, Response } from 'express';
import { SERVICE_ROUTES } from '../config/routes';
import { USER_ID_HEADER, USER_ROLE_HEADER } from '../common/middlewares/jwt-edge.middleware';
import { REQUEST_ID_HEADER } from '../common/middlewares/request-id.middleware';

const FORWARD_REQUEST_HEADERS = new Set([
  'content-type',
  'accept',
  'accept-language',
  'authorization',
  'cookie',
  'user-agent',
  'idempotency-key',
  'x-forwarded-for',
  'x-real-ip',
  REQUEST_ID_HEADER,
  USER_ID_HEADER,
  USER_ROLE_HEADER,
]);

const FORWARD_RESPONSE_HEADERS = new Set([
  'content-type',
  'location',
  'set-cookie',
  'cache-control',
  'etag',
]);

interface ProxyError {
  statusCode: number;
  message: string;
  error: string;
  requestId: string;
}

interface UpstreamResponse {
  statusCode?: number;
  headers: http.IncomingHttpHeaders;
  body: string;
}

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);
  private readonly timeoutMs: number;

  constructor(private readonly configService: ConfigService) {
    this.timeoutMs = Number(configService.get<string>('REQUEST_TIMEOUT_MS') ?? 15000) || 15000;
  }

  private resolveTarget(prefix: string): string | null {
    const route = SERVICE_ROUTES.find((r) => r.prefix === prefix);
    if (!route) return null;
    const base = this.configService.get<string>(route.envKey) ?? '';
    return base || null;
  }

  async forward(req: Request, res: Response): Promise<void> {
    const requestId = (req.headers[REQUEST_ID_HEADER] as string) ?? '';
    const prefix = (req.originalUrl.split('?')[0].split('/')[1] ?? '').toLowerCase();
    const baseUrl = this.resolveTarget(prefix);

    if (!baseUrl) {
      this.sendError(res, {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Route not found',
        error: 'ROUTE_NOT_FOUND',
        requestId,
      });
      return;
    }

    const targetUrl = `${baseUrl}${req.originalUrl}`;
    let body: Buffer;
    try {
      body = await this.readBody(req);
    } catch (err) {
      const tooLarge = err instanceof Error && err.message === 'PAYLOAD_TOO_LARGE';
      this.sendError(res, {
        statusCode: tooLarge ? HttpStatus.PAYLOAD_TOO_LARGE : HttpStatus.BAD_REQUEST,
        message: tooLarge ? 'Payload Too Large' : 'Bad Request',
        error: tooLarge ? 'PAYLOAD_TOO_LARGE' : 'BAD_REQUEST',
        requestId,
      });
      return;
    }

    const headers: http.OutgoingHttpHeaders = this.sanitizeIncomingHeaders(req.headers);
    headers[REQUEST_ID_HEADER] = requestId;
    if (body.length > 0) headers['content-length'] = body.length;

    const options: RequestOptions = {
      method: req.method,
      headers,
      timeout: this.timeoutMs,
    };

    try {
      const upstream = await this.request(targetUrl, options, body);
      const statusCode = upstream.statusCode ?? HttpStatus.BAD_GATEWAY;

      if (statusCode >= 500) {
        this.logger.warn(
          `${req.method} ${req.originalUrl} -> upstream ${statusCode}`,
          'upstream-error',
        );
        this.sendError(res, {
          statusCode: HttpStatus.BAD_GATEWAY,
          message: 'Bad Gateway',
          error: 'BAD_GATEWAY',
          requestId,
        });
        return;
      }

      res.status(statusCode);
      for (const header of FORWARD_RESPONSE_HEADERS) {
        const value = upstream.headers[header];
        if (value !== undefined) res.setHeader(header, value);
      }
      res.send(upstream.body);
    } catch (err) {
      const timedOut = err instanceof Error && err.message === 'UPSTREAM_TIMEOUT';
      this.logger.warn(
        `${req.method} ${req.originalUrl} -> ${timedOut ? 'timeout' : 'unreachable'}`,
        'upstream-error',
      );
      this.sendError(res, {
        statusCode: timedOut ? HttpStatus.GATEWAY_TIMEOUT : HttpStatus.BAD_GATEWAY,
        message: timedOut ? 'Gateway Timeout' : 'Bad Gateway',
        error: timedOut ? 'GATEWAY_TIMEOUT' : 'BAD_GATEWAY',
        requestId,
      });
    }
  }

  private sanitizeIncomingHeaders(incoming: IncomingMessage['headers']): http.OutgoingHttpHeaders {
    const result: http.OutgoingHttpHeaders = {};
    for (const [key, value] of Object.entries(incoming)) {
      if (FORWARD_REQUEST_HEADERS.has(key.toLowerCase()) && value !== undefined) {
        result[key] = value;
      }
    }
    return result;
  }

  private readBody(req: Request): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      let size = 0;
      const limit = 100 * 1024;
      req.on('data', (chunk: Buffer) => {
        size += chunk.length;
        if (size > limit) {
          reject(new Error('PAYLOAD_TOO_LARGE'));
          return;
        }
        chunks.push(chunk);
      });
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', () => resolve(Buffer.alloc(0)));
    });
  }

  private request(
    targetUrl: string,
    options: RequestOptions,
    body: Buffer,
  ): Promise<UpstreamResponse> {
    return new Promise((resolve, reject) => {
      const url = new URL(targetUrl);
      const lib = url.protocol === 'https:' ? https : http;

      const upstreamReq = lib.request(
        url,
        { ...options, path: `${url.pathname}${url.search}` },
        (upstreamRes) => {
          const chunks: Buffer[] = [];
          upstreamRes.on('data', (chunk: Buffer) => chunks.push(chunk));
          upstreamRes.on('end', () => {
            resolve({
              statusCode: upstreamRes.statusCode,
              headers: upstreamRes.headers,
              body: Buffer.concat(chunks).toString('utf8'),
            });
          });
        },
      );

      upstreamReq.on('timeout', () => {
        upstreamReq.destroy(new Error('UPSTREAM_TIMEOUT'));
      });
      upstreamReq.on('error', (err) => {
        reject(err);
      });

      if (body.length > 0) upstreamReq.write(body);
      upstreamReq.end();
    });
  }

  private sendError(res: Response, error: ProxyError): void {
    res.status(error.statusCode).json(error);
  }
}
