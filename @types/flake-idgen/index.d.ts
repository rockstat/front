
/// <reference types="node" />

declare module 'flake-idgen' {

  class FlakeId {
    constructor(options?: any);
    next(cb?: (id: Buffer) => any): Buffer;
  }

  namespace FlakeId { }
  export = FlakeId;


}
