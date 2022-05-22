import { Injectable } from '@nestjs/common';
import events from 'events';
import nodes7 from 'nodes7';
import { SystemConfigService } from '../system-config/system-config.service';

@Injectable()
export class PlcCommunicationService {
  constructor(private systemConfigService: SystemConfigService) {}
  public plcEvent = new events.EventEmitter();
  private conn = new nodes7();
  private dataBlock = this.systemConfigService.systemConfig.dataBlock;
  private queue = [];

  public initConnection = () => {
    this.conn.initiateConnection(
      {
        port: this.systemConfigService.systemConfig.plcConnection.port,
        host: this.systemConfigService.systemConfig.plcConnection.ip,
        rack: this.systemConfigService.systemConfig.plcConnection.rack,
        slot: this.systemConfigService.systemConfig.plcConnection.slot,
      },
      (err) => {
        if (typeof err !== 'undefined') {
          return this.errorCallback(err);
        }
        this.conn.setTranslationCB((tag) => {
          return this.dataBlock[tag];
        });
        this.plcEvent.emit('Ipc_Ready');
        console.log('Add data block :', this.dataBlock);

        this.conn.addItems(
          Object.keys(this.dataBlock).map((key) => {
            return key;
          }),
        );
        this.initScan(
          this.systemConfigService.systemConfig.plcConnection.initDelay,
        );
      },
    );
  };

  public initScan = (timeout: number) => {
    setTimeout(() => {
      this.conn.readAllItems(this.readCallback);
    }, timeout);
  };

  public loadPlcConfig = () => {
    //drop connection
    this.conn.dropConnection();
    //generate data bloock config object
    const _configBlock = {};
    for (let i = 0; 19; i++) {
      _configBlock[`vehicleCode${i}`] = `DB14,C${6 * i}.4`;
      _configBlock[`vehicleMode${i}`] = `DB14,C${6 * i + 4}.1`;
    }
    _configBlock[`loadRequest`] = `DB14,X120.1`;
    //transaltion and add item
    this.conn.setTranslationCB((tag) => {
      return _configBlock[tag];
    });
    this.conn.addItems(
      Object.keys(_configBlock).map((key) => {
        return key;
      }),
    );
    //read item
    this.conn.readAllItems(this.readCallback);
    //remove item
    this.conn.removeItems(
      Object.keys(_configBlock).map((key) => {
        return key;
      }),
    );
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
    if (val.loadRequest != undefined) {
      this.plcEvent.emit('Plc_Load_Config', val);
    }
    this.plcEvent.emit('Plc_Read_Callback', val);

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

  private errorCallback = (err) => {
    if (typeof err !== 'undefined') {
      this.plcEvent.emit('System_Error', err);
      if (err.code === 'EUSERTIMEOUT') {
        setTimeout(() => {
          this.initConnection();
        }, this.systemConfigService.systemConfig.plcConnection.reconnectDelay);
      }
    }
  };
}
