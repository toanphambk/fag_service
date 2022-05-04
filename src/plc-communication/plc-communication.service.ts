import { Injectable } from '@nestjs/common';
import { PlcData, plcState, plcError } from '../Interface/plcData.interface';
import events from 'events';
import nodes7 from 'nodes7';
import config from '../system-config/entities/config.json';
import { appendFileSync } from 'fs';

@Injectable()
export class PlcCommunicationService {
  public plcData: PlcData = {
    plcStatus: plcState.INIT,
    errorID: plcError.SYSTEM_NORMAL,
    ipcClock: false,
    lbTrigger: false,
    blockReady: false,
    robotEncoderValue: [0, 0, 0, 0],
    vehicleCode: '',
    vehicleColor: '',
    prodNum: '',
  };

  public plcEvent = new events.EventEmitter();
  private conn = new nodes7();
  private dataBlock = config.dataBlock;
  private queue = [];
  private logData = [];

  public initConnection = () => {
    this.conn.initiateConnection(
      {
        port: config.plcConnection.port,
        host: config.plcConnection.ip,
        rack: config.plcConnection.rack,
        slot: config.plcConnection.slot,
      },
      (err) => {
        if (typeof err !== 'undefined') {
          return this.errorCallback(err);
        }
        this.conn.setTranslationCB((tag) => {
          return this.dataBlock[tag];
        });

        console.log('Add data block :', this.dataBlock);

        this.conn.addItems(
          Object.keys(this.dataBlock).map((key) => {
            return key;
          }),
        );
        this.initScan(config.plcConnection.initDelay);
      },
    );
  };

  public initScan = (timeout: number) => {
    setTimeout(() => {
      this.conn.readAllItems(this.readCallback);
    }, timeout);
  };

  public writeToPLC = (blockName: string[], data: any[]) => {
    this.queue.push(() => {
      this.conn.writeItems(blockName, data, this.writeCallback);
    });
  };

  private readCallback = (err, val) => {
    if (err) {
      return this.errorCallback(err);
    }
    if (JSON.stringify(this.plcData) !== JSON.stringify(val)) {
      this.plcEvent.emit('State_Change', val);
      this.plcData = val;
    }

    if (this.queue.length === 0) {
      return this.conn.readAllItems(this.readCallback);
    }
    this.queue[0]();
    this.queue.shift();
  };

  private writeCallback = (err) => {
    if (err) {
      return this.errorCallback(err);
    }
    if (this.queue.length === 0) {
      return this.conn.readAllItems(this.readCallback);
    }
    this.queue[0]();
    this.queue.shift();
  };

  public encoderLogger = () => {
    setInterval(() => {
      if (this.logData.length < 10) {
        this.logData.push(this.plcData.robotEncoderValue[3]);
      } else {
        appendFileSync('data.txt', `${this.logData.toString()},`);
        this.logData = [];
      }
    }, 100);
  };
  private errorCallback = (err) => {
    if (typeof err !== 'undefined') {
      this.plcEvent.emit('System_Error', err);
      if (err.code === 'EUSERTIMEOUT') {
        setTimeout(() => {
          this.initConnection();
        }, config.plcConnection.reconnectDelay);
      }
    }
  };
}
