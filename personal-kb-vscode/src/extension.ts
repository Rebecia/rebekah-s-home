import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Card } from './core/types';
import { buildStats, legacyKbPath, loadCards, resolveKbPath } from './core/library';
import { obsidianConnector, obsidianStatusFor } from './core/connectors/obsidian';
import { flomoConnector, notionConnector, siyuanConnector, yinxiangConnector } from './core/connectors/stubs';
import { ensureKbScaffold, writeSampleCard } from './core/sample';
import { AgentInfo, detectAgents, install, uninstall } from './core/agents';
import { migrate, planMigration } from './core/migrate';
import { CardsViewProvider, StatsViewProvider, WallPanel, WallPayload } from './panel';

let cards: Card[] = [];
let statsView: StatsViewProvider;
let cardsView: CardsViewProvider;
let watcher: vscode.FileSystemWatcher | undefined;
let parentWatcher: vscode.FileSystemWatcher | undefined;

function config() {
  return vscode.workspace.getConfiguration('personalKb');
}

function kbRoot(): string {
  return resolveKbPath(config().get<string>('kbPath', ''));
}

function vaultPath(): string {
  return (config().get<string>('obsidianVault', '') || '').trim();
}

function payload(): WallPayload {
  const root = kbRoot();
  return {
    stats: buildStats(cards),
    cards,
    connectors: [
      obsidianStatusFor(root, vaultPath() || undefined),
      flomoConnector.status(),
      siyuanConnector.status(),
      notionConnector.status(),
      yinxiangConnector.status()
    ],
    kbPath: root,
    kbExists: fs.existsSync(root),
    filterType: 'all'
  };
}

function refresh(): void {
  cards = loadCards(kbRoot());
  statsView.refresh();
  cardsView.refresh();
  WallPanel.instance?.refresh();
}

function openCard(cardOrPath: Card | string): void {
  const filePath = typeof cardOrPath === 'string'
    ? (cards.find(c => c.id === cardOrPath || c.relativePath === cardOrPath)?.filePath || path.join(kbRoot(), cardOrPath))
    : cardOrPath.filePath;
  if (!fs.existsSync(filePath)) {
    void vscode.window.showWarningMessage(`找不到卡片文件：${filePath}`);
    return;
  }
  void vscode.window.showTextDocument(vscode.Uri.file(filePath), { preview: true });
}

async function linkObsidian(): Promise<void> {
  let vault = vaultPath();
  if (!vault) {
    const picked = await vscode.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      openLabel: '选择 Obsidian vault 根目录',
      title: '连接到 Obsidian'
    });
    if (!picked?.[0]) {
      return;
    }
    vault = picked[0].fsPath;
    await config().update('obsidianVault', vault, vscode.ConfigurationTarget.Global);
  }
  const result = obsidianConnector.link(kbRoot(), vault);
  if (result.ok) {
    void vscode.window.showInformationMessage(result.detail);
  } else {
    void vscode.window.showErrorMessage(result.detail);
  }
  refresh();
}

async function unlinkObsidian(): Promise<void> {
  const vault = vaultPath();
  if (!vault) {
    void vscode.window.showWarningMessage('还没有设置 Obsidian vault。');
    return;
  }
  const result = obsidianConnector.unlink(kbRoot(), vault);
  if (result.ok) {
    void vscode.window.showInformationMessage(result.detail);
  } else {
    void vscode.window.showErrorMessage(result.detail);
  }
  refresh();
}

async function pickKbFolder(): Promise<void> {
  const picked = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    openLabel: '用这个文件夹作为卡片目录',
    title: '选择卡片目录'
  });
  if (!picked?.[0]) {
    return;
  }
  await config().update('kbPath', picked[0].fsPath, vscode.ConfigurationTarget.Global);
  // 配置变更监听会接着刷新，这里不重复 refresh
}

