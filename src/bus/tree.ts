
import Container from 'typedi';
import { Logger } from '@rockstat/rock-me-ts';
import { LevelChildrenAsync, BusMsgHdr, BusMsgHdrResult } from './interfaces'

export class TreeBus {

  name: string;
  protected map: WeakMap<BusMsgHdr, Array<string>> = new WeakMap();
  protected log: Logger

  private tree: LevelChildrenAsync = {
    handlers: [],
    children: {}
  };

  constructor(name = 'untitled') {
    this.log = Container.get(Logger).for(this);
    this.name = name;
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
    const rmKeys = hel.filter(k => !keys.includes(k));
    for (const k of rmKeys) {
      this.unSubscribe(k, handler);
    }
    for (const k of newKeys) {
      this.subscribe(k, handler);
    }
  }

  subscribe(key: string | string[], handler: BusMsgHdr) {
    if (!handler) {
      throw new ReferenceError(`${this.name}: handler not present`);
    }
    if (Array.isArray(key)) {
      for (const k of key) {
        this.subscribe(k, handler);
      }
      return;
    }
    this.log.info(`${this.name}: Registering handler for ${key}}`)
    const parts = [];
    const path = key === '*' ? [] : key.split('.');
    let node = this.tree;
    for (const name of path) {
      parts.push(name);
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
    this.log.info(`> ${parts.join('.')}`)
    return this;
  }

  unSubscribe(key: string, handler: BusMsgHdr) {
    if (!handler) {
      throw new ReferenceError(`${this.name}: handler not present`);
    }
    const path = key === '*' ? [] : key.split('.').filter(e => e !== '*');;
    let node = this.tree;
    for (const name of path) {
      if (!node.children[name]) {
        return this;
      }
      node = node.children[name];
    }
    // removing handler
    this.log.info(`${this.name}: Unregistering handler for ${key}}`)

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

  handler(key: string, msg: any): PromiseLike<any> {
    const parts = key.split('.').concat(['']);
    const path: Array<string> = [];
    let node = this.tree;
    const handlers: BusMsgHdr[] = [];
    for (const name of parts) {
      for (let handler of node.handlers) {
        handlers.push(handler);
      }
      if (!node.children[name]) {
        break;
      }
      path.push(name);
      node = node.children[name];
    }
    return handlers[handlers.length - 1](path.join('.'), msg);
  }

}
