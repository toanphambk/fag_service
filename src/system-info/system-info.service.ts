import { Injectable, Logger } from '@nestjs/common';
import { PlcCommunicationService } from '../plc-communication/plc-communication.service';
import { addCarDto } from './dto/carInfo.dto';
import { conveyorState, SystemInfo } from '../Interface/systemInfo.interface';
import {
  plcState,
  plcError,
  serverState,
} from '../Interface/plcData.interface';
import { SystemConfigService } from '../system-config/system-config.service';
import { HttpService } from '@nestjs/axios';
import { Observable, map } from 'rxjs';
import { AxiosResponse } from 'axios';

@Injectable()
export class SystemInfoService {
  constructor(
    private plcCommunicationService: PlcCommunicationService,
    private systemConfigService: SystemConfigService,
    private httpService: HttpService,
  ) {
    this.initSystem();
    this.plcCommunicationService.plcEvent.emit('Ipc_Init');
  }

  testHttp(): Observable<AxiosResponse<any>> {
    return this.httpService
      .get('http://localhost:3000/system-config/')
      .pipe(map((response) => response.data));
  }

  public encoderVal = 0;
  public plcConfig = [];
  public conveyorState: conveyorState = conveyorState.STOP;
  public systemInfo: SystemInfo = {
    systemData: {
      ipcInfo: serverState.INIT,
      serverInfo: serverState.INIT,
    },
    plcData: {
      ipcStatus: serverState.INIT,
      serverStatus: serverState.INIT,
      plcStatus: plcState.INIT,
      errorID: plcError.SYSTEM_NORMAL,
      conveyorStatus: false,
      conveyorSpeed: 0,
      conveyorRampUp: 0,
      conveyorRampDown: 0,
      softEncoderValue: 0,
      ipcClock: false,
      lbTrigger: false,
      blockReady: false,
      loadRequest: 0,
      robotEncoderValue: [0, 0, 0, 0],
      vehicleCode: '',
      vehicleColor: '',
      prodNum: '',
    },
  };

  private index = 0;

  private initSystem = async () => {
    try {
      await this.plcCommunicationService.initConnection(
        this.systemConfigService.systemConfig.dataBlock,
      );
      this.plcCommunicationService.startScan();

      this.plcCommunicationService.plcEvent.on(
        'Plc_Read_Callback',
        (plcData) => {
          this.onPlcRead(plcData);
        },
      );

      this.plcCommunicationService.plcEvent.on('System_Error', (err) => {
        this.onError(err);
      });

      this.plcCommunicationService.plcEvent.on('Ipc_Ready', () => {
        this.onIpcReady();
      });

      this.plcCommunicationService.plcEvent.on('Ipc_Init', () => {
        this.onIpcInit();
      });

      this.initSoftEncoder();

      this.softEncoderTranfer();

      this.ipcClockTrander();
    } catch (error) {
      this.onError(error);
    }
  };

  public loadPlcConfig = async () => {
    try {
      this.systemInfo.plcData.conveyorStatus = false;
      this.plcConfig = await this.plcCommunicationService.loadConfig();
      await this.plcCommunicationService.addItem(
        this.systemConfigService.systemConfig.dataBlock,
      );
      this.plcCommunicationService.writeToPLC(['loadRequest'], [0]);
      this.plcCommunicationService.startScan();
      this.plcCommunicationService.plcEvent.emit('Ipc_Ready');
      Logger.log(`[ PLC CONFIG ] \n` + JSON.stringify(this.plcConfig, null, 2));
      this.encoderVal = 0;
      return this.plcConfig;
    } catch (error) {
      this.plcCommunicationService.plcEvent.emit(
        'System_Error',
        'Load Config Error',
      );
    }
  };

  public initSoftEncoder = () => {
    setTimeout(() => this.initSoftEncoder(), 10);
    this.index++;
    if (this.systemInfo.plcData.conveyorSpeed) {
      this.encoderVal += this.systemInfo.plcData.conveyorSpeed / 100;
    }
    if (this.index == 200) {
      this.index = 0;
      return Logger.log(`[ ENCODER LOG ] : ` + Math.floor(this.encoderVal));
    }
  };

