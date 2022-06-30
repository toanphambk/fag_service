import { Body, Controller, Get, Post, Logger } from '@nestjs/common';
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
  @Post('result')
  async result(@Body() data) {
    Logger.log(` [ GET RESULT ] : ${data.id}`);
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
