import * as fs from 'fs';
import * as path from 'path';
import { listMarkdownFiles } from './library';

export interface MigrationPlan {
  from: string;
  to: string;
  count: number;
}

/** 旧目录有卡片、新目录还没有，才提议搬家。 */
export function planMigration(legacy: string, target: string): MigrationPlan | undefined {
  if (path.resolve(legacy) === path.resolve(target)) {
    return undefined;
  }
  const old = listMarkdownFiles(legacy);
  if (old.length === 0) {
    return undefined;
  }
  if (listMarkdownFiles(target).length > 0) {
    return undefined;
  }
  return { from: legacy, to: target, count: old.length };
}

export interface MigrationResult {
  copied: number;
  skipped: number;
}

/** 复制而不是移动：旧的一份留在原地，用户自己确认没问题再删。同名文件不覆盖。 */
export function migrate(legacy: string, target: string): MigrationResult {
  const root = path.resolve(legacy);
  let copied = 0;
  let skipped = 0;
  const files = listMarkdownFiles(root);
  const index = path.join(root, 'INDEX.md');
  if (fs.existsSync(index)) {
    files.push(index);
  }
  for (const file of files) {
    const dest = path.join(target, path.relative(root, file));
    if (fs.existsSync(dest)) {
      skipped += 1;
      continue;
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(file, dest);
    copied += 1;
  }
  return { copied, skipped };
}
