import { Service } from "typedi";
import { readFileSync } from 'fs';
import { LogFactory, Logger } from "@app/log";
import { Configurer } from "@app/lib";
import { BrowserLibConfig } from "@app/types";


@Service()
export class BrowserLib {

  options: BrowserLibConfig;
  content: Buffer;
  log: Logger;

  constructor(logFactory: LogFactory, configurer: Configurer) {
    this.log = logFactory.for(this);
    this.options = configurer.browserLib;
    this.content = readFileSync(this.options.file);

    this.log.info({
      fn: this.options.file,
      size: `${Math.round(this.content.length / 1024)}kb`
    }, 'loaded browser lib');
  }

  prepare(params: { [key: string]: string }) {
    const cmd = new Buffer(`window.alco&&window.alco('configure',${JSON.stringify(params)});`);
    return Buffer.concat([cmd, this.content]);
  }
}
