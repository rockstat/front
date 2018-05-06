import * as StatsdClient from 'statsd-client'
import { Service } from 'typedi';

import { Configurer } from '@app/lib';

interface MetricsCollector {
  tick(metric: string): void;
  timenote(metric: string): () => void;
  time(metric: string, time: number): void;
}

@Service()
export class StatsDMetrics implements MetricsCollector {

  client: StatsdClient;

  constructor(ch: Configurer) {
    const config = ch.get('metrics').statsd;
    if (config) {
      this.client = new StatsdClient(config)
    } else {
      throw new Error('Statsd not configured');
    }
  }

  tick(metric: string) {
    this.client.increment(metric);
  }

  timenote(metric: string): () => void {
    const start = process.hrtime();
    return () => {
      const diff = process.hrtime(start);
      const time = Math.round(diff[0] * 1e3 + diff[1] * 1e-6);
      this.time(metric, time);
    }
  }

  time(metric: string, duration: number): void {
    this.client.timing(metric, duration);
  }

}

