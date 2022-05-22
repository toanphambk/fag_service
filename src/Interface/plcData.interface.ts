export interface PlcData {
  ipcStatus: serverState;
  serverStatus: serverState;
  plcStatus: plcState;
  errorID: plcError;
  ipcClock: boolean;
  conveyorStatus: boolean;
  robotEncoderValue: Array<number>;
  lbTrigger: boolean;
  blockReady: boolean;
  vehicleCode: string;
  vehicleColor: string;
  prodNum: string;
}

export enum plcState {
  INIT = 0,
  IDLE = 1,
  AUTO = 2,
  MAUNAL = 3,
  ERROR = 4,
  DIAGNOSTIC = 5,
}

export enum plcError {
  SYSTEM_NORMAL = 0,
  ROBOT_ERROR = 1,
  CALIPRI_ERROR = 2,
  VEPOSE_ERROR = 3,
}

export enum serverState {
  INIT = 0,
  READY = 1,
  ERROR = 2,
}
