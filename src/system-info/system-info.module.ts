import { Module } from '@nestjs/common';
import { SystemInfoService } from './system-info.service';
import { PlcCommunicationModule } from '../plc-communication/plc-communication.module';
import { SystemInfoController } from './system-info.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  providers: [SystemInfoService],
  imports: [PlcCommunicationModule, HttpModule],
  controllers: [SystemInfoController],
})
export class SystemInfoModule {}
