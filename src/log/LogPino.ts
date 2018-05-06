import * as pino from 'pino';
import { LogLevel, LogLevels, LogFn, ChildLogOptions, Logger } from '.';
import { PinoConfig } from '@app/types';

export class LogPino implements Logger {

  warn: LogFn;
  fatal: LogFn;
  error: LogFn;
  debug: LogFn;
  info: LogFn;
  trace: LogFn;

  logger: pino.Logger;

  methods: LogLevel[] = ['trace', 'info', 'debug', 'warn', 'error', 'fatal'];

  constructor(options: PinoConfig, instance?: pino.Logger) {

    this.logger = instance && instance.child(options) || pino(options);

    for (const method of this.methods) {
      this[method as LogLevel] = this.logger[method].bind(this.logger);
    }
  }

  child(options: PinoConfig): LogPino {
    return new LogPino(options, this.logger);
  }
}
