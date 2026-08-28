import { Card, CARD_TYPES, CardType } from './types';

const TYPE_SET = new Set<string>(CARD_TYPES);

export function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { meta: {}, body: raw };
  }
  const meta: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx <= 0) {
      continue;
    }
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    meta[key] = value;
  }
  return { meta, body: match[2] };
}

export function parseTags(raw: string | undefined): string[] {
  if (!raw) {
    return [];
  }
  const inner = raw.replace(/^\[/, '').replace(/\]$/, '');
  return inner
    .split(',')
    .map(part => part.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

export function parseType(raw: string | undefined, fallbackFile: string): CardType {
  if (raw && TYPE_SET.has(raw)) {
    return raw as CardType;
  }
  const folder = fallbackFile.split(/[\\/]/).slice(-2, -1)[0];
  if (folder === 'ideas') {
    return 'idea';
  }
  if (folder === 'pitfalls') {
    return 'pitfall';
  }
  if (TYPE_SET.has(folder)) {
    return folder as CardType;
  }
  return 'thinking';
}

export function section(body: string, heading: string): string {
  const re = new RegExp(`## ${heading}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`);
  const match = body.match(re);
  return match ? match[1].trim() : '';
}

export function firstLine(text: string): string {
  return text.split(/\r?\n/).map(line => line.trim()).find(Boolean) ?? '';
}

export function parseCard(raw: string, filePath: string, kbRoot: string): Card | null {
  const { meta, body } = parseFrontmatter(raw);
  const titleFromH1 = body.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const title = (meta.title || titleFromH1 || '').trim();
  if (!title) {
    return null;
  }
  const relativePath = filePath.startsWith(kbRoot)
    ? filePath.slice(kbRoot.length).replace(/^[/\\]+/, '').replace(/\\/g, '/')
    : filePath.replace(/\\/g, '/');
  const conclusion = section(body, '结论');
  return {
    id: relativePath,
    title,
    type: parseType(meta.type, filePath),
    tags: parseTags(meta.tags),
    created: meta.created || '',
    source: meta.source || '',
    reviewAfter: meta.review_after || '',
    conclusion: firstLine(conclusion) || firstLine(body.replace(/^#.*$/m, '')),
    why: section(body, '为什么重要'),
    how: section(body, '怎么用'),
    pitfall: section(body, '反例 / 易错点'),
    origin: section(body, '来源') || meta.source || '',
    filePath,
    relativePath
  };
}
