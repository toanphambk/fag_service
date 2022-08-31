import { ConsoleLogger } from '@nestjs/common';
import path from 'path';
import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SystemLogService extends ConsoleLogger {
  constructor() {
    super();
    if (!existsSync('./dist/log')) {
      mkdirSync('./dist/log');
    }
  }

  error(message: any, stack?: string, context?: string) {
    super.error(message);
    const msg = `[${new Date().toLocaleString()}] ` + message + '\n';
    appendFileSync(path.resolve('./dist/log/error.log'), msg);
  }

  log(message: any, ...optionalParams: any[]) {
    super.log(message);
    const msg = `[${new Date().toLocaleString()}] ` + message + '\n';
    appendFileSync(path.resolve('./dist/log/system-log.log'), msg);
    if (message.includes('[ ENCODER LOG ]')) {
      appendFileSync(path.resolve('./dist/log/conveyor-log.log'), msg);
    }
    if (message.includes('[ PLC CONFIG ]')) {
      appendFileSync(path.resolve('./dist/log/plc-config-log.log'), msg);
    }
    if (message.includes('[ WRITE TO PLC ]')) {
      appendFileSync(path.resolve('./dist/log/write_to_plc.log'), msg);
    }
    if (message.includes('[ STATE CHANGE ]')) {
      appendFileSync(path.resolve('./dist/log/state_change.log'), msg);
    }
    if (message.includes('[ NEW CAR ]')) {
      appendFileSync(path.resolve('./dist/log/car-log.log'), msg);
    }
    if (message.includes('[ ENCODER LOG ]')) {
      appendFileSync(path.resolve('./dist/log/conveyor-log.log'), msg);
    }
    if (message.includes('[ GET RESULT ]')) {
      appendFileSync(path.resolve('./dist/log/result.log'), msg);
    }
    if (message.includes('[ CAR QUEUE ]')) {
      appendFileSync(path.resolve('./dist/log/queue.log'), msg);
    }
  }
}
