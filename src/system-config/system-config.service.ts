import { Injectable } from '@nestjs/common';
import path from 'path';
import config from '../system-config/entities/config.json';
import { writeFileSync } from 'fs';
import { SystemInfo } from '../Interface/systemInfo.interface';

@Injectable()
export class SystemConfigService {
  get = async () => {
    return config;
  };

  update = async (systemConfigDto: SystemInfo) => {
    await writeFileSync(
      path.resolve('../system-config/entities/config.json'),
      JSON.stringify(systemConfigDto, undefined, 2),
    );
    return systemConfigDto;
  };
}
