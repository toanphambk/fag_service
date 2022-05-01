import { Module } from '@nestjs/common';
import { PlcCommunicationService } from './plc-communication.service';

@Module({
  providers: [PlcCommunicationService],
  exports: [PlcCommunicationService],
})
export class PlcCommunicationModule {}
