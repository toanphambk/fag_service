import { Injectable } from '@nestjs/common';
import path from 'path';
import { readFileSync, writeFileSync } from 'fs';
import { SystemInfo } from '../Interface/systemInfo.interface';
import { Config } from '../Interface/config.interfaces';

@Injectable()
export class SystemConfigService {
  constructor() {
    this.getConfig();
  }

  public systemConfig: Config;

  public getConfig = async () => {
    this.systemConfig = await JSON.parse(
      readFileSync(
        __dirname + '/../system-config/entities/config.json',
        'utf8',
      ),
    );
    return this.systemConfig;
  };

  public update = async (systemConfig: SystemInfo) => {
    writeFileSync(
      path.resolve(__dirname + '/../system-config/entities/config.json'),
      JSON.stringify(systemConfig, undefined, 2),
    );
    return this.systemConfig;
  };
}
