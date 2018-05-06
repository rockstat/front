import * as FlakeIdGen from 'flake-idgen';
import { Service } from 'typedi';
import { Uint64BE } from 'int64-buffer'

@Service()
export class IdGenShowFlake {

  idGen: FlakeIdGen;

  constructor() {
    this.idGen = new FlakeIdGen();
  }

  take(): string {
    const idBuff = this.idGen.next();
    return new Uint64BE(idBuff).toString();
  }

  withTime() {
    return {
      id: this.take(),

    }
  }
}
