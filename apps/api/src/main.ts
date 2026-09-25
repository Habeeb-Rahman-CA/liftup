import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import compression from 'compression';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Response Compression (gzip/brotli payload reduction)
  app.use(compression());

  // Graceful Shutdown & DB connection cleanup
  app.enableShutdownHooks();

  // CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global Prefix
  app.setGlobalPrefix('api');

  // API Versioning (/api/v1/...)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v',
  });

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global Interceptors & Error Filters
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TimeoutInterceptor(15000),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger / OpenAPI Setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Liftup API')
    .setDescription('Liftup Modular Full-Stack REST API & Engine Documentation')
    .setVersion('1.0')
    .addTag('Health', 'System and Neon database health diagnostics')
    .addTag('Workout', 'Workout routines, sessions, and logging')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Liftup API Docs',
  });

  const port = process.env.PORT ?? 4000;
  await app.listen(port);

  logger.log(`🚀 NestJS Backend running at http://localhost:${port}/api/v1`);
  logger.log(`📚 Swagger documentation at http://localhost:${port}/api/docs`);
  logger.log(
    `🩺 Health check available at http://localhost:${port}/api/v1/health`,
  );
}
await bootstrap();
