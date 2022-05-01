import { Injectable } from '@nestjs/common';
import { PlcCommunicationService } from '../plc-communication/plc-communication.service';
import { addCarDto } from './dto/carInfo.dto';
import { SystemInfo } from '../Interface/systemInfo.interface';
import { serverState } from '../Interface/systemInfo.interface';
import config from 'src/config';

@Injectable()
export class SystemInfoService {
  constructor(private plcCommunicationService: PlcCommunicationService) {
    this.plcCommunicationService.initConnection();
    this.plcCommunicationService.plcEvent.on('State_Change', (plcState) => {
      this.onStateChange(plcState);
    });
    this.plcCommunicationService.plcEvent.on('System_Error', (err) => {
      this.onError(err);
    });
  }
  private test = [];

  public systemInfo: SystemInfo = {
    ipcInfo: serverState.INIT,
    serverInfo: serverState.INIT,
    ...this.plcCommunicationService.plcData,
  };

  public addCar = (carInfo: addCarDto) => {
    if (!this.systemInfo.blockReady) {
      this.systemInfo.ipcInfo = serverState.ERROR;
      this.plcCommunicationService.plcEvent.emit('System_Error');
      return {
        source: 'Plc Error',
        description: 'Car Info Write Error',
      };
    }
    this.plcCommunicationService.writeToPLC(
      ['prodNum', 'vehicleCode', 'vehicleColor', 'blockReady'],
      [carInfo.prodNum, carInfo.vehicleCode, carInfo.vehicleColor, config.test],
    );
  };

  private onStateChange = (plcState) => {
    this.systemInfo = { ...plcState };
    console.log(this.systemInfo);
  };

  private onError = (err) => {
    //send Post requiest
    console.log('ERROR:', err);
  };

  public startTest = () => {
    let _index = 0;
    let time = 0;
    this.test[0] = setInterval(() => {
      console.log('TIME : ', time++);
    }, 1000);

    this.test[1] = setInterval(() => {
      setTimeout(() => {
        this.plcCommunicationService.writeToPLC(['lbTrigger'], [true]);
      }, 100);
      setTimeout(() => {
        this.plcCommunicationService.writeToPLC(['lbTrigger'], [false]);
      }, 200);
      setTimeout(() => {
        if (!this.systemInfo.blockReady) {
          return console.log('block busy');
        }
        const _carInfo = {
          vehicleCode: `v${_index}`,
          vehicleColor: `r${_index}`,
          prodNum: `test${_index}`,
        };
        _index++;
        this.addCar(_carInfo);
      }, 1000);
    }, 3000);
  };
  public stopTest = () => {
    clearInterval(this.test[0]);
    clearInterval(this.test[1]);
  };
}