function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function createSampleCard(): void {
  const root = kbRoot();
  try {
    const file = writeSampleCard(root, todayIso());
    refresh();
    void vscode.window.showInformationMessage(`已创建示例卡片：${file}`);
    void vscode.window.showTextDocument(vscode.Uri.file(file), { preview: true });
  } catch (err) {
    void vscode.window.showErrorMessage(`创建示例卡片失败：${(err as Error).message}`);
  }
}

function agentPickItems(agents: AgentInfo[]): (vscode.QuickPickItem & { agent: AgentInfo })[] {
  return agents.map(agent => ({
    label: agent.label,
    description: agent.state === 'installed' ? '已接入，会覆盖成最新协议' : undefined,
    detail: agent.state === 'foreign' ? `${agent.target} 已有自定义内容，插件不会覆盖` : agent.target,
    picked: agent.state !== 'foreign',
    agent
  }));
}

function reportAgentResults(action: string, details: string[], failed: string[]): void {
  if (failed.length) {
    void vscode.window.showWarningMessage(`${action}：${details.length} 个成功，${failed.length} 个没成。${failed.join('；')}`);
  } else if (details.length) {
    void vscode.window.showInformationMessage(`${action}：${details.join('、')}。去 agent 里说「沉淀本次」试试。`);
  }
}

async function connectAgents(): Promise<void> {
  const agents = detectAgents();
  if (!agents.length) {
    void vscode.window.showWarningMessage(
      '没检测到支持的 AI 助手（Comate / Claude Code / Codex / Cursor）。装好其中一个再运行这条命令。'
    );
    return;
  }
  const picked = await vscode.window.showQuickPick(agentPickItems(agents), {
    canPickMany: true,
    title: '把沉淀能力接入哪些 AI 助手',
    placeHolder: '会往它们的指令文件写一段「怎么沉淀卡片」，随时可以移除'
  });
  if (!picked?.length) {
    return;
  }
  const root = kbRoot();
  ensureKbScaffold(root);
  const ok: string[] = [];
  const bad: string[] = [];
  for (const item of picked) {
    const result = install(item.agent, root);
    (result.ok ? ok : bad).push(result.ok ? result.label : result.detail);
  }
  reportAgentResults('接入完成', ok, bad);
  refresh();
}

async function disconnectAgents(): Promise<void> {
  const installed = detectAgents().filter(a => a.state === 'installed');
  if (!installed.length) {
    void vscode.window.showInformationMessage('当前没有接入任何 AI 助手。');
    return;
  }
  const picked = await vscode.window.showQuickPick(agentPickItems(installed), {
    canPickMany: true,
    title: '移除哪些 AI 助手的沉淀指令',
    placeHolder: '只删插件写进去的那段，你自己写的内容不动'
  });
  if (!picked?.length) {
    return;
  }
  const ok: string[] = [];
  const bad: string[] = [];
  for (const item of picked) {
    const result = uninstall(item.agent);
    (result.ok ? ok : bad).push(result.ok ? result.label : result.detail);
  }
  reportAgentResults('移除完成', ok, bad);
}

async function migrateLegacy(silentWhenNothing = false): Promise<void> {
  const target = kbRoot();
  const plan = planMigration(legacyKbPath(), target);
  if (!plan) {
    if (!silentWhenNothing) {
      void vscode.window.showInformationMessage(`没有需要搬的卡片。当前卡片目录：${target}`);
    }
    return;
  }
  const answer = await vscode.window.showInformationMessage(
    `旧位置还有 ${plan.count} 张卡片（${plan.from}），要复制到 ${plan.to} 吗？原文件保留不动。`,
    '复制过来',
    '以后再说'
  );
  if (answer !== '复制过来') {
    return;
  }
  try {
    const result = migrate(plan.from, plan.to);
    refresh();
    void vscode.window.showInformationMessage(
      `复制了 ${result.copied} 个文件${result.skipped ? `，跳过 ${result.skipped} 个同名的` : ''}。` +
        '确认没问题后可以自己删掉旧目录。连过 Obsidian 的话要重连一次软链。'
    );
  } catch (err) {
    void vscode.window.showErrorMessage(`搬家失败：${(err as Error).message}`);
  }
}

