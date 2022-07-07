export interface Config {
  dataBlock: {
    vehicleCode: string;
    vehicleColor: string;
    prodNum: string;
    blockReady: string;
    vehicleMode: string;
    conveyorStatus: string;
    loadRequest: string;
    conveyorSpeed: string;
    softEncoderValue: string;
    plcEncoderValue: string;
    conveyorRampUp: string;
    conveyorRampDown: string;
    ipcStatus: string;
    serverStatus: string;
    ipcClock: string;
    plcStatus: string;
    errorID: string;
    lbTrigger: string;
  };
  plcConnection: {
    ip: string;
    port: number;
    rack: number;
    slot: number;
  };
  serverConnection: {
    ip: string;
    port: number;
    systemStatusEndPoint: string;
    encoderEndPoint: string;
    triggerEndPoint: string;
  };
  app: {
    port: number;
    ip: string;
    encoderTranferRate: number;
    encoderSampleRate: number;
    heartBeatFrequency: number;
    test: boolean;
  };
}
