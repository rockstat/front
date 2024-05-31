// import { Service, Inject, Container } from 'typedi';
import {
  BusMsgHdr,
  FrontierConfig,
  IncomingMessage,
  BaseIncomingMessage,
  MsgBusConfig,
  Dictionary,
  ServiceStatusStructRegisterItem,
  BaseIncomingMessageWithBatch,
  ServiceStatusStructData,
} from '@app/types';
import {
  TreeBus,
  TreeNameBus
} from '@app/bus';
import {
  IN_GENERIC,
  BROADCAST,
  ENRICH,
} from '@app/constants';
import {
  AppConfig,
  TheIds,
  Logger,
  // AppStatus,
  RedisFactory,
  Meter,
  RPCAdapterRedis,
  RPCAgnostic,
  AgnosticRPCOptions,
  MethodRegRequest,
  EnrichersRequirements,
  METHOD_STATUS,
  STATUS_INT_ERROR,
  STATUS_OK,
  BandResponse,
  UnknownResponse,
  response,
  MethodRegistrationOptions,
  METHOD_IAMALIVE
} from '@rockstat/rock-me-ts';
import * as EnrichersRepo from '@app/enrichers';
import * as HandlersRepo from '@app/handlers';
import * as TransformersRepo from '@app/transformers';
import {
  dotPropGetter,
  getvals
} from '@app/helpers/getprop';

import { getAppDeps } from '@rockstat/rock-me-ts';

type TransformerRepo = typeof TransformersRepo;
type TransformersNames = keyof TransformerRepo;
type EnricherRepo = typeof EnrichersRepo
type EnrichersNames = keyof EnricherRepo;
type HandlerRepo = typeof HandlersRepo;
type HandlersNames = keyof HandlerRepo;

const HANDLER = 'handler';
const ENRICHER = 'enricher';


// @Service()
export class Dispatcher {

  log: Logger;
  transformBus: TreeBus = new TreeBus('transformers');
  enrichBus: TreeBus = new TreeBus('enrichers');
  remoteEnrichers: TreeNameBus = new TreeNameBus()
  listenBus: TreeBus = new TreeBus('listeners');
  handleBus: TreeBus = new TreeBus('handlers');
  appConfig: AppConfig<FrontierConfig>;
  idGen: TheIds;
  // status: AppStatus;
  registrationsHash: string = '';
  rpc: RPCAgnostic;
  rpcHandlers: { [k: string]: [string, string, MethodRegistrationOptions] } = {};
  rpcEnrichers: { [k: string]: Array<string> } = {};
  propGetters: { [k: string]: (obj: any) => { [k: string]: any } } = {};
  enrichersRequirements: EnrichersRequirements = [];
  regs: Map<string, Array<ServiceStatusStructRegisterItem>>;
  regsTimers: Map<string, NodeJS.Timer>;

  constructor() {
    
    // this.log = Container.get(Logger).for(this);
    this.log = getAppDeps().getDep('log').for(this);
    // this.status = new AppStatus();
    this.log.info('Starting');
    // this.appConfig = Container.get<AppConfig<FrontierConfig>>(AppConfig);
    this.appConfig = getAppDeps().getDep('config');
    // this.idGen = Container.get(TheIds);
    this.idGen = getAppDeps().getDep('ids');
    this.regs = new Map();
    this.regsTimers = new Map();
  }

