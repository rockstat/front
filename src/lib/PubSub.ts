
export type MessageHandler = (key: string, ...args: any[]) => void;

interface LevelChildren {
  handlers: MessageHandler[];
  children: { [key: string]: LevelChildren};
}

export class PubSub {

  private tree: LevelChildren = {
    handlers: [],
    children: {}
  };

  subscribe(key: string, handler: MessageHandler) {
    if (!handler) {
      throw new ReferenceError('handler not present');
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
      node = <LevelChildren>node.children[name];
    }

    node.handlers.push(handler);
    return this;
  }

  unSubscribe(key: string, handler: MessageHandler) {

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

    while (node.handlers.includes(handler)) {
      node.handlers.splice(
        node.handlers.indexOf(handler),
        1
      );
    }

    return this;
  }

  async publish(key: string, ...args: any[]): Promise<any> {

    const path = key.split('.').concat(['']);
    let node = this.tree;
    const results: Array<any> = [];
    for (const name of path) {
      for (let handler of node.handlers) {
        results.push(await handler(key, ...args));
      }
      if (!node.children[name]) {
        return results;
      }
      node = node.children[name];
    }
  }
}
