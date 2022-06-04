import { Injectable } from '@nestjs/common';
import { PlcCommunicationService } from '../plc-communication/plc-communication.service';
import { addCarDto } from './dto/carInfo.dto';
import { conveyorState, SystemInfo } from '../Interface/systemInfo.interface';
import {
  plcState,
  plcError,
  serverState,
} from '../Interface/plcData.interface';
import { SystemConfigService } from '../system-config/system-config.service';

@Injectable()
export class SystemInfoService {
  constructor(
    private plcCommunicationService: PlcCommunicationService,
    private systemConfigService: SystemConfigService,
  ) {
    this.initSystem();
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
    await this.plcCommunicationService.initConnection(
      this.systemConfigService.systemConfig.dataBlock,
    );
    this.plcCommunicationService.writeToPLC(['loadRequest'], [0]);
    this.plcCommunicationService.startScan();

    this.plcCommunicationService.plcEvent.on('Plc_Read_Callback', (plcData) => {
      this.onPlcRead(plcData);
    });

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

    setInterval(() => {
      this.softEncoderTranfer();
    }, 200);
  };

  public loadPlcConfig = async () => {
    // this.plcCommunicationService.writeToPLC(['ipcStatus'], [serverState.INIT]);
    this.systemInfo.plcData.conveyorStatus = false;
    this.plcConfig = await this.plcCommunicationService.loadConfig();
    await this.plcCommunicationService.addItem(
      this.systemConfigService.systemConfig.dataBlock,
    );
    this.plcCommunicationService.writeToPLC(['loadRequest'], [0]);
    this.plcCommunicationService.startScan();
    this.plcCommunicationService.plcEvent.emit('Ipc_Ready');
    console.log(
      `[${new Date().toLocaleString()}] [ PLC CONFIG ] \n`,
      this.plcConfig,
    );

    this.encoderVal = 0;
    return this.plcConfig;
  };

  public initSoftEncoder = () => {
    setTimeout(() => this.initSoftEncoder(), 100);
    this.index++;
    if (this.systemInfo.plcData.conveyorStatus) {
      this.encoderVal += this.systemInfo.plcData.conveyorSpeed / 10;
    }
    if (this.index == 100) {
      this.index = 0;
      return console.log(
        `[${new Date().toLocaleString()}] [ ENCODER LOG ] : `,
        Math.floor(this.encoderVal),
      );
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
    if (
      this.systemInfo.systemData.ipcInfo == serverState.ERROR ||
      this.systemInfo.systemData.ipcInfo == serverState.INIT
    )
      return;

    if (this.encoderVal == this.systemInfo.plcData.softEncoderValue) return;

    this.plcCommunicationService.writeToPLC(
      ['softEncoderValue'],
      [this.encoderVal],
    );
  };

  private onPlcRead = (data) => {
    //update plcdata if change
    if (data.blockReady === undefined) return;
    if (JSON.stringify(this.systemInfo.plcData) !== JSON.stringify(data)) {
      this.systemInfo.plcData = data;
      console.log(`[${new Date().toLocaleString()}] [ STATE CHANGE ] : `, data);
      if (this.systemInfo.plcData.loadRequest === 1) {
        this.loadPlcConfig();
      }
    }
  };

  private onError = async (err) => {
    //send Post request
    this.systemInfo.systemData.ipcInfo = serverState.ERROR;
    console.log(`[${new Date().toLocaleString()}] [ ERROR CALLBACK ] : `, err);
    // this.plcCommunicationService.initScan(
    //   this.systemConfigService.systemConfig.plcConnection.initDelay,
    // );
  };

  private onIpcInit = () => {
    this.systemInfo.systemData.ipcInfo = serverState.INIT;
  };

  private onIpcReady = () => {
    this.systemInfo.systemData.ipcInfo = serverState.READY;
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
}
