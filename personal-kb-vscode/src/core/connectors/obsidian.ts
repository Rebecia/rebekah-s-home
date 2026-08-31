import * as fs from 'fs';
import * as path from 'path';
import { Connector, LinkResult } from './types';
import { ConnectorStatus } from '../types';

export const OBSIDIAN_FOLDER = 'Personal-KB';

export function vaultLinkPath(vaultRoot: string): string {
  return path.join(vaultRoot, OBSIDIAN_FOLDER);
}

export function isLinkedTo(vaultRoot: string, kbRoot: string): boolean {
  const dest = vaultLinkPath(vaultRoot);
  try {
    const stat = fs.lstatSync(dest);
    if (stat.isSymbolicLink()) {
      return path.resolve(fs.readlinkSync(dest)) === path.resolve(kbRoot);
    }
    return false;
  } catch {
    return false;
  }
}

export const obsidianConnector: Connector = {
  id: 'obsidian',
  name: 'Obsidian',
  status(target?: string): ConnectorStatus {
    if (!target) {
      return { id: 'obsidian', name: 'Obsidian', configured: false, linked: false, detail: '未设置 vault 路径' };
    }
    if (!fs.existsSync(target)) {
      return { id: 'obsidian', name: 'Obsidian', configured: true, linked: false, target, detail: 'vault 目录不存在' };
    }
    const dest = vaultLinkPath(target);
    let linked = false;
    try {
      linked = fs.lstatSync(dest).isSymbolicLink();
    } catch {
      linked = false;
    }
    return {
      id: 'obsidian',
      name: 'Obsidian',
      configured: true,
      linked,
      target,
      detail: linked ? `已连接：${dest}` : `vault 已设置，尚未创建 ${OBSIDIAN_FOLDER} 软链`
    };
  },
  link(kbRoot: string, vaultRoot: string): LinkResult {
    if (!fs.existsSync(kbRoot)) {
      return { ok: false, detail: `知识库目录不存在：${kbRoot}` };
    }
    if (!fs.existsSync(vaultRoot)) {
      return { ok: false, detail: `Obsidian vault 不存在：${vaultRoot}` };
    }
    const dest = vaultLinkPath(vaultRoot);
    try {
      const stat = fs.lstatSync(dest);
      if (stat.isSymbolicLink() && path.resolve(fs.readlinkSync(dest)) === path.resolve(kbRoot)) {
        return { ok: true, target: dest, detail: `已连接到 ${dest}` };
      }
      return { ok: false, detail: `${dest} 已存在且不是指向当前知识库的软链，未覆盖。` };
    } catch {
      // dest does not exist
    }
    try {
      fs.symlinkSync(path.resolve(kbRoot), dest, 'dir');
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      // Windows 上建目录软链需要开发者模式或管理员权限，否则 EPERM
      const hint = code === 'EPERM' || code === 'EACCES'
        ? '创建软链被系统拒绝。Windows 需要开启「开发者模式」或以管理员身份运行；也可以手动把 vault 里的文件夹指向卡片目录。'
        : `创建软链失败：${(err as Error).message}`;
      return { ok: false, detail: hint };
    }
    return { ok: true, target: dest, detail: `已在 vault 中创建软链 ${dest} → ${kbRoot}` };
  },
  unlink(_kbRoot: string, vaultRoot: string): LinkResult {
    const dest = vaultLinkPath(vaultRoot);
    try {
      const stat = fs.lstatSync(dest);
      if (!stat.isSymbolicLink()) {
        return { ok: false, detail: `${dest} 不是软链，未删除，以免误伤 vault 里的真实文件夹。` };
      }
    } catch {
      return { ok: false, detail: `${dest} 不存在` };
    }
    try {
      fs.unlinkSync(dest);
    } catch (err) {
      return { ok: false, detail: `删除软链失败：${(err as Error).message}` };
    }
    return { ok: true, target: dest, detail: `已移除软链 ${dest}` };
  }
};

export function obsidianStatusFor(kbRoot: string, vaultRoot?: string): ConnectorStatus {
  if (!vaultRoot) {
    return obsidianConnector.status();
  }
  const dest = vaultLinkPath(vaultRoot);
  const vaultExists = fs.existsSync(vaultRoot);
  const linked = vaultExists && isLinkedTo(vaultRoot, kbRoot);
  return {
    id: 'obsidian',
    name: 'Obsidian',
    configured: Boolean(vaultRoot),
    linked,
    target: vaultRoot,
    detail: !vaultExists
      ? 'vault 目录不存在'
      : linked
        ? `已连接：${dest}`
        : `vault 已设置，尚未创建 ${OBSIDIAN_FOLDER}`
  };
}
