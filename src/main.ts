import { NestFactory } from '@nestjs/core';
import config from './system-config/entities/config.json';
import { AppModule } from './app.module';
import { SystemLogService } from './system-log/system-log.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new SystemLogService(),
  });
  await app.listen(
    config.app.port,
    config.app.test ? undefined : config.app.ip,
  );
}
bootstrap();
