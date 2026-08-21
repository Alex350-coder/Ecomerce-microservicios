import { randomUUID } from 'crypto';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { RequestContextService } from '../request-context.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  constructor(private readonly requestContext: RequestContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const requestId = (req.headers['x-request-id'] as string) ?? randomUUID();
    const method = req.method;
    const url = req.originalUrl;
    const startedAt = Date.now();

    return this.requestContext.run({ requestId }, () =>
      next.handle().pipe(
        tap({
          next: () => {
            const durationMs = Date.now() - startedAt;
            const statusCode = context.switchToHttp().getResponse().statusCode;
            this.logger.log(
              JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'info',
                service: 'auth-service',
                requestId,
                method,
                url,
                statusCode,
                durationMs,
              }),
            );
          },
          error: (err: unknown) => {
            const durationMs = Date.now() - startedAt;
            const statusCode =
              err && typeof err === 'object' && 'status' in err
                ? (err as { status: number }).status
                : 500;
            this.logger.error(
              JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'error',
                service: 'auth-service',
                requestId,
                method,
                url,
                statusCode,
                durationMs,
                error:
                  err instanceof Error ? err.message : 'Unknown error',
              }),
            );
          },
        }),
      ),
    );
  }
}
