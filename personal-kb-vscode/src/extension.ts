import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Card } from './core/types';
import { buildStats, loadCards, resolveKbPath } from './core/library';
import { obsidianConnector, obsidianStatusFor } from './core/connectors/obsidian';
import { flomoConnector, notionConnector, siyuanConnector, yinxiangConnector } from './core/connectors/stubs';
import { CardsViewProvider, StatsViewProvider, WallPanel, WallPayload } from './panel';

let cards: Card[] = [];
let statsView: StatsViewProvider;
let cardsView: CardsViewProvider;
let watcher: vscode.FileSystemWatcher | undefined;

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

function watchKb(context: vscode.ExtensionContext): void {
  watcher?.dispose();
  const root = kbRoot();
  const pattern = new vscode.RelativePattern(root, '**/*.md');
  watcher = vscode.workspace.createFileSystemWatcher(pattern);
  watcher.onDidChange(() => refresh());
  watcher.onDidCreate(() => refresh());
  watcher.onDidDelete(() => refresh());
  context.subscriptions.push(watcher);
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
  const root = kbRoot();
  if (!fs.existsSync(root)) {
    void vscode.window.showWarningMessage(`Personal KB 未找到卡片目录：${root}`);
  }
}

export function deactivate(): void {
  watcher?.dispose();
}
