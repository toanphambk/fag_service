import { Body, Controller, Get, Post } from '@nestjs/common';
import { SystemInfoService } from './system-info.service';
import { addCarDto } from './dto/carInfo.dto';

@Controller('system-info')
export class SystemInfoController {
  constructor(private systemInfoService: SystemInfoService) {}
  @Post('addCar')
  addCar(@Body() carInfo: addCarDto) {
    return this.systemInfoService.addCar(carInfo);
  }
  @Post('startTest')
  startTest() {
    return this.systemInfoService.startTest();
  }
  @Get('encoderVal')
  encoderVal() {
    return Math.floor(this.systemInfoService.encoderLogger());
  }
}
