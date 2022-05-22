import { Controller, Get, Body, Patch } from '@nestjs/common';
import { SystemConfigService } from './system-config.service';
import { SystemInfo } from '../Interface/systemInfo.interface';

@Controller('system-config')
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Get()
  async getConfig() {
    return await this.systemConfigService.getConfig();
  }

  @Patch()
  update(@Body() systemConfigDto: SystemInfo) {
    return this.systemConfigService.update(systemConfigDto);
  }
}
