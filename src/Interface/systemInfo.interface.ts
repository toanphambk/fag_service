import { PlcData } from './plcData.interface';

export interface SystemInfo {
  systemData: {
    ipcInfo: serverState;
    eyeflowService: serverState;
    fgUploadService: serverState;
  };
  plcData: PlcData;
}

export enum serverState {
  ERROR = 0,
  INIT = 1,
  READY = 2,
}

export enum systemError {
  PLC_BLOCK_READY_ERROR = 0,
}

export enum conveyorState {
  STOP = 0,
  RUNNING = 1,
  RAMP_UP = 2,
  RAMP_DOWN = 3,
}
