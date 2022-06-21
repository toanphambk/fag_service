import { Body, Controller, Get, Post } from '@nestjs/common';
import { SystemInfoService } from './system-info.service';
import { addCarDto } from './dto/carInfo.dto';

@Controller('system-info')
export class SystemInfoController {
  constructor(private systemInfoService: SystemInfoService) {}
  @Post('addCar')
  async addCar(@Body() carInfo: addCarDto) {
    try {
      return this.systemInfoService.addCar(carInfo);
    } catch (error) {
      throw error;
    }
  }

  @Get('encoderVal')
  encoderVal() {
    return this.systemInfoService.eyeFlowEncoderLogger();
  }

  @Get('plcConfig')
  loadPlcConfig() {
    return this.systemInfoService.loadPlcConfig();
  }

  @Get('testHttp')
  testHttp() {
    return this.systemInfoService.testHttp();
  }
}
