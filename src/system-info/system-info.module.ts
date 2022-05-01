import { Module } from '@nestjs/common';
import { SystemInfoService } from './system-info.service';
import { PlcCommunicationModule } from '../plc-communication/plc-communication.module';
import { SystemInfoController } from './system-info.controller';

@Module({
  providers: [SystemInfoService],
  imports: [PlcCommunicationModule],
  controllers: [SystemInfoController],
})
export class SystemInfoModule {}
