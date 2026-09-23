import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  logger.log(`🚀 NestJS Backend running at http://localhost:${port}/api`);
  logger.log(`🩺 Health check available at http://localhost:${port}/api/health`);
}
await bootstrap();
