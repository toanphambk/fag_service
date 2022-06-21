import { Injectable, Logger, HttpStatus, HttpException } from '@nestjs/common';
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
  private carQueue: { detectedPos: number; carInfo: addCarDto }[] = [];
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
      let _temp = '';
      this.plcConfig.forEach((setting, index) => {
        if (!index) return;
        _temp += `[ Setting No ${index} ] : ${setting.vehicleCode}\n`;
      });
      Logger.log(`[ PLC CONFIG ] \n` + _temp);
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
    setTimeout(
      () => this.initSoftEncoder(),
      this.systemConfigService.systemConfig.app.encoderSampleRate,
    );
    this.index++;
    this.carQueueUpdate();

    if (this.systemInfo.plcData.conveyorSpeed) {
      this.encoderVal +=
        this.systemInfo.plcData.conveyorSpeed /
        (1000 / this.systemConfigService.systemConfig.app.encoderSampleRate);
    }
    if (
      this.index ==
      60000 / this.systemConfigService.systemConfig.app.encoderSampleRate
    ) {
      this.index = 0;
      return Logger.log(`[ ENCODER LOG ] : ` + Math.floor(this.encoderVal));
    }
  };

  public addCar = async (carInfo: addCarDto) => {
    const _detectedPos = this.encoderVal;
    if (
      this.carQueue.find((_car) => _car.carInfo.VINNum == carInfo.VINNum) !=
      undefined
    ) {
      const _error = {
        Error: 'Car Info Write Error',
        Desscription: { message: 'Dupplicate Car Info', carInfo: carInfo },
      };
      this.plcCommunicationService.plcEvent.emit('System_Error', _error);
      throw new HttpException(
        {
          status: HttpStatus.NOT_ACCEPTABLE,
          error: _error,
        },
        HttpStatus.NOT_ACCEPTABLE,
      );
    }

    if (!this.systemInfo.plcData.blockReady) {
      const _error = {
        Error: 'Car Info Write Error',
        Desscription: 'Plc Block Ready Error',
      };
      this.systemInfo.systemData.ipcInfo = serverState.ERROR;
      this.plcCommunicationService.plcEvent.emit('System_Error', _error);
      throw new HttpException(
        {
          status: HttpStatus.NOT_ACCEPTABLE,
          error: _error,
        },
        HttpStatus.NOT_ACCEPTABLE,
      );
    }

    const index = this.plcConfig.findIndex(
      (e) => e.vehicleCode == carInfo.vehicleCode.toUpperCase(),
    );

    await this.plcCommunicationService.writeToPLC(
      ['prodNum', 'vehicleCode', 'vehicleColor', 'vehicleMode', 'blockReady'],
      [
        carInfo.b64vin,
        carInfo.vehicleCode.toUpperCase(),
        carInfo.vehicleColor.toUpperCase(),
        index == -1 ? 0 : index,
        0,
      ],
    );

    const _ = {
      vinVum: carInfo.VINNum.toUpperCase(),
      uuid: carInfo.b64vin.toUpperCase(),
      vehicleCode: carInfo.vehicleCode.toUpperCase(),
      vehicleColor: carInfo.vehicleColor.toUpperCase(),
      setingIndex: index == -1 ? 0 : index,
    };

    this.carQueue.push({ detectedPos: _detectedPos, carInfo: carInfo });
    Logger.log('[ NEW CAR ] :' + `${JSON.stringify(_, null, 2)}`);
    console.log(this.carQueue);
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

  private carQueueUpdate = () => {
    this.carQueue = this.carQueue.filter((e) => {
      return this.encoderVal - e.detectedPos < 9000;
    });
  };

  private softEncoderTranfer = () => {
    setTimeout(() => {
      this.softEncoderTranfer();
    }, this.systemConfigService.systemConfig.app.encoderTranferRate);
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
      false,
    );
  };

  private ipcClockTrander = () => {
    setTimeout(() => {
      this.ipcClockTrander();
    }, (1 / this.systemConfigService.systemConfig.app.heartBeatFrequency) * 1000);

    if (this.systemInfo.systemData.ipcInfo == serverState.READY) {
      this.plcCommunicationService.writeToPLC(
        ['ipcClock'],
        [!this.systemInfo.plcData.ipcClock],
        false,
      );
    }
  };

  private onPlcRead = (data) => {
    //update plcdata if change
    if (data.blockReady === undefined) return;

    if (JSON.stringify(this.systemInfo.plcData) !== JSON.stringify(data)) {
      const _change = Object.keys(data)
        .filter((key) => {
          if (key !== 'ipcClock' && key !== 'softEncoderValue') {
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
        Logger.log(
          `[ STATE CHANGE ] :\n` + JSON.stringify(_change, null, 2) + '\n',
        );
        this.systemOnChange();
      }
    }
  };

  private systemOnChange = () => {
    if (this.systemInfo.plcData.loadRequest === 1) {
      this.loadPlcConfig();
    }
    if (this.systemInfo.plcData.ipcStatus === serverState.ERROR) {
      this.plcCommunicationService.writeToPLC(
        ['ipcStatus'],
        [serverState.ERROR],
      );
    }
  };

  private onError = (err) => {
    //send Post request
    this.systemInfo.systemData.ipcInfo = serverState.ERROR;
    Logger.error(`[ ERROR LOG ] : ${JSON.stringify(err, null, 2)} `);
  };

  private onIpcInit = () => {
    this.systemInfo.systemData.ipcInfo = serverState.INIT;
    this.plcCommunicationService.writeToPLC(['ipcStatus'], [serverState.INIT]);
  };

  private onIpcReady = () => {
    this.systemInfo.systemData.ipcInfo = serverState.READY;
    this.plcCommunicationService.writeToPLC(['ipcStatus'], [serverState.READY]);
  };
}
