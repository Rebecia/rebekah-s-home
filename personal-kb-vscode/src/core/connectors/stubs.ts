import { Connector, LinkResult } from './types';
import { ConnectorStatus } from '../types';

/** 接口预留：一期不实现真实同步。 */
function stub(id: string, name: string): Connector {
  return {
    id,
    name,
    status(target?: string): ConnectorStatus {
      return {
        id,
        name,
        configured: Boolean(target),
        linked: false,
        target,
        detail: '一期未实现，接口已预留。源文件仍以本地 kb/*.md 为准。'
      };
    },
    link(): LinkResult {
      return { ok: false, detail: `${name} 一期未实现。请继续用本地 Markdown，或先连接 Obsidian。` };
    },
    unlink(): LinkResult {
      return { ok: false, detail: `${name} 一期未实现。` };
    }
  };
}

export const flomoConnector = stub('flomo', 'flomo');
export const siyuanConnector = stub('siyuan', '思源笔记');
export const notionConnector = stub('notion', 'Notion');
export const yinxiangConnector = stub('yinxiang', '印象笔记');
