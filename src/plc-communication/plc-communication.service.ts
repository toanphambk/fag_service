import { Injectable } from '@nestjs/common';
import events from 'events';
import nodes7 from 'nodes7';
import { SystemConfigService } from '../system-config/system-config.service';
import { queueState } from '../Interface/plcData.interface';
import { v4 as uuidv4 } from 'uuid';
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
            return;
          }

          this.conn.setTranslationCB((tag) => {
            return setting[tag];
          });

          this.conn.addItems(
            Object.keys(setting).map((key) => {
              return key;
            }),
          );

          this.initScanProcess();
          console.log(
            `[${new Date().toLocaleString()}] [ CONNECTION INIT DONE ] `,
          );

          resolve();
        },
      );
    });
  };

  public startScan = async () => {
    try {
      if (this.queue.status != queueState.READY) {
        return;
      }
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
          async (err) => {
            if (err) {
              reject(this.errorCallback(err));
              return;
            }
            this.plcEvent.emit(
              this.queue.buffer[0].uuid,
              await this.readFromPlc(),
            );
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
    console.log(`[${new Date().toLocaleString()}] [ INIT SCAN ] `);
    return;
  };

  public loadConfig = async () => {
    try {
      this.queue.status = queueState.INIT;
      const _plcConfig = [];
      let _config = {};

      for (let i = 0; i <= 20; i++) {
        this.configBlock[`vehicleCode${i}`] = `DB14,C${4 * i}.4`;
      }

      await this.addItem(this.configBlock);

      _config = await this.readFromPlc();

      if (_config == undefined) return;

      for (let i = 0; i <= 20; i++) {
        _plcConfig.push({
          vehicleCode: _config[`vehicleCode${i}`].replaceAll('\x00', ''),
        });
      }

      this.queue.status = queueState.READY;
      this.conn.removeItems();
      this.queue.buffer = [];
      return _plcConfig;
    } catch (error) {
      this.errorCallback(error);
    }
  };

  public writeToPLC = (blockName: string[], data: any[]) => {
    return new Promise<void>((resolve) => {
      const _uuid = uuidv4();
      this.queue.buffer.push({
        blockName: blockName,
        data: data,
        uuid: _uuid,
      });
      this.plcEvent.once(_uuid, (data) => {
        this.plcEvent.removeAllListeners(_uuid);
        resolve(data);
      });
    });
  };

  private readFromPlc = () => {
    return new Promise<any>((resolve, reject) => {
      this.conn.readAllItems((err, data) => {
        if (err) {
          this.errorCallback(err);
          reject(err);
          return;
        }
        this.plcEvent.emit('Plc_Read_Callback', data);
        resolve(data);
      });
    });
  };

  public addItem = (items) => {
    return new Promise<void>((resolve) => {
      this.conn.removeItems();
      this.conn.setTranslationCB((tag) => {
        return items[tag];
      });
      this.conn.addItems(
        Object.keys(items).map((key) => {
          return key;
        }),
      );
      setTimeout(() => {
        resolve();
      }, 100);
    });
  };

  private errorCallback = (err) => {
    this.queue.status = queueState.ERROR;
    if (typeof err !== 'undefined') {
      this.plcEvent.emit('System_Error', err);
      console.log(`[ ERROR LOG ] [${new Date().toLocaleString()}] : `, err);
    }
  };
}
