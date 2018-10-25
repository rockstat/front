export { HTTPHeaders, HTTPHeader } from '@rockstat/rock-me-ts';
import { HTTPTransportData } from './msg';

export type HTTPBodyParams = { [key: string]: any }

// === Rounting based on
export interface RouteOn {
  method: string;
  contentType: string;
  query: { [key: string]: any };
  cookie: { [key: string]: any };
  body: { [key: string]: any };
  path: string;
  origin: string;
  uid: string;
  service: string;
  name: string;
  projectId?: number;
  td: HTTPTransportData
}

