import { Injectable, Logger } from '@nestjs/common';
import events from 'events';
import nodes7 from 'nodes7';
import { SystemConfigService } from '../system-config/system-config.service';
import { queueState } from '../Interface/plcData.interface';
import { config } from 'process';

@Injectable()
export class PlcCommunicationService {
  constructor(private systemConfigService: SystemConfigService) {}
  public plcEvent = new events.EventEmitter();
  public configBlock = {};

  private dataBlock = this.systemConfigService.systemConfig.dataBlock;
  private conn = new nodes7();
  private queue = {
    status: queueState.INIT,
    buffer: [],
  };

  public initConnection = (setting) => {
    return new Promise<void>((resolve, reject) => {
      this.conn.initiateConnection(
        {
          port: this.systemConfigService.systemConfig.plcConnection.port,
          host: this.systemConfigService.systemConfig.plcConnection.ip,
          rack: this.systemConfigService.systemConfig.plcConnection.rack,
          slot: this.systemConfigService.systemConfig.plcConnection.slot,
        },
        (err) => {
          if (typeof err !== 'undefined') {
            reject(this.errorCallback(err));
          }

          this.conn.setTranslationCB((tag) => {
            return setting[tag];
          });

          this.conn.addItems(
            Object.keys(setting).map((key) => {
              return key;
            }),
          );
          console.log(setting);

          this.initScanProcess();
          resolve();
        },
      );
    });
  };

  public startScan = async () => {
    if (this.queue.status != queueState.READY) {
      return;
    }
    try {
      if (this.queue.buffer.length == 0) {
        await this.readFromPlc();
        return this.startScan();
      }
      if (this.queue.buffer.length > 10) {
        this.errorCallback('queue overflow');
        return (this.queue.status = queueState.ERROR);
      }
      await new Promise<void>((resolve, reject) => {
        this.conn.writeItems(
          this.queue.buffer[0].blockName,
          this.queue.buffer[0].data,
          (err) => {
            if (err) {
              reject(this.errorCallback(err));
            }
            resolve();
          },
        );
      });
      this.queue.buffer.shift();
      return this.startScan();
    } catch (error) {
      this.errorCallback(error);
    }
  };

  public initScanProcess = async () => {
    this.queue.buffer = [];
    this.queue.status = queueState.READY;
    return;
  };

  public loadConfig = async () => {
    this.queue.buffer = [];
    this.queue.status = queueState.INIT;
    const _plcConfig = [];
    let _config = {};

    this.conn.dropConnection();

    setTimeout(async () => {
      try {
        for (let i = 0; i <= 20; i++) {
          this.configBlock[`vehicleCode${i}`] = `DB14,C${4 * i}.4`;
        }
        await this.initConnection(this.configBlock);
        _config = await this.readFromPlc();
        console.log(_config);
      } catch (error) {
        this.errorCallback(error);
      }
    }, 500);

    setTimeout(() => {
      this.conn.removeItems();
      this.conn.dropConnection();
      if (_config == undefined) return;
      for (let i = 0; i <= 20; i++) {
        _plcConfig.push({
          vehicleCode: _config[`vehicleCode${i}`].replaceAll('\x00', ''),
        });
      }
    }, 1000);

    return await new Promise<any[]>((resolve) => {
      setTimeout(() => {
        this.queue.status = queueState.READY;
        resolve(_plcConfig);
      }, 2000);
    });
  };

  public writeToPLC = (blockName: string[], data: any[]) => {
    this.queue.buffer.push({ blockName: blockName, data: data });
  };

  private readFromPlc = () => {
    return new Promise<any>((resolve, reject) => {
      this.conn.readAllItems((err, data) => {
        if (err) {
          this.errorCallback(err);
          reject(err);
        }
        this.plcEvent.emit('Plc_Read_Callback', data);

        resolve(data);
      });
    });
  };

  private errorCallback = (err) => {
    if (typeof err !== 'undefined') {
      this.plcEvent.emit('System_Error', err);
    }
  };
}
