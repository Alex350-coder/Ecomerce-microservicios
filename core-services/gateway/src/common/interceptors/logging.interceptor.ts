import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const requestId = (req.headers['x-request-id'] as string) ?? 'unknown';
    const method = req.method;
    const url = req.originalUrl;
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const durationMs = Date.now() - startedAt;
          const res = context.switchToHttp().getResponse<Response>();
          const statusCode = res.statusCode;
          this.logger.log(
            JSON.stringify({
              timestamp: new Date().toISOString(),
              level: 'info',
              service: 'gateway',
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
              service: 'gateway',
              requestId,
              method,
              url,
              statusCode,
              durationMs,
              error: err instanceof Error ? err.message : 'Unknown error',
            }),
          );
        },
      }),
    );
  }
}
