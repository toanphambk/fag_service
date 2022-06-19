import { Module } from '@nestjs/common';
import { SystemInfoModule } from './system-info/system-info.module';
import { PlcCommunicationModule } from './plc-communication/plc-communication.module';
import { SystemConfigModule } from './system-config/system-config.module';
import { SystemLogModule } from './system-log/system-log.module';

@Module({
  imports: [
    SystemInfoModule,
    PlcCommunicationModule,
    SystemConfigModule,
    SystemLogModule,
  ],
})
export class AppModule {}
