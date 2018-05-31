import { Service, Container } from "typedi";
import { readFileSync } from 'fs';
import { BrowserLibConfig, Envs, FrontierConfig } from "@app/types";
import { ENV_DEV } from "@app/constants";
import { LoggerType, Logger, AppConfig } from 'rock-me-ts';
type LibParams = { [key: string]: string };

export class BrowserLib {

  options: BrowserLibConfig;
  content: Buffer;
  log: LoggerType;
  dev: boolean;
  loaded: boolean = false;

  constructor() {
    this.log = Container.get(Logger).for(this);
    const appConfig = Container.get<AppConfig<FrontierConfig>>(AppConfig);
    this.dev = appConfig.env === ENV_DEV;
    this.options = appConfig.static;
    // warmup lib
    this.lib();
    this.log.info({
      fn: this.options.file,
      size: `${Math.round(this.content.length / 1024)}kb`,
      dev: this.dev
    }, 'loaded browser lib');
  }

  lib() {
    if (!this.loaded || this.dev) {
      this.content = readFileSync(this.options.file);
      this.loaded = true;
    }
    return this.content;
  }

  rtConfig(params: LibParams): string {
    return `window.alco&&window.alco('configure',${JSON.stringify(params)});`;
  }

  prepare(params: LibParams) {
    const cmd = new Buffer(this.rtConfig(params));
    return Buffer.concat([cmd, this.lib()]);
  }
}
