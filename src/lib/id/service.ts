import { Service, Inject } from "typedi";
import { IdGenShowFlake } from './snow_flake';
import { IdGenRoundCounter } from './round_counter';

@Service()
export class IdService {

  @Inject()
  sf: IdGenShowFlake;

  rpcCounter: IdGenRoundCounter = new IdGenRoundCounter();

  eventId(): string {
    return this.sf.take();
  }

  userId(): string {
    return this.sf.take();
  }

  rpcId(): string {
    return this.rpcCounter.take().toString(36);
  }

}
