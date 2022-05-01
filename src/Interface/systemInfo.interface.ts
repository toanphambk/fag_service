import { PlcData } from './plcData.interface';

export interface SystemInfo extends PlcData {
  ipcInfo: serverState;
  serverInfo: serverState;
}

export enum serverState {
  INIT = 'Server Init',
  READY = 'Server Ready',
  ERROR = 'Server Error',
}
