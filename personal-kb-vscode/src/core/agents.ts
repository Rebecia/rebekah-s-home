import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  GENERATED_MARK,
  MARK_BEGIN,
  cursorRule,
  markedBlock,
  removeBlock,
  skillFile,
  upsertBlock
} from './protocol';

export type AgentId = 'comate' | 'claude' | 'codex' | 'cursor';

/** own：整个文件归插件管；shared：文件是用户的，只能插一段带标记的块。 */
type WriteMode = 'own' | 'shared';

export interface AgentDef {
  id: AgentId;
  label: string;
  /** 存在即认为装了这个 agent */
  home: string;
  target: string;
  mode: WriteMode;
  render(kbRoot: string): string;
}

export type AgentState = 'absent' | 'installed' | 'foreign';

export interface AgentInfo extends AgentDef {
  state: AgentState;
}

export interface AgentResult {
  id: AgentId;
  label: string;
  ok: boolean;
  detail: string;
}

export function agentDefs(home = os.homedir()): AgentDef[] {
  return [
    {
      id: 'comate',
      label: 'Comate',
      home: path.join(home, '.comate'),
      target: path.join(home, '.comate', 'skills', 'personal-kb', 'SKILL.md'),
      mode: 'own',
      render: skillFile
    },
    {
      id: 'claude',
      label: 'Claude Code',
      home: path.join(home, '.claude'),
      target: path.join(home, '.claude', 'skills', 'personal-kb', 'SKILL.md'),
      mode: 'own',
      render: skillFile
    },
    {
      id: 'codex',
      label: 'Codex',
      home: path.join(home, '.codex'),
      target: path.join(home, '.codex', 'AGENTS.md'),
      mode: 'shared',
      render: markedBlock
    },
    {
      id: 'cursor',
      label: 'Cursor',
      home: path.join(home, '.cursor'),
      target: path.join(home, '.cursor', 'rules', 'personal-kb.mdc'),
      mode: 'own',
      render: cursorRule
    }
  ];
}

function read(file: string): string | undefined {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return undefined;
  }
}

export function stateOf(def: AgentDef): AgentState {
  const existing = read(def.target);
  if (existing === undefined) {
    return 'absent';
  }
  const mine = def.mode === 'own' ? GENERATED_MARK : MARK_BEGIN;
  if (existing.includes(mine)) {
    return 'installed';
  }
  // own 模式下有个同名文件但不是我们写的：可能是用户自己的 Skill，不能碰
  return def.mode === 'own' ? 'foreign' : 'absent';
}

/** 只返回本机真的装了的 agent。没装的不创建目录。 */
export function detectAgents(home = os.homedir()): AgentInfo[] {
  return agentDefs(home)
    .filter(def => fs.existsSync(def.home))
    .map(def => ({ ...def, state: stateOf(def) }));
}

export function install(def: AgentDef, kbRoot: string): AgentResult {
  const state = stateOf(def);
  if (state === 'foreign') {
    return {
      id: def.id,
      label: def.label,
      ok: false,
      detail: `${def.label}：${def.target} 已经存在且不是插件生成的，没有覆盖。要接入就先自己备份或删掉它。`
    };
  }
  try {
    fs.mkdirSync(path.dirname(def.target), { recursive: true });
    const body = def.render(kbRoot);
    if (def.mode === 'own') {
      fs.writeFileSync(def.target, body, 'utf8');
    } else {
      fs.writeFileSync(def.target, upsertBlock(read(def.target) || '', body), 'utf8');
    }
    return { id: def.id, label: def.label, ok: true, detail: `${def.label} 已接入` };
  } catch (err) {
    return {
      id: def.id,
      label: def.label,
      ok: false,
      detail: `${def.label}：写入 ${def.target} 失败 —— ${(err as Error).message}`
    };
  }
}

export function uninstall(def: AgentDef): AgentResult {
  const state = stateOf(def);
  if (state !== 'installed') {
    return { id: def.id, label: def.label, ok: true, detail: `${def.label} 本来就没接入` };
  }
  try {
    if (def.mode === 'own') {
      fs.rmSync(def.target);
      // skills/personal-kb/ 这层如果空了就一起收掉，别留空壳
      const dir = path.dirname(def.target);
      if (fs.readdirSync(dir).length === 0) {
        fs.rmdirSync(dir);
      }
    } else {
      const left = removeBlock(read(def.target) || '');
      if (left) {
        fs.writeFileSync(def.target, left, 'utf8');
      } else {
        fs.rmSync(def.target);
      }
    }
    return { id: def.id, label: def.label, ok: true, detail: `${def.label} 已移除` };
  } catch (err) {
    return {
      id: def.id,
      label: def.label,
      ok: false,
      detail: `${def.label}：清理 ${def.target} 失败 —— ${(err as Error).message}`
    };
  }
}
