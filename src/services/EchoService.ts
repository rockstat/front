import { Container } from 'typedi';
import { MessageHandler, Dispatcher } from '@app/lib';
import { Logger } from '@app/log';
import { ClientHttpMessage, FlexOutgoingMessage, BaseIncomingMessage } from "@app/types";
import {
  INCOMING,
  OUT_WEBSOCK_BROADCAST,
  CMD_WEBSOCK_ADD_GROUP,
  IN_WEBSOCK_HELLO,
  KEY_ECHO,
} from '@app/constants';
import { epglue } from '@app/helpers';

interface EchoServiceConfig {
  secret?: string
}

export = class EchoService {
  dispatcher: Dispatcher;
  options: EchoServiceConfig = {};
  log: Logger;

  constructor({ log, config, container }: { log: Logger, config: EchoServiceConfig, container: Container }) {
    this.log = log;
  }

  register(dispatcher: Dispatcher) {
    this.dispatcher = dispatcher;

    this.dispatcher.registerListener(IN_WEBSOCK_HELLO, (key, msg) => {
      this.dispatcher.emit(CMD_WEBSOCK_ADD_GROUP, { uid: msg.uid, group: KEY_ECHO });
    });

    this.dispatcher.registerListener(INCOMING, (key: string, msg: BaseIncomingMessage) => {
      console.log(msg);
      this.dispatcher.emit(epglue(OUT_WEBSOCK_BROADCAST), { name: KEY_ECHO, group: KEY_ECHO, data: msg });
    });
  }

}
