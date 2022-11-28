import { BlobOptions } from 'buffer';

export interface PlcData {
  ipcInfo: serverState;
  eyeflowService: serverState;
  fgUploadService: serverState;
  plcStatus: plcState;
  errorID: plcError;
  ipcClock: boolean;
  conveyorRampUp: number;
  conveyorRampDown: number;
  conveyorStatus: boolean;
  plcEncoderValue: number;
  loadRequest: number;
  lbTrigger: boolean;
  blockReady: boolean;
  vehicleCode: string;
  vehicleColor: string;
  prodNum: string;
  softEncoderValue: number;
  conveyorSpeed: number;
  sequenceReset: boolean;
  conveyorBypas: boolean;
}

export enum plcState {
  INIT = 0,
  IDLE = 1,
  AUTO = 2,
  MAUNAL = 3,
  ERROR = 4,
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

export enum queueState {
  INIT = 0,
  READY = 1,
  ERROR = 2,
}
