import { Container } from 'typedi';
import { Dispatcher } from '@app/';
import { Logger } from 'rock-me-ts';
import { ClientHttpMessage, BaseIncomingMessage } from "@app/types";
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

export class EchoService {
  dispatcher: Dispatcher;
  options: EchoServiceConfig = {};
  log: Logger;

  // constructor({ log, config, container }: { log: Logger, config: EchoServiceConfig, container: Container }) {
  //   this.log = log;
  // }

  register(dispatcher: Dispatcher) {
    // this.dispatcher = dispatcher;

    // this.dispatcher.registerListener(IN_WEBSOCK_HELLO, async (key, msg) => {
    //   const reply: BaseIncomingMessage = {
    //     name: KEY_ECHO,
    //     data: {
    //       uid: msg.uid,
    //       group: KEY_ECHO
    //     }
    //   }
    //   this.dispatcher.emit(CMD_WEBSOCK_ADD_GROUP, reply);
    // });

    // this.dispatcher.registerListener(INCOMING, async (key: string, msg: BaseIncomingMessage): Promise<void> => {
    //   console.log(msg);
    //   const reply: BaseIncomingMessage = {
    //     name: KEY_ECHO,
    //     group: KEY_ECHO,
    //     data: msg
    //   }
    //   this.dispatcher.emit(epglue(OUT_WEBSOCK_BROADCAST), reply);
    // });
  }

}
