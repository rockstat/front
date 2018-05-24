import { Service } from "typedi";
import { readFileSync } from 'fs';
import { LogFactory, Logger } from "@app/log";
import { Configurer } from "@app/lib";
import { BrowserLibConfig, Envs } from "@app/types";
import { ENV_DEV } from "@app/constants";

type LibParams = { [key: string]: string };

@Service()
export class BrowserLib {

  options: BrowserLibConfig;
  content: Buffer;
  log: Logger;
  dev: boolean;
  loaded: boolean = false;

  constructor(logFactory: LogFactory, configurer: Configurer) {
    this.log = logFactory.for(this);
    this.dev = configurer.env === ENV_DEV;
    this.options = configurer.browserLib;
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
