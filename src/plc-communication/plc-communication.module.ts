import { Module } from '@nestjs/common';
import { SystemConfigModule } from 'src/system-config/system-config.module';
import { PlcCommunicationService } from './plc-communication.service';

@Module({
  imports: [SystemConfigModule],
  providers: [PlcCommunicationService],
  exports: [PlcCommunicationService],
})
export class PlcCommunicationModule {}
