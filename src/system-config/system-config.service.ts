import { Injectable } from '@nestjs/common';
import path from 'path';
import config from '../system-config/entities/config.json';
import { readFileSync, writeFileSync } from 'fs';
import { SystemInfo } from '../Interface/systemInfo.interface';

@Injectable()
export class SystemConfigService {
  public get = () => {
    return config;
  };

  public update = async (systemConfig: SystemInfo) => {
    await writeFileSync(
      path.resolve(__dirname + '/../system-config/entities/config.json'),
      JSON.stringify(systemConfig, undefined, 2),
    );
    return await readFileSync(
      __dirname + '/../system-config/entities/config.json',
      'utf8',
    );
  };
}
