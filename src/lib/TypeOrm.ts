import { Service } from "typedi";
import { Connection, createConnection, ConnectionOptions } from 'typeorm';
import { LogFactory, Logger } from "@app/log";
import { Configurer } from "@app/lib";
import { TypeOrmConfig } from "@app/types";

@Service()
export class TypeOrm {
  options: TypeOrmConfig;
  log: Logger;
  connection: Connection;
  connected: boolean = false;

  constructor(logFactory: LogFactory, configurer: Configurer) {
    this.options = configurer.typeorm;
    this.log = logFactory.for(this);
  }

  addEntities(entities: Object[]) {
    this.options.entities = this.options.entities.concat(entities);
  }

  async connect() {

    if (this.connected) return;
    this.log.info('Starting TypeORM');
    this.connection = await createConnection(<ConnectionOptions>this.options);
    this.connected = true;
  }

}


// CREATE EXTENSION hstore;
