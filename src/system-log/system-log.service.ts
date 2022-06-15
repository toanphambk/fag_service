import { ConsoleLogger } from '@nestjs/common';
import path from 'path';
import { appendFileSync, existsSync, mkdirSync } from 'fs';

export class SystemLogService extends ConsoleLogger {
  constructor() {
    super();
    if (!existsSync('./dist/log')) {
      mkdirSync('./dist/log');
    }
  }
  error(message: any, stack?: string, context?: string) {
    super.error(message);
    appendFileSync(
      path.resolve('./dist/log/error.log'),
      `[${new Date().toLocaleString()}] ` + message + '\n',
    );
  }

  log(message: any, ...optionalParams: any[]) {
    super.log(message);
    appendFileSync(
      path.resolve('./dist/log/system-log.log'),
      `[${new Date().toLocaleString()}] ` + message + '\n',
    );
    if (message.includes('[ ENCODER LOG ]')) {
      appendFileSync(
        path.resolve('./dist/log/conveyor-log.log'),
        `[${new Date().toLocaleString()}] ` + message + '\n',
      );
    }
    if (message.includes('[ PLC CONFIG ]')) {
      appendFileSync(
        path.resolve('./dist/log/plc-config-log.log'),
        `[${new Date().toLocaleString()}] ` + message + '\n',
      );
    }
    if (message.includes('[ NEW CAR ]')) {
      appendFileSync(
        path.resolve('./dist/log/car-log.log'),
        `[${new Date().toLocaleString()}] ` + message + '\n',
      );
    }
  }
}
