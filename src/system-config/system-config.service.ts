import { Injectable } from '@nestjs/common';
import { CreateSystemConfigDto } from './dto/create-system-config.dto';
import { UpdateSystemConfigDto } from './dto/update-system-config.dto';
import * as config from '../config.json';
@Injectable()
export class SystemConfigService {
  create(createSystemConfigDto: CreateSystemConfigDto) {
    return 'This action adds a new systemConfig';
  }

  async getConfig() {
    return JSON.stringify(config, undefined, 2);
  }

  findOne(id: number) {
    return `This action returns a #${id} systemConfig`;
  }

  update(id: number, updateSystemConfigDto: UpdateSystemConfigDto) {
    return `This action updates a #${id} systemConfig`;
  }

  remove(id: number) {
    return `This action removes a #${id} systemConfig`;
  }
}
