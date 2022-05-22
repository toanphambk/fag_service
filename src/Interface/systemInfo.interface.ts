import { PlcData } from './plcData.interface';

export interface SystemInfo {
  systemData: {
    ipcInfo: serverState;
    serverInfo: serverState;
  };
  plcData: PlcData;
}

export enum serverState {
  INIT = 0,
  READY = 1,
  ERROR = 2,
}

export enum systemError {
  PLC_BLOCK_READY_ERROR = 0,
}
