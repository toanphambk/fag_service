import { Injectable } from '@nestjs/common';
import { PlcCommunicationService } from '../plc-communication/plc-communication.service';
import { addCarDto } from './dto/carInfo.dto';
import { SystemInfo } from '../Interface/systemInfo.interface';
import {
  plcState,
  plcError,
  serverState,
} from '../Interface/plcData.interface';
import { HttpService } from '@nestjs/axios';
import { SystemConfigService } from '../system-config/system-config.service';

@Injectable()
export class SystemInfoService {
  constructor(
    private plcCommunicationService: PlcCommunicationService,
    private httpService: HttpService,
    private systemConfigService: SystemConfigService,
  ) {
    this.initSystem();
  }

  public encoderVal = 0;
  public plcConfig = [];

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
      softEncoderValue: 0,
      ipcClock: false,
      lbTrigger: false,
      blockReady: false,
      loadRequest: false,
      robotEncoderValue: [0, 0, 0, 0],
      vehicleCode: '',
      vehicleColor: '',
      prodNum: '',
    },
  };

  private index = 1;

  private initSystem = () => {
    this.plcCommunicationService.initConnection();
    this.plcCommunicationService.initScan(
      this.systemConfigService.systemConfig.plcConnection.initDelay,
    );

    this.plcCommunicationService.plcEvent.on('Plc_Read_Callback', (plcData) => {
      this.onPlcRead(plcData);
    });

    this.plcCommunicationService.plcEvent.on('System_Error', (err) => {
      this.onError(err);
    });

    this.plcCommunicationService.plcEvent.on('Ipc_Ready', () => {
      this.onIpcReady();
    });

    this.plcCommunicationService.plcEvent.on('Plc_Load_Config', (val) => {
      this.onLoadPlcConfig(val);
    });

    setInterval(() => {
      if (this.systemInfo.plcData.conveyorStatus) {
        this.encoderVal += this.systemInfo.plcData.conveyorSpeed / 10;
      }
    }, 100);

    setInterval(() => {
      this.softEncoderTranfer();
    }, 250);
  };

  public loadPlcConfig = () => {
    this.systemInfo.plcData.ipcStatus = serverState.INIT;
    // this.plcCommunicationService.writeToPLC(['ipcStatus'], [serverState.INIT]);
    this.plcCommunicationService.loadConfig();
    return this.plcConfig;
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

    const index = this.plcConfig.findIndex(
      (e) => e.vehicleCode == carInfo.vehicleCode.toUpperCase(),
    );

    this.plcCommunicationService.writeToPLC(
      ['prodNum', 'vehicleCode', 'vehicleColor', 'vehicleMode', 'blockReady'],
      [
        carInfo.VINNum.toUpperCase(),
        carInfo.vehicleCode.toUpperCase(),
        carInfo.vehicleColor.toUpperCase(),
        index == -1 ? 0 : index,
        0,
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
    setTimeout(() => {
      this.plcCommunicationService.writeToPLC(['loadRequest'], [0]);
    }, 1000);
  };

  public encoderLogger = () => {
    const _data = {
      encoderVal: Math.floor(this.encoderVal),
      conveyorStatus: this.systemInfo.plcData.conveyorStatus,
    };
    return _data;
  };

  private onPlcRead = (data) => {
    //update plcdata if change
    if (JSON.stringify(this.systemInfo.plcData) !== JSON.stringify(data)) {
      this.systemInfo.plcData = data;
      console.log('change :', data);
      if (this.systemInfo.plcData.loadRequest) {
        this.plcCommunicationService.loadConfig();
      }
    }
  };

  private softEncoderTranfer = () => {
    if (
      this.systemInfo.systemData.ipcInfo == serverState.ERROR ||
      this.systemInfo.systemData.ipcInfo == serverState.INIT
    ) {
      return;
    }
    this.plcCommunicationService.writeToPLC(
      ['softEncoderValue'],
      [[(this.encoderVal & 0xffff0000) >> 16, this.encoderVal & 0xffff]],
    );
  };

  private onLoadPlcConfig = (val) => {
    const _plcConfig = [];
    for (let i = 0; i <= 20; i++) {
      _plcConfig.push({
        vehicleCode: val[`vehicleCode${i}`].replaceAll('\x00', ''),
      });
    }
    this.plcConfig = _plcConfig;
    console.log(this.plcConfig);

    this.plcCommunicationService.initConnection();

    this.plcCommunicationService.initScan(
      this.systemConfigService.systemConfig.plcConnection.initDelay,
    );

    setTimeout(() => {
      this.plcCommunicationService.writeToPLC(['loadRequest'], [0]);
    }, this.systemConfigService.systemConfig.plcConnection.initDelay + 200);

    setTimeout(() => {
      this.plcCommunicationService.plcEvent.emit('Ipc_Ready');
    }, this.systemConfigService.systemConfig.plcConnection.initDelay + 1000);
  };

  private onError = (err) => {
    //send Post request
    console.log('ERROR:', err);
    this.systemInfo.systemData.ipcInfo = serverState.ERROR;
    if (err.code === 'EUSERTIMEOUT') {
      this.plcCommunicationService.initConnection();
    }

    this.plcCommunicationService.initScan(
      this.systemConfigService.systemConfig.plcConnection.initDelay,
    );
  };

  private onIpcReady = () => {
    this.systemInfo.systemData.ipcInfo = serverState.READY;
  };
}