/** 首次激活：建目录、问要不要搬旧卡片、问接入哪些 agent。只问一次。 */
async function bootstrap(context: vscode.ExtensionContext): Promise<void> {
  if (context.globalState.get<boolean>('bootstrapDone')) {
    return;
  }
  await context.globalState.update('bootstrapDone', true);
  try {
    ensureKbScaffold(kbRoot());
  } catch {
    // 建目录失败不该拦住插件启动，视图里的引导块会兜住
  }
  refresh();
  await migrateLegacy(true);
  const agents = detectAgents();
  if (!agents.length) {
    return;
  }
  const go = await vscode.window.showInformationMessage(
    `Personal KB 已就绪，卡片存在 ${kbRoot()}。检测到 ${agents.map(a => a.label).join('、')}，接入后就能在里面说「沉淀本次」自动写卡片。`,
    '接入',
    '暂不'
  );
  if (go === '接入') {
    await connectAgents();
  }
}

function watchKb(context: vscode.ExtensionContext): void {
  watcher?.dispose();
  parentWatcher?.dispose();
  const root = kbRoot();
  const pattern = new vscode.RelativePattern(root, '**/*.md');
  watcher = vscode.workspace.createFileSystemWatcher(pattern);
  watcher.onDidChange(() => refresh());
  watcher.onDidCreate(() => refresh());
  watcher.onDidDelete(() => refresh());
  context.subscriptions.push(watcher);
  // 目录还不存在时，watcher 不会生效；盯住父目录，等它被建出来再重挂
  if (!fs.existsSync(root)) {
    const parent = path.dirname(root);
    if (fs.existsSync(parent)) {
      parentWatcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(parent, path.basename(root))
      );
      parentWatcher.onDidCreate(() => {
        watchKb(context);
        refresh();
      });
      context.subscriptions.push(parentWatcher);
    }
  }
}

export function activate(context: vscode.ExtensionContext): void {
  statsView = new StatsViewProvider(context, payload, () => { void linkObsidian(); });
  cardsView = new CardsViewProvider(context, payload, openCard);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('personalKb.stats', statsView),
    vscode.window.registerWebviewViewProvider('personalKb.cards', cardsView)
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('personalKb.openWall', () => {
      WallPanel.show(context, payload, openCard, () => { void linkObsidian(); });
    }),
    vscode.commands.registerCommand('personalKb.refresh', () => refresh()),
    vscode.commands.registerCommand('personalKb.openCard', (item?: Card | { card?: Card }) => {
      const card = item && 'card' in item && item.card ? item.card : item as Card | undefined;
      if (card) {
        openCard(card);
      }
    }),
    vscode.commands.registerCommand('personalKb.linkObsidian', () => { void linkObsidian(); }),
    vscode.commands.registerCommand('personalKb.unlinkObsidian', () => { void unlinkObsidian(); }),
    vscode.commands.registerCommand('personalKb.pickKbFolder', () => { void pickKbFolder(); }),
    vscode.commands.registerCommand('personalKb.createSampleCard', () => createSampleCard()),
    vscode.commands.registerCommand('personalKb.connectAgents', () => { void connectAgents(); }),
    vscode.commands.registerCommand('personalKb.disconnectAgents', () => { void disconnectAgents(); }),
    vscode.commands.registerCommand('personalKb.migrateLegacy', () => { void migrateLegacy(); }),
    vscode.commands.registerCommand('personalKb.revealKb', () => {
      const root = kbRoot();
      if (!fs.existsSync(root)) {
        void vscode.window.showWarningMessage(`知识库目录不存在：${root}`);
        return;
      }
      void vscode.env.openExternal(vscode.Uri.file(root));
    })
  );
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('personalKb')) {
        watchKb(context);
        refresh();
      }
    })
  );
  watchKb(context);
  refresh();
  void bootstrap(context);
}

export function deactivate(): void {
  watcher?.dispose();
  parentWatcher?.dispose();
}
