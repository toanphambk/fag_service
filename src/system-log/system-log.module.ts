import { Module } from '@nestjs/common';
import { SystemLogService } from './system-log.service';

@Module({
  providers: [SystemLogService],
})
export class SystemLogModule {}