  public addCar = async (carInfo: addCarDto) => {
    if (!this.systemInfo.plcData.blockReady) {
      const _error = {
        source: 'Plc Block Ready Error',
        description: 'Car Info Write Error',
      };
      this.systemInfo.systemData.ipcInfo = serverState.ERROR;
      this.plcCommunicationService.plcEvent.emit('System_Error', _error);
      return _error;
    }

    const index = this.plcConfig.findIndex(
      (e) => e.vehicleCode == carInfo.vehicleCode.toUpperCase(),
    );

    await this.plcCommunicationService.writeToPLC(
      ['prodNum', 'vehicleCode', 'vehicleColor', 'vehicleMode', 'blockReady'],
      [
        carInfo.VINNum.toUpperCase(),
        carInfo.vehicleCode.toUpperCase(),
        carInfo.vehicleColor.toUpperCase(),
        index == -1 ? 0 : index,
        0,
      ],
    );
    const _ = {
      vinVum: carInfo.VINNum.toUpperCase(),
      vehicleCode: carInfo.vehicleCode.toUpperCase(),
      vehicleColor: carInfo.vehicleColor.toUpperCase(),
      setingIndex: index == -1 ? 0 : index,
    };

    Logger.log('[ NEW CAR ] :' + `${JSON.stringify(_, null, 2)}`);
    return {
      source: 'data received',
      description: carInfo,
    };
  };

  public eyeFlowEncoderLogger = () => {
    const _data = {
      encoderVal: Math.floor(this.encoderVal),
      conveyorStatus: conveyorState[this.conveyorState],
    };
    return _data;
  };

  private softEncoderTranfer = () => {
    setTimeout(() => {
      this.softEncoderTranfer();
    }, 200);
    if (
      this.systemInfo.systemData.ipcInfo == serverState.ERROR ||
      this.systemInfo.systemData.ipcInfo == serverState.INIT
    )
      return;

    if (Math.floor(this.encoderVal) == this.systemInfo.plcData.softEncoderValue)
      return;

    this.plcCommunicationService.writeToPLC(
      ['softEncoderValue'],
      [this.encoderVal],
    );
  };

  private onPlcRead = (data) => {
    //update plcdata if change
    if (data.blockReady === undefined) return;
    if (JSON.stringify(this.systemInfo.plcData) !== JSON.stringify(data)) {
      const _change = Object.keys(data)
        .filter((key) => {
          if (key !== 'ipcClock') {
            return data[key] != this.systemInfo.plcData[key];
          }
        })
        .reduce((obj, key) => {
          return Object.assign(obj, {
            [key]: data[key],
          });
        }, {});
      this.systemInfo.plcData = data;
      if (JSON.stringify(_change) !== '{}') {
        Logger.log(`[ STATE CHANGE ] :\n ` + JSON.stringify(_change, null, 2));
      }

      if (this.systemInfo.plcData.loadRequest === 1) {
        this.loadPlcConfig();
      }
    }
  };

  private ipcClockTrander = () => {
    setTimeout(() => {
      this.ipcClockTrander();
    }, 1000);

    if (this.systemInfo.systemData.ipcInfo == serverState.READY) {
      this.plcCommunicationService.writeToPLC(
        ['ipcClock'],
        [!this.systemInfo.plcData.ipcClock],
        false,
      );
    }
  };

  private onError = (err) => {
    //send Post request
    this.systemInfo.systemData.ipcInfo = serverState.ERROR;
    Logger.error(`[ ERROR LOG ] : ${JSON.stringify(err, null, 2)} `);
    // this.plcCommunicationService.initScan(
    //   this.systemConfigService.systemConfig.plcConnection.initDelay,
    // );
  };

  private onIpcInit = () => {
    this.systemInfo.systemData.ipcInfo = serverState.INIT;
    this.plcCommunicationService.writeToPLC(['ipcStatus'], [serverState.INIT]);
  };

  private onIpcReady = () => {
    this.systemInfo.systemData.ipcInfo = serverState.READY;
    this.plcCommunicationService.writeToPLC(['ipcStatus'], [serverState.READY]);
  };

  public startTest = async () => {
    setTimeout(() => {
      this.plcCommunicationService.writeToPLC(['lbTrigger'], [true]);
    }, 100);
    setTimeout(() => {
      this.plcCommunicationService.writeToPLC(['lbTrigger'], [false]);
    }, 200);
    setTimeout(() => {
      if (!this.systemInfo.plcData.blockReady) {
        return Logger.log('block busy');
      }
      const _carInfo = {
        vehicleCode: `v${this.index}`,
        vehicleColor: `r${this.index}`,
        VINNum: `test${this.index}`,
      };
      this.index++;
      return this.addCar(_carInfo);
    }, 1000);
    setTimeout(() => {
      this.plcCommunicationService.writeToPLC(['loadRequest'], [0]);
    }, 1000);
  };
}
