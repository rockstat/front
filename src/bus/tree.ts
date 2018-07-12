import { BusMsgHdr, BusMsgHdrResult, BusMsgHdrsResult } from '@app/types';
import Container from 'typedi';
import { Logger } from 'rock-me-ts';

interface LevelChildren {
  handlers: BusMsgHdr[];
  children: { [key: string]: LevelChildren };
}

export class TreeBus {
  map: WeakMap<BusMsgHdr, Array<string>> = new WeakMap();
  log: Logger

  private tree: LevelChildren = {
    handlers: [],
    children: {}
  };

  constructor() {
    this.log = Container.get(Logger).for(this);
  }

  handlerEvents(handler: BusMsgHdr): Array<string> {
    let hel = this.map.get(handler);
    if (!hel) {
      hel = [];
      this.map.set(handler, hel);
    }
    return hel;
  }

  replace(keys: string[], handler: BusMsgHdr) {
    const hel = this.handlerEvents(handler);
    const newKeys = keys.filter(k => !hel.includes(k));
    for (const k of newKeys) {
      this.log.info(`+ adding handler from ${k}`);
    }
    const rmKeys = hel.filter(k => !keys.includes(k));
    for (const k of rmKeys) {
      this.log.info(`- removing handler from ${k}`);
    }
    for (const k of rmKeys) {
      this.unSubscribe(k, handler);
    }
    for (const k of newKeys) {
      this.subscribe(k, handler);
    }
  }

  subscribe(key: string | string[], handler: BusMsgHdr) {
    if (!handler) {
      throw new ReferenceError('handler not present');
    }
    if (Array.isArray(key)) {
      for (const k of key) {
        this.subscribe(k, handler);
      }
      return;
    }

    const path = key === '*' ? [] : key.split('.');
    let node = this.tree;
    for (const name of path) {
      if (!node.children[name]) {
        node.children[name] = {
          handlers: [],
          children: {}
        }
      }
      node = node.children[name];
    }
    // Adding handler key
    node.handlers.push(handler);
    this.handlerEvents(handler).push(key);
    return this;
  }

  unSubscribe(key: string, handler: BusMsgHdr) {
    if (!handler) {
      throw new ReferenceError('handler not present');
    }
    const path = key === '*' ? [] : key.split('.');
    let node = this.tree;
    for (const name of path) {
      if (!node.children[name]) {
        return this;
      }
      node = node.children[name];
    }
    // removing handler
    while (node.handlers.includes(handler)) {
      node.handlers.splice(node.handlers.indexOf(handler), 1);
    }
    // removing key form handler dictionary
    const hel = this.handlerEvents(handler);
    while (hel.includes(key)) {
      hel.splice(hel.indexOf(key), 1);
    }
    return this;
  }

  publish(key: string, msg: any): Array<PromiseLike<any>> {
    const path = key.split('.').concat(['']);
    let node = this.tree;
    const handlers: BusMsgHdrResult[] = [];
    for (const name of path) {
      for (let handler of node.handlers) {
        handlers.push(handler(key, msg));
      }
      if (!node.children[name]) {
        break;
      }
      node = node.children[name];
    }
    return handlers;
  }
}
