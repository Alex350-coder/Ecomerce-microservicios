import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import express from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RequestContextService } from './common/request-context.service';
import { RequestIdMiddleware } from './common/middlewares/request-id.middleware';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));

  const corsOrigin = configService.get<string>('CORS_ORIGIN');
  if (corsOrigin) {
    app.enableCors({ origin: corsOrigin });
  }

  const requestIdMiddleware = new RequestIdMiddleware();
  app.use((req, res, next) => requestIdMiddleware.use(req, res, next));

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const requestContext = app.get(RequestContextService);
  app.useGlobalInterceptors(new LoggingInterceptor(requestContext));

  const port = configService.get<number>('PORT') ?? 3004;
  await app.listen(port);
  Logger.log(`cart-service listening on http://localhost:${port}`, 'Bootstrap');
}

void bootstrap();
