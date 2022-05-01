import { Body, Controller, Get, Post } from '@nestjs/common';
import { SystemInfoService } from './system-info.service';
import { addCarDto } from './dto/carInfo.dto';

@Controller('system-info')
export class SystemInfoController {
  constructor(private systemInfoService: SystemInfoService) {}
  @Get()
  hello() {
    return 'this rout work';
  }
  @Post('addCar')
  addCar(@Body() carInfo: addCarDto): { source: string; description: string } {
    console.log(carInfo);
    return this.systemInfoService.addCar(carInfo);
  }
  @Post('startTest')
  startTest() {
    return this.systemInfoService.startTest();
  }
}
