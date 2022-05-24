import { Injectable } from '@nestjs/common';
import path from 'path';
import { readFileSync, writeFileSync } from 'fs';
import { SystemInfo } from '../Interface/systemInfo.interface';
import { async } from 'rxjs';

@Injectable()
export class SystemConfigService {
  constructor() {
    this.getConfig();
  }

  public systemConfig = {
    dataBlock: {
      vehicleCode: 'DB8,C0.4',
      vehicleColor: 'DB8,C4.4',
      prodNum: 'DB8,C8.16',
      blockReady: 'DB8,INT24.1',
      vehicleMode: 'DB8,INT26.1',
      conveyorStatus: 'DB8,X28.0',
      loadRequest: 'DB8,INT30.1',
      conveyorSpeed: 'DB8,INT32.1',
      softEncoderValue: 'DB8,INT34.2',

      ipcStatus: 'DB1,INT0.1',
      serverStatus: 'DB1,INT2.1',
      ipcClock: 'DB1,X4.0',
      plcStatus: 'DB1,INT6.1',
      errorID: 'DB1,INT8.1 ',
      robotEncoderValue: 'DB1,INT10.4',
      lbTrigger: 'DB1,X18.0',
    },
    plcConnection: {
      ip: '192.168.1.50',
      port: 102,
      rack: 0,
      slot: 1,
      reconnectDelay: 2000,
      initDelay: 2000,
    },
    serverConnection: {
      ip: '192.168.2.2',
      port: 8000,
      systemStatusEndPoint: 'systemStatus',
      encoderEndPoint: 'encoder',
      triggerEndPoint: 'trigger',
    },
    app: {
      port: 3000,
      ip: '192.168.2.40',
      test: 1,
    },
  };

  public getConfig = async () => {
    this.systemConfig = await JSON.parse(
      await readFileSync(
        __dirname + '/../system-config/entities/config.json',
        'utf8',
      ),
    );
    return this.systemConfig;
  };

  public update = async (systemConfig: SystemInfo) => {
    await writeFileSync(
      path.resolve(__dirname + '/../system-config/entities/config.json'),
      JSON.stringify(systemConfig, undefined, 2),
    );
    return this.systemConfig;
  };
}
