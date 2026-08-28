import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseCard } from './parse';
import { Card, CARD_TYPES, CardType, Stats, TypeCount } from './types';

const SKIP = new Set(['INDEX.md']);

export function defaultKbPath(): string {
  return path.join(os.homedir(), '.comate', 'skills', 'personal-kb', 'kb');
}

export function resolveKbPath(configured?: string): string {
  const raw = (configured || '').trim();
  if (!raw) {
    return defaultKbPath();
  }
  if (raw.startsWith('~')) {
    return path.join(os.homedir(), raw.slice(1));
  }
  return path.resolve(raw);
}

export function listMarkdownFiles(root: string): string[] {
  if (!fs.existsSync(root)) {
    return [];
  }
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) {
        continue;
      }
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith('.md') && !SKIP.has(entry.name)) {
        out.push(full);
      }
    }
  };
  walk(root);
  return out.sort();
}

export function loadCards(kbRoot: string): Card[] {
  const root = path.resolve(kbRoot);
  const cards: Card[] = [];
  for (const file of listMarkdownFiles(root)) {
    const raw = fs.readFileSync(file, 'utf8');
    const card = parseCard(raw, file, root);
    if (card) {
      cards.push(card);
    }
  }
  cards.sort((a, b) => (b.created || '').localeCompare(a.created || '') || a.title.localeCompare(b.title, 'zh'));
  return cards;
}

function startOfWeek(now: Date): Date {
  const d = new Date(now);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - diff);
  return d;
}

function toDate(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return null;
  }
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function buildStats(cards: Card[], now = new Date()): Stats {
  const counts = new Map<CardType, number>();
  for (const type of CARD_TYPES) {
    counts.set(type, 0);
  }
  const tags = new Set<string>();
  const weekStart = startOfWeek(now);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  let createdThisWeek = 0;
  let duePitfalls = 0;
  for (const card of cards) {
    counts.set(card.type, (counts.get(card.type) || 0) + 1);
    card.tags.forEach(tag => tags.add(tag));
    const created = toDate(card.created);
    if (created && created >= weekStart) {
      createdThisWeek += 1;
    }
    if (card.type === 'pitfall' && card.reviewAfter) {
      const due = toDate(card.reviewAfter);
      if (due && due <= today) {
        duePitfalls += 1;
      }
    }
  }
  const byType: TypeCount[] = CARD_TYPES.map(type => ({ type, count: counts.get(type) || 0 }));
  return {
    total: cards.length,
    byType,
    createdThisWeek,
    duePitfalls,
    tagCount: tags.size
  };
}

export function uniqueTags(cards: Card[]): string[] {
  const tags = new Set<string>();
  cards.forEach(card => card.tags.forEach(tag => tags.add(tag)));
  return [...tags].sort((a, b) => a.localeCompare(b, 'zh'));
}
