import { Service } from "typedi";
import { AppServer } from "@app/AppServer";
import { Logger } from '@rockstat/rock-me-ts';

@Service()
export class StubStore {

  log: Logger;

  constructor() {

  }

  push(data: any) {
    // this.log.debug(data, 'Received');
  }
}

