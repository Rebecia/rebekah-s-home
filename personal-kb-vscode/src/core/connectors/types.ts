import { ConnectorStatus } from '../types';

export interface LinkResult {
  ok: boolean;
  target?: string;
  detail: string;
}

export interface Connector {
  id: string;
  name: string;
  status(target?: string): ConnectorStatus;
  link(kbRoot: string, target: string): LinkResult;
  unlink(kbRoot: string, target: string): LinkResult;
}