  /**
   * Initial asynchronous setup
   */
  setup() {
    this.handleBus.subscribe('*', this.defaultHandler);
    this.transformBus.subscribe('*', this.defaultTransformer);

    // Core deps
    const redisFactory = getAppDeps().getDep('redis');
    // Stat meter
    const meter = getAppDeps().getDep('meter');

    // Setup RPC
    const channels = [this.appConfig.rpc.name];
    const rpcOptions: AgnosticRPCOptions = { channels, redisFactory, log: this.log, meter, ...this.appConfig.rpc }
    const rpcAdaptor = new RPCAdapterRedis(rpcOptions);

    this.rpc = new RPCAgnostic(rpcOptions);
    this.rpc.setup(rpcAdaptor);

    // status notification for band director
    // setInterval(() => {
    //   this.rpc.notify(SERVICE_DIRECTOR, RPC_IAMALIVE, { name: SERVICE_FRONTIER })
    // }, 5 * 1000)
    // Registering status handler / payload receiver

    const regFunc = async () => {
      // if (data.register && data.state_hash) {
      // if (data.state_hash == this.registrationsHash) {
      // Skip handling. Nothing changed
      // return;
      // }
      const handlerRoutingKeys: string[] = [];
      const enrichersRequirements: EnrichersRequirements = [];
      for (let [service, reg] of this.regs) {
        if (reg && Array.isArray(reg) && reg.length) {
          for (let item of reg) {
            let { method, role, options } = item;
            const route = { service, method };

            if (options && options.alias) {
              route.service = options.alias;
            }
            const routingPath = [IN_GENERIC, route.service].concat([route.method].filter(e => e !== '*'))
            const routingKey = routingPath.join('.');
            if (role === HANDLER) {
              this.rpcHandlers[routingKey] = [service, method, options];
              handlerRoutingKeys.push(routingKey);
            }
            if (role === ENRICHER && options && Array.isArray(options.keys)) {
              this.propGetters[route.service] = dotPropGetter(options.props || {});
              // Handling enrichments data selection
              let opts = options.props;
              if (opts && typeof opts === "object" && !Array.isArray(opts)) {
                for (const [k, v] of Object.entries(opts)) {
                  enrichersRequirements.push([k, v]);
                }
              }
              this.remoteEnrichers.subscribe(options.keys, route.service)
            }

          }
        }
      }

      // for (const row of data.register) {
      //   const { service, method, options } = row;
      //   const route = { service, method };
      //   if (options && options.alias) {
      //     route.service = options.alias;
      //   }
      //   const routingPath = [IN_GENERIC, route.service].concat([route.method].filter(e => e !== '*'))
      //   const routingKey = routingPath.join('.');
      //   if (row.role === HANDLER) {
      //     this.rpcHandlers[routingKey] = [service, method, options];
      //     handlerRoutingKeys.push(routingKey);
      //   }
      //   if (row.role === ENRICHER && options && Array.isArray(options.keys)) {
      //     this.propGetters[route.service] = dotPropGetter(options.props || {});
      //     // Handling enrichments data selection
      //     let opts = options.props;
      //     if (opts && typeof opts === "object" && Array.isArray(opts)) {
      //       for (const [k, v] of Object.entries(opts)) {
      //         enrichersRequirements.push([k, v]);
      //       }
      //     }
      //     this.remoteEnrichers.subscribe(options.keys, route.service)
      //   }
      // }
      // this.registrationsHash = data.state_hash;
      // TODO: split by services (when enrichers will be splitted)
      this.enrichersRequirements = enrichersRequirements;
      // Registering/unregistering remote handlers
      this.handleBus.replace(handlerRoutingKeys, this.handlersGateway)
      // }
      // return this.status.get({});
    }

    // this.rpc.register<MethodRegRequest>(METHOD_STATUS, regFunc);

    this.rpc.register<{}>(METHOD_IAMALIVE, async (data: Dictionary<any>) => {
      // console.log('data', data)
      // return this.rpcHandlers;
      if (data.name) {
        let service_status: ServiceStatusStructData = await this.rpc.request<ServiceStatusStructData>(data.name, METHOD_STATUS, {});
        // console.log('service_status', service_status)
        if (service_status && typeof service_status === "object" && !Array.isArray(service_status)) {
          // if ('type__' in service_status && 'data' in service_status) {
          // let service_data = service_status['data']
          // console.log('service_data', service_data)
          // todo: needed type with optional headers and statusCode
          // data.headers = data.headers || [];
          // data.statusCode = data.statusCode || STATUS_OK;
          // return data;

          this.regs.set(service_status.name, service_status.register)

          let int = this.regsTimers.get(service_status.name)
          if (int) {
            clearTimeout(int);
          }
          this.regsTimers.set(service_status.name, setTimeout(() => {
            this.regs.delete(service_status.name);
            this.regsTimers.delete(service_status.name);
            // console.log('removing service', service_status.name)
            regFunc();
          }, 15000));
          // }
        }
      }
    });

    setInterval(() => {
      regFunc()
    }, 5000)


    // if (service_data && typeof service_data === "object" && !Array.isArray(service_data)) {
    //   let register = service_data['register']
    //   if (register && typeof register === "object" && Array.isArray(register)) {
    //     for (let enr of register){
    //       console.log('enr', enr)
    //     }
    //   }
    // }

    this.rpc.register<{}>('enrichers', async () => {
      return this.rpcEnrichers;
    })


    // Attaching transformers
    // const transformersConfig: {
    //   [k in TransformersNames]?: MsgBusConfig['transformers'][k]
    // } = this.appConfig.get('bus').transformers;


    // Object.entries(transformersConfig)
    //   .filter(([name, chan]) => chan && (name in TransformersRepo))
    //   .forEach(([name, chan]: [TransformersNames, string]) => {
    //     const transformer = new TransformersRepo[name]();
    //     this.transformBus.subscribe(chan, transformer.handle);
    //     // chans.forEach(chan => this.transformBus.subscribe(chan, transformer.handle));
    //   })

    // Attaching internal transformers
    const transformersConfig: {
      [k in TransformersNames]?: MsgBusConfig['transformers'][k]
    } = this.appConfig.get('bus').transformers;

    Object.entries(transformersConfig)
      .filter(([name, chans]) => chans && (name in TransformersRepo))
      .forEach(([name, chans]: [TransformersNames, Array<string>]) => {
        const transformer = new TransformersRepo[name]();
        chans.forEach(chan => this.transformBus.subscribe(chan, transformer.handle));
      })

    // Attaching internal enrichers
    const enrichersConfig: {
      [k in EnrichersNames]?: MsgBusConfig['enrichers'][k]
    } = this.appConfig.get('bus').enrichers;

    Object.entries(enrichersConfig)
      .filter(([name, chans]) => chans && (name in EnrichersRepo))
      .forEach(([name, chans]: [EnrichersNames, Array<string>]) => {
        const enricher = new EnrichersRepo[name]();
        chans.forEach(chan => this.enrichBus.subscribe(chan, enricher.handle));
      })

    // Registering remote enrichers notification
    this.enrichBus.subscribe('*', this.enrichersGateway);


    // Attaching internal handlers
    const handlersConfig: {
      [k in HandlersNames]?: MsgBusConfig['handlers'][k]
    } = this.appConfig.get('bus').handlers;

    Object.entries(handlersConfig)
      .filter(([name, chan]) => chan && (name in HandlersRepo))
      .forEach(([name, chan]: [HandlersNames, string]) => {
        this.handleBus.subscribe(chan, HandlersRepo[name]());
      })

    // Remote listeners gateway
    this.listenBus.subscribe('*', this.listenersGateway);

  }

