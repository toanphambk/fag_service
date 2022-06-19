import { Module } from '@nestjs/common';
import { SystemInfoModule } from './system-info/system-info.module';
import { PlcCommunicationModule } from './plc-communication/plc-communication.module';
import { SystemConfigModule } from './system-config/system-config.module';
import { SystemLogModule } from './system-log/system-log.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'),
    }),
    SystemInfoModule,
    PlcCommunicationModule,
    SystemConfigModule,
    SystemLogModule,
  ],
})
export class AppModule {}
