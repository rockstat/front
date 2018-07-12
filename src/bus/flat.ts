import { Promise } from 'bluebird';
import Container from 'typedi';
import { BusMsgHdr, BusMsgHdrResult } from '@app/types';
import { Logger } from 'rock-me-ts';

export class FlatBus {
  map: WeakMap<BusMsgHdr, Array<string>> = new WeakMap();
  noneHdr: BusMsgHdr = async (key, msg) => { };
  private handlers: { [key: string]: BusMsgHdr } = {};
  log: Logger;

  constructor() {
    this.log = Container.get(Logger).for(this);
  }

  setNoneHdr(hdr: BusMsgHdr) {
    this.noneHdr = hdr;
  }

  handlerEvents(handler: BusMsgHdr): Array<string> {
    let hel = this.map.get(handler);
    if (!hel) {
      hel = [];
      this.map.set(handler, hel);
    }
    return hel;
  }

  replace(keys: string[], handler: BusMsgHdr): FlatBus {
    const hel = this.handlerEvents(handler);
    const newKeys = keys.filter(k => !hel.includes(k));
    const rmKeys = hel.filter(k => !keys.includes(k));
    for (const key of rmKeys) {
      this.unset(key, handler);
    }
    for (const key of newKeys) {
      this.set(key, handler);
    }
    return this;
  }

  set(key: string | string[], handler: BusMsgHdr): FlatBus {
    if (!handler) {
      throw new ReferenceError('handler not present');
    }
    if (Array.isArray(key)) {
      for (const k of key) {
        this.set(k, handler);
      }
      return this;
    }
    this.log.info(`+ registering handler for ${key}`);

    if (this.handlers[key] !== handler) {
      this.handlers[key] = handler;
      this.handlerEvents(handler).push(key);
    }
    return this;
  }

  unset(key: string, handler: BusMsgHdr): FlatBus {
    if (this.handlers[key] === handler) {
      this.log.info(`- removing handler from ${key}`);
      this.handlers[key] = this.noneHdr;
      // removing method keys list
      const hel = this.handlerEvents(handler);
      while (hel.includes(key)) {
        hel.splice(hel.indexOf(key), 1);
      }
    }
    return this;
  }

  handle(key: string, msg: any): BusMsgHdrResult {
    return (this.handlers[key] || this.noneHdr)(key, msg);
  }
}
