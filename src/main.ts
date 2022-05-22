import { NestFactory } from '@nestjs/core';
import config from './system-config/entities/config.json';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(config.app.port);
}
bootstrap();
