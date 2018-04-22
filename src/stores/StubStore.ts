import { Service } from "typedi";
import { AppServer } from "@app/AppServer";
import { LogFactory, Logger } from '@app/log';

@Service()
export class StubStore {

  log: Logger;

  constructor(logFactory: LogFactory) {
    this.log = logFactory.for(this);
    this.log.info('Initializing...');
  }

  push(data: any) {
    // this.log.debug(data, 'Received');
  }
}

