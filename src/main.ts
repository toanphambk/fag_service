import { NestFactory } from '@nestjs/core';
import config from './system-config/entities/config.json';
import { AppModule } from './app.module';
import { SystemLogService } from './system-log/system-log.service';
import { urlencoded, json } from 'express';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new SystemLogService(),
  });
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(
    config.app.port,
    config.app.test ? undefined : config.app.ip,
  );
}
bootstrap();
