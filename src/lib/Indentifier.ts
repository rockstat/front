import { Service, Inject } from "typedi";
import { IdGenShowFlake } from "@app/lib";

@Service()
export class Indentifier {

  @Inject()
  generator: IdGenShowFlake;

  eventId(): string {
    return this.generator.take();
  }

  userId(): string {
    return this.generator.take();
  }

}
