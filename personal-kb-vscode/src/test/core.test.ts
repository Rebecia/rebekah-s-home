import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { parseCard, parseTags } from '../core/parse';
import { buildStats, loadCards } from '../core/library';
import { obsidianConnector, isLinkedTo, OBSIDIAN_FOLDER } from '../core/connectors/obsidian';
import { writeSampleCard } from '../core/sample';

const fixtureRoot = path.resolve(__dirname, '../../fixtures/kb');

test('parseTags 拆 YAML 数组', () => {
  assert.deepEqual(parseTags('[评测, Agent]'), ['评测', 'Agent']);
});

test('parseCard 读出标题、类型、结论', () => {
  const file = path.join(fixtureRoot, 'thinking', 'north-star.md');
  const card = parseCard(fs.readFileSync(file, 'utf8'), file, fixtureRoot);
  assert.ok(card);
  assert.equal(card.title, '测试北极星卡片');
  assert.equal(card.type, 'thinking');
  assert.equal(card.conclusion, '北极星应是用户目标达成。');
  assert.deepEqual(card.tags, ['评测', 'Agent']);
});

test('loadCards 跳过 INDEX，按目录加载全部卡片', () => {
  const cards = loadCards(fixtureRoot);
  assert.equal(cards.length, 3);
  assert.ok(cards.every(c => !c.relativePath.endsWith('INDEX.md')));
});

test('buildStats 统计类型、本周新增、到期易错点', () => {
  const cards = loadCards(fixtureRoot);
  const stats = buildStats(cards, new Date('2026-08-26T10:00:00'));
  assert.equal(stats.total, 3);
  assert.equal(stats.byType.find(x => x.type === 'thinking')?.count, 1);
  assert.equal(stats.byType.find(x => x.type === 'glossary')?.count, 1);
  assert.equal(stats.byType.find(x => x.type === 'pitfall')?.count, 1);
  assert.equal(stats.createdThisWeek, 1);
  assert.equal(stats.duePitfalls, 1);
  assert.equal(stats.tagCount, 5);
});

test('obsidian connector 用软链连接且可安全取消', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pkb-'));
  const kb = path.join(tmp, 'kb');
  const vault = path.join(tmp, 'vault');
  fs.mkdirSync(kb);
  fs.mkdirSync(vault);
  const linked = obsidianConnector.link(kb, vault);
  assert.equal(linked.ok, true);
  assert.equal(isLinkedTo(vault, kb), true);
  const dest = path.join(vault, OBSIDIAN_FOLDER);
  assert.equal(fs.lstatSync(dest).isSymbolicLink(), true);
  const twice = obsidianConnector.link(kb, vault);
  assert.equal(twice.ok, true);
  const removed = obsidianConnector.unlink(kb, vault);
  assert.equal(removed.ok, true);
  assert.equal(fs.existsSync(dest), false);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('vault 里已有同名真实文件夹时不覆盖也不删除', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pkb-occupied-'));
  const kb = path.join(tmp, 'kb');
  const vault = path.join(tmp, 'vault');
  fs.mkdirSync(kb);
  fs.mkdirSync(vault);
  const occupied = path.join(vault, OBSIDIAN_FOLDER);
  fs.mkdirSync(occupied);
  fs.writeFileSync(path.join(occupied, '我的笔记.md'), '别动我', 'utf8');

  assert.equal(obsidianConnector.link(kb, vault).ok, false);
  assert.equal(obsidianConnector.unlink(kb, vault).ok, false);
  assert.equal(fs.readFileSync(path.join(occupied, '我的笔记.md'), 'utf8'), '别动我');
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('示例卡片写出来后能被解析和统计，重复调用不覆盖已改内容', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pkb-sample-'));
  const file = writeSampleCard(tmp, '2026-08-28');
  assert.ok(fs.existsSync(file));

  const cards = loadCards(tmp);
  assert.equal(cards.length, 1);
  assert.equal(cards[0].type, 'thinking');
  assert.ok(cards[0].conclusion.length > 0);
  assert.equal(buildStats(cards, new Date('2026-08-28T10:00:00')).total, 1);

  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('这就是一张卡片', '我改过的标题'), 'utf8');
  writeSampleCard(tmp, '2026-08-28');
  assert.match(fs.readFileSync(file, 'utf8'), /我改过的标题/);
  fs.rmSync(tmp, { recursive: true, force: true });
});
