import { Controller, Get, Body, Patch, Param } from '@nestjs/common';
import { SystemConfigService } from './system-config.service';
import { UpdateSystemConfigDto } from './dto/update-system-config.dto';
import { SystemInfo } from '../Interface/systemInfo.interface';

@Controller('system-config')
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Get()
  async getConfig() {
    return await this.systemConfigService.get();
  }

  @Patch()
  update(@Body() systemConfigDto: SystemInfo) {
    return this.systemConfigService.update(systemConfigDto);
  }
}
