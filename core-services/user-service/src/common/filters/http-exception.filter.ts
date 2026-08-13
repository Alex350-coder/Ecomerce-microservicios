import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';

interface StandardErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
  requestId: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestHeader = request.headers['x-request-id'];
    const requestId = typeof requestHeader === 'string' ? requestHeader : randomUUID();

    let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (body !== null && typeof body === 'object') {
        const raw = body as Record<string, unknown>;
        if (typeof raw.message === 'string') {
          message = raw.message;
        } else if (Array.isArray(raw.message)) {
          message = raw.message.map((m) => String(m));
        }
        if (typeof raw.error === 'string') {
          error = raw.error;
        }
      }
    }

    if (statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url} -> ${statusCode}`,
        exception instanceof Error ? (exception.stack ?? undefined) : undefined,
      );
    }

    const body: StandardErrorBody = { statusCode, message, error, requestId };
    response.status(statusCode).json(body);
  }
}
