import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { SERVICE_ROUTES } from '../../config/routes';

export const USER_ID_HEADER = 'x-user-id';
export const USER_ROLE_HEADER = 'x-user-role';

const PUBLIC_PATHS: Array<{ method?: string; pattern: RegExp }> = [
  { pattern: /^\/health(\/.*)?$/ },
  { pattern: /^\/auth\/login$/ },
  { pattern: /^\/auth\/register$/ },
  { pattern: /^\/auth\/refresh$/ },
  { pattern: /^\/auth\/logout$/ },
  { pattern: /^\/auth\/forgot-password$/ },
  { pattern: /^\/auth\/reset-password$/ },
  { method: 'GET', pattern: /^\/products(\/.*)?$/ },
  { method: 'GET', pattern: /^\/categories(\/.*)?$/ },
];

export function isPublicRoute(method: string, path: string): boolean {
  return PUBLIC_PATHS.some((r) => {
    if (r.method && r.method !== method) return false;
    return r.pattern.test(path);
  });
}

function isProxiedPrefix(path: string): boolean {
  const prefix = path.split('/')[1] ?? '';
  return SERVICE_ROUTES.some((r) => r.prefix === prefix);
}

@Injectable()
export class JwtEdgeMiddleware implements NestMiddleware {
  private readonly jwtSecret: string;

  constructor(configService: ConfigService) {
    this.jwtSecret = configService.get<string>('JWT_SECRET') ?? '';
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const path = req.originalUrl.split('?')[0];

    if (!isProxiedPrefix(path) || isPublicRoute(req.method, path)) {
      next();
      return;
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      this.unauthorized(res, req);
      return;
    }

    const token = authHeader.slice('Bearer '.length);
    try {
      const payload = jwt.verify(token, this.jwtSecret);
      if (typeof payload === 'string' || !payload.sub || !payload.role) {
        this.unauthorized(res, req);
        return;
      }
      req.headers[USER_ID_HEADER] = String(payload.sub);
      req.headers[USER_ROLE_HEADER] = String(payload.role);
      next();
    } catch {
      this.unauthorized(res, req);
    }
  }

  private unauthorized(res: Response, req: Request): void {
    res.status(401).json({
      statusCode: 401,
      message: 'Unauthorized',
      error: 'AUTH_INVALID_TOKEN',
      requestId: req.headers['x-request-id'] ?? '',
    });
  }
}
