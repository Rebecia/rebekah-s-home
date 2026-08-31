import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { parseCard, parseTags } from '../core/parse';
import { buildStats, loadCards } from '../core/library';
import { obsidianConnector, isLinkedTo, OBSIDIAN_FOLDER } from '../core/connectors/obsidian';
import { ensureKbScaffold, writeSampleCard } from '../core/sample';
import { agentDefs, install, stateOf, uninstall } from '../core/agents';
import { migrate, planMigration } from '../core/migrate';

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

function fakeHome(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'pkb-home-'));
}

test('ensureKbScaffold 建出六个类型目录和 INDEX，重复调用不覆盖 INDEX', () => {
  const tmp = fakeHome();
  const kb = path.join(tmp, 'Personal-KB');
  ensureKbScaffold(kb);
  for (const dir of ['thinking', 'fundamentals', 'ideas', 'pitfalls', 'life', 'glossary']) {
    assert.ok(fs.statSync(path.join(kb, dir)).isDirectory(), dir);
  }
  const index = path.join(kb, 'INDEX.md');
  fs.writeFileSync(index, '我自己的索引', 'utf8');
  ensureKbScaffold(kb);
  assert.equal(fs.readFileSync(index, 'utf8'), '我自己的索引');
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('接入独占文件的 agent：写出 SKILL.md，可重复执行，移除后收干净', () => {
  const home = fakeHome();
  const kb = path.join(home, 'Personal-KB');
  const comate = agentDefs(home).find(a => a.id === 'comate')!;

  assert.equal(stateOf(comate), 'absent');
  assert.equal(install(comate, kb).ok, true);
  assert.equal(stateOf(comate), 'installed');
  const first = fs.readFileSync(comate.target, 'utf8');
  assert.match(first, /name: personal-kb/);
  assert.ok(first.includes(kb), '协议里要写明卡片目录的绝对路径');

  assert.equal(install(comate, kb).ok, true);
  assert.equal(fs.readFileSync(comate.target, 'utf8'), first, '重复接入结果应完全一致');

  assert.equal(uninstall(comate).ok, true);
  assert.equal(fs.existsSync(comate.target), false);
  assert.equal(fs.existsSync(path.dirname(comate.target)), false, '空的 personal-kb 目录要一起收掉');
  fs.rmSync(home, { recursive: true, force: true });
});

test('用户自己写过同名 SKILL.md 时不覆盖', () => {
  const home = fakeHome();
  const claude = agentDefs(home).find(a => a.id === 'claude')!;
  fs.mkdirSync(path.dirname(claude.target), { recursive: true });
  fs.writeFileSync(claude.target, '# 我自己调过的 Skill\n别动我\n', 'utf8');

  assert.equal(stateOf(claude), 'foreign');
  const result = install(claude, path.join(home, 'Personal-KB'));
  assert.equal(result.ok, false);
  assert.match(fs.readFileSync(claude.target, 'utf8'), /别动我/);
  fs.rmSync(home, { recursive: true, force: true });
});

test('接入共享文件的 agent：只动标记块，用户原有内容一字不改', () => {
  const home = fakeHome();
  const kb = path.join(home, 'Personal-KB');
  const codex = agentDefs(home).find(a => a.id === 'codex')!;
  const mine = '# 我的约定\n\n- 小步提交\n- 不读 .env\n';
  fs.mkdirSync(path.dirname(codex.target), { recursive: true });
  fs.writeFileSync(codex.target, mine, 'utf8');

  assert.equal(install(codex, kb).ok, true);
  const after = fs.readFileSync(codex.target, 'utf8');
  assert.ok(after.startsWith(mine.trimEnd()), '用户内容必须留在最前面且不被改写');
  assert.match(after, /沉淀本次/);

  // 再接入一次不应该叠出第二块
  assert.equal(install(codex, kb).ok, true);
  const twice = fs.readFileSync(codex.target, 'utf8');
  assert.equal(twice.match(/personal-kb:begin/g)?.length, 1);

  assert.equal(uninstall(codex).ok, true);
  assert.equal(fs.readFileSync(codex.target, 'utf8').trim(), mine.trim());
  fs.rmSync(home, { recursive: true, force: true });
});

test('旧卡片搬家：复制不移动，同名不覆盖，新目录已有卡片就不提议', () => {
  const home = fakeHome();
  const legacy = path.join(home, 'legacy');
  const target = path.join(home, 'Personal-KB');
  fs.mkdirSync(path.join(legacy, 'thinking'), { recursive: true });
  const card = path.join(legacy, 'thinking', 'a.md');
  fs.writeFileSync(card, '---\ntitle: 旧卡\ntype: thinking\n---\n\n# 旧卡\n\n## 结论\n\n搬过来。\n', 'utf8');
  fs.writeFileSync(path.join(legacy, 'INDEX.md'), '- [旧卡](thinking/a.md)\n', 'utf8');

  const plan = planMigration(legacy, target);
  assert.ok(plan);
  assert.equal(plan.count, 1);

  const result = migrate(legacy, target);
  assert.equal(result.copied, 2, '卡片和 INDEX 都要带过去');
  assert.ok(fs.existsSync(card), '原文件必须保留');
  assert.equal(loadCards(target).length, 1);

  // 目标已有同名文件：跳过不覆盖
  fs.writeFileSync(path.join(target, 'thinking', 'a.md'), '我后来改过的', 'utf8');
  assert.equal(migrate(legacy, target).skipped, 2);
  assert.equal(fs.readFileSync(path.join(target, 'thinking', 'a.md'), 'utf8'), '我后来改过的');

  assert.equal(planMigration(legacy, target), undefined, '新目录已经有卡片就别再提议');
  assert.equal(planMigration(target, target), undefined, '同一个目录不算搬家');
  fs.rmSync(home, { recursive: true, force: true });
});
