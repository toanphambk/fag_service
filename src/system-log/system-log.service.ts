import { ConsoleLogger } from '@nestjs/common';
import path from 'path';
import { appendFileSync, readFileSync, writeFileSync } from 'fs';

export class SystemLogService extends ConsoleLogger {
  error(message: any, stack?: string, context?: string) {
    super.error(message);
    appendFileSync(
      path.resolve('./log/error.log'),
      `[${new Date().toLocaleString()}] ` + message + '\n',
    );
  }

  log(message: any, ...optionalParams: any[]) {
    super.log(message);
    appendFileSync(
      path.resolve('./log/system-log.log'),
      `[${new Date().toLocaleString()}] ` + message + '\n',
    );
    if (message.includes('[ ENCODER LOG ]')) {
      appendFileSync(
        path.resolve('./log/conveyor-log.log'),
        `[${new Date().toLocaleString()}] ` + message + '\n',
      );
    }
    if (message.includes('[ PLC CONFIG ]')) {
      appendFileSync(
        path.resolve('./log/plc-config-log.log'),
        `[${new Date().toLocaleString()}] ` + message + '\n',
      );
    }
    if (message.includes('[ NEW CAR ]')) {
      appendFileSync(
        path.resolve('./log/car-log.log'),
        `[${new Date().toLocaleString()}] ` + message + '\n',
      );
    }
  }
}
