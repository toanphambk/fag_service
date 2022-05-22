import { Injectable } from '@nestjs/common';
import { PlcCommunicationService } from '../plc-communication/plc-communication.service';
import { addCarDto } from './dto/carInfo.dto';
import { serverState, SystemInfo } from '../Interface/systemInfo.interface';
import * as config from '../system-config/entities/config.json';
import { plcState, plcError } from '../Interface/plcData.interface';
import { HttpService } from '@nestjs/axios';
@Injectable()
export class SystemInfoService {
  constructor(
    private plcCommunicationService: PlcCommunicationService,
    private httpService: HttpService,
  ) {
    this.initSystem();
    setInterval(() => {
      if (this.systemInfo.plcData.conveyorStatus) {
        this.encoderVal += 3;
      }
    }, 50);
  }

  public encoderVal = 0;
  public plcConfig = {};

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
      ipcClock: false,
      lbTrigger: false,
      blockReady: false,
      robotEncoderValue: [0, 0, 0, 0],
      vehicleCode: '',
      vehicleColor: '',
      prodNum: '',
    },
  };
  private index = 1;

  private initSystem = () => {
    this.plcCommunicationService.initConnection();
    this.plcCommunicationService.plcEvent.on('Plc_Read_Callback', (plcData) => {
      this.onPlcRead(plcData);
    });

    this.plcCommunicationService.plcEvent.on('System_Error', (err) => {
      this.onError(err);
    });
    this.plcCommunicationService.plcEvent.on('Ipc_Ready', () => {
      this.onIpcReady;
    });
  };

  public loadConfig = () => {
    this.plcCommunicationService.plcEvent.once('Plc_Load_Config', (val) => {
      console.log(this.plcConfig);
    });
    this.plcCommunicationService.loadPlcConfig();
  };

  public addCar = (carInfo: addCarDto) => {
    if (!this.systemInfo.plcData.blockReady) {
      const _error = {
        source: 'Plc Block Ready Error',
        description: 'Car Info Write Error',
      };
      this.systemInfo.systemData.ipcInfo = serverState.ERROR;
      this.plcCommunicationService.plcEvent.emit('System_Error', _error);
      return _error;
    }
    this.plcCommunicationService.writeToPLC(
      ['prodNum', 'vehicleCode', 'vehicleColor', 'blockReady'],
      [
        carInfo.VINNum,
        carInfo.vehicleCode,
        carInfo.vehicleColor,
        config.app.test,
      ],
    );
    return {
      source: 'data received',
      description: carInfo,
    };
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
        return console.log('block busy');
      }
      const _carInfo = {
        vehicleCode: `v${this.index}`,
        vehicleColor: `r${this.index}`,
        VINNum: `test${this.index}`,
      };
      this.index++;
      return this.addCar(_carInfo);
    }, 1000);
  };

  public encoderLogger = () => {
    const _data = {
      encoderVal: this.encoderVal,
    };
    return _data;
  };

  private onPlcRead = (data) => {
    //update plcdata if change
    if (JSON.stringify(this.systemInfo.plcData) !== JSON.stringify(data)) {
      this.systemInfo.plcData = data;
      console.log(this.systemInfo);
    }
  };

  private onError = (err) => {
    //send Post requiest
    console.log('ERROR:', err);
    this.systemInfo.systemData.ipcInfo = serverState.ERROR;
  };

  private onIpcReady = () => {
    this.systemInfo.systemData.ipcInfo = serverState.READY;
  };
}
