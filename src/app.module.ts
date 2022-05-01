import { Module } from '@nestjs/common';
import { SystemInfoModule } from './system-info/system-info.module';
import { PlcCommunicationModule } from './plc-communication/plc-communication.module';

@Module({
  imports: [SystemInfoModule, PlcCommunicationModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
