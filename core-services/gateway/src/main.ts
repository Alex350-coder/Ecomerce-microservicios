import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { JwtEdgeMiddleware } from './common/middlewares/jwt-edge.middleware';
import { RequestIdMiddleware } from './common/middlewares/request-id.middleware';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const configService = app.get(ConfigService);

  const corsOrigins = (configService.get<string>('CORS_ORIGIN') ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
    frameguard: { action: 'deny' },
  }));
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'Idempotency-Key'],
    credentials: true,
  });

  const requestIdMiddleware = new RequestIdMiddleware();
  const jwtEdgeMiddleware = new JwtEdgeMiddleware(configService);
  app.use((req, res, next) => requestIdMiddleware.use(req, res, next));
  app.use((req, res, next) => jwtEdgeMiddleware.use(req, res, next));

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  const port = configService.get<number>('PORT') ?? 8000;
  await app.listen(port);
  Logger.log(`gateway listening on http://localhost:${port}`, 'Bootstrap');
}

void bootstrap();
