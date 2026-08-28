import * as vscode from 'vscode';
import { ConnectorStatus, Stats } from './core/types';

export interface WallPayload {
  stats: Stats;
  cards: unknown[];
  connectors: ConnectorStatus[];
  kbPath: string;
  filterType: string;
}

function nonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function shell(webview: vscode.Webview, context: vscode.ExtensionContext, cssFile: string, jsFile: string, title: string): string {
  const n = nonce();
  const theme = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'theme.css'));
  const css = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', cssFile));
  const js = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', jsFile));
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${n}';">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="${theme}" rel="stylesheet">
<link href="${css}" rel="stylesheet">
<title>${title}</title>
</head>
<body><div id="app"></div><script nonce="${n}" src="${js}"></script></body>
</html>`;
}

export class WallPanel {
  private static current: WallPanel | undefined;

  static show(
    context: vscode.ExtensionContext,
    getPayload: () => WallPayload,
    onOpen: (relativePath: string) => void,
    onLinkObsidian: () => void
  ): WallPanel {
    if (WallPanel.current) {
      WallPanel.current.getPayload = getPayload;
      WallPanel.current.onOpen = onOpen;
      WallPanel.current.onLinkObsidian = onLinkObsidian;
      WallPanel.current.panel.reveal(vscode.ViewColumn.One);
      WallPanel.current.refresh();
      return WallPanel.current;
    }
    const panel = vscode.window.createWebviewPanel('personalKb.wall', 'Personal KB 卡片墙', vscode.ViewColumn.One, {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')]
    });
    WallPanel.current = new WallPanel(panel, context, getPayload, onOpen, onLinkObsidian);
    return WallPanel.current;
  }

  static get instance(): WallPanel | undefined {
    return WallPanel.current;
  }

  private constructor(
    private readonly panel: vscode.WebviewPanel,
    private readonly context: vscode.ExtensionContext,
    private getPayload: () => WallPayload,
    private onOpen: (relativePath: string) => void,
    private onLinkObsidian: () => void
  ) {
    this.panel.webview.html = shell(this.panel.webview, context, 'wall.css', 'wall.js', 'Personal KB');
    this.panel.onDidDispose(() => {
      WallPanel.current = undefined;
    }, null, context.subscriptions);
    this.panel.webview.onDidReceiveMessage(msg => {
      if (msg?.type === 'ready') {
        this.refresh();
      } else if (msg?.type === 'open' && typeof msg.id === 'string') {
        this.onOpen(msg.id);
      } else if (msg?.type === 'linkObsidian') {
        this.onLinkObsidian();
      }
    }, null, context.subscriptions);
  }

  refresh(): void {
    this.panel.webview.postMessage({ type: 'render', payload: this.getPayload() });
  }
}

class WebviewHost implements vscode.WebviewViewProvider {
  protected view?: vscode.WebviewView;
  constructor(
    protected readonly context: vscode.ExtensionContext,
    protected readonly getPayload: () => WallPayload,
    private readonly cssFile: string,
    private readonly jsFile: string,
    private readonly onMessage?: (msg: { type?: string; id?: string }) => void
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'media')]
    };
    webviewView.webview.html = shell(webviewView.webview, this.context, this.cssFile, this.jsFile, 'Personal KB');
    webviewView.webview.onDidReceiveMessage(msg => {
      if (msg?.type === 'ready') {
        this.refresh();
        return;
      }
      this.onMessage?.(msg);
    });
    this.refresh();
  }

  refresh(): void {
    this.view?.webview.postMessage({ type: 'render', payload: this.getPayload() });
  }
}

export class StatsViewProvider extends WebviewHost {
  constructor(context: vscode.ExtensionContext, getPayload: () => WallPayload, onLinkObsidian: () => void) {
    super(context, getPayload, 'stats.css', 'stats.js', msg => {
      if (msg?.type === 'linkObsidian') {
        onLinkObsidian();
      } else if (msg?.type === 'openWall') {
        void vscode.commands.executeCommand('personalKb.openWall');
      }
    });
  }
}

export class CardsViewProvider extends WebviewHost {
  constructor(context: vscode.ExtensionContext, getPayload: () => WallPayload, onOpen: (id: string) => void) {
    super(context, getPayload, 'cards.css', 'cards.js', msg => {
      if (msg?.type === 'open' && typeof msg.id === 'string') {
        onOpen(msg.id);
      }
    });
  }
}