  start() {
    this.log.info('Started');
  }


  listenersGateway = async (key: string, msg: IncomingMessage) => {
    try {
      return await this.rpc.notify(BROADCAST, BROADCAST, msg);
    } catch (error) {
      this.log.error(`catch! ${error.message}`);
    }
  }

  enrichersGateway = async (key: string, msg: IncomingMessage) => {
    try {
      const smallMsg = getvals(msg, this.enrichersRequirements);
      return await this.rpc.request(ENRICH, ENRICH, smallMsg, { services: this.remoteEnrichers.simulate(key) });
    } catch (error) {
      this.log.error(`catch! ${error.message}`);
    }
  }


  /**
   * Using to handle event remotely
   */
  handlersGateway = async (key: string, msg: BaseIncomingMessage): Promise<BandResponse> => {
    if (msg.service && msg.name && this.rpcHandlers[key]) {
      // Real destination
      const [service, method, options] = this.rpcHandlers[key];
      try {
        const data: UnknownResponse = await this.rpc.request<any>(service, method, msg, { timeout: options.timeout });
        // todo: check via isBandResponse
        if (data && typeof data === "object" && !Array.isArray(data)) {
          if ('type__' in data) {
            // todo: needed type with optional headers and statusCode
            data.headers = data.headers || [];
            data.statusCode = data.statusCode || STATUS_OK;
            return data;
          }
        }
        return response.data({ data });
      } catch (error) {
        this.log.warn(error, { error, key, msg });
        return response.error({ statusCode: STATUS_INT_ERROR, errorMessage: error.message })
      }
    }
    return this.defaultHandler(key, msg);
  }

  defaultHandler: BusMsgHdr = async (key, msg): Promise<BandResponse> => {
    // return Promise.resolve().then(() =>
    // )
    return response.data({
      data: {
        key: key,
        id: msg.id
      }
    })
  }
  defaultTransformer: BusMsgHdr = async (key, msg): Promise<BaseIncomingMessageWithBatch> => {
    // return Promise.resolve().then(() => msg)
    return [msg, []];
  }
  registerListener(key: string, func: BusMsgHdr): void {
    this.log.info(`Registering subscriber for ${key}`);
    this.listenBus.subscribe(key, func);
  }

  async dispatch(key: string, orig_msg: BaseIncomingMessage): Promise<BandResponse> {

    // if (msg.key === 'in.gen.track.registration_success') {
    //   this.log.info({msg_data: msg}, '__registration_success_v2__');
    // }

    // ### Phase 1: enriching
    // const transformer = this.transformBus.publish(key, msg);
    orig_msg.id = this.idGen.flake();
    orig_msg.time = Number(new Date());

    const transformer = this.transformBus.handler(key, orig_msg);
    const [msg, msgs]: BaseIncomingMessageWithBatch = await transformer;

    // console.log('msg', msg);

    for (let m of msgs) {
      m.id = this.idGen.flake();
      // m.time = msg.time;
      // console.log(m)
    }



    this.log.debug(` ---> ${key} [${msg.id}]`);

    // console.log('transformed', msg);

    const enrichers = this.enrichBus.publish(key, msg);
    const enrichments = await Promise.all(enrichers);


    // console.log('enrichments', enrichments);

    if (enrichments.length && msg.data) {
      Object.assign(msg.data, ...enrichments);
      for (let submsg of msgs) {
        Object.assign(submsg, ...enrichments)
      }
    }

    // ### Phase 2: handling if configuring
    const handler = this.handleBus.handler(key, msg);
    this.log.debug(` <--- ${key}`, msg);
    const handled = await handler;

    // ### Phase 3: send to listeners
    // Scheduling using Promise to avoid waiting
    Promise.all(this.listenBus.publish(key, msg))
      .then(() => this.log.debug('Listeners handled'))
      .catch(error => this.log.error(error));

    Promise.all(msgs.map((submsg) => this.listenBus.publish(submsg.key, submsg)))

    return handled;
  }
}
