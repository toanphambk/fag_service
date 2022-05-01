import { Module } from '@nestjs/common';
import { SystemInfoModule } from './system-info/system-info.module';
import { PlcCommunicationModule } from './plc-communication/plc-communication.module';
import { SystemConfigModule } from './system-config/system-config.module';

@Module({
  imports: [SystemInfoModule, PlcCommunicationModule, SystemConfigModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
