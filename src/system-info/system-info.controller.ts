import { Body, Controller, Get, Post, Logger } from '@nestjs/common';
import { SystemInfoService } from './system-info.service';
import { addCarDto } from './dto/carInfo.dto';
import { writeFileSync } from 'fs';

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

  @Post('bypass')
  async bypassConveyor(@Body() carInfo: addCarDto) {
    try {
      return this.systemInfoService.conveyorBypas();
    } catch (error) {
      throw error;
    }
  }

  @Post('result')
  async result(@Body() data) {
    console.log(JSON.stringify(data, null, 2));
    Logger.log(` [ GET RESULT ] : ${data.id}`);
    // const buf = Buffer.from(data.base64, 'base64');
    // writeFileSync(`./temp/${data.id}.pdf`, buf, 'base64');
  }

  @Post('serviceStat')
  uploadServiceStat(@Body() data) {
    console.log(data);
    return this.systemInfoService.serviceCheck(data.serviceName);
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
