import { Module } from '@nestjs/common';
import { PlcCommunicationModule } from '../plc-communication/plc-communication.module';
import { SystemInfoController } from './system-info.controller';
import { HttpModule } from '@nestjs/axios';
import { SystemConfigModule } from '../system-config/system-config.module';
import { SystemInfoService } from './system-info.service';

@Module({
  imports: [PlcCommunicationModule, HttpModule, SystemConfigModule],
  providers: [SystemInfoService],
  controllers: [SystemInfoController],
})
export class SystemInfoModule {}
