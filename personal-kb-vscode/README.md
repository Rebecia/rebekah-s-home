<div align="center">

# Personal KB 卡片墙

**和 AI 干完一件事，说一句「沉淀本次」，结论就变成一张知识卡片。**

[![Marketplace](https://img.shields.io/visual-studio-marketplace/v/Rebekah.personal-kb?label=VS%20Code%20Marketplace&color=15171b)](https://marketplace.visualstudio.com/items?itemName=Rebekah.personal-kb)

[装到 VS Code](https://marketplace.visualstudio.com/items?itemName=Rebekah.personal-kb) · [打开在线 demo](https://rebecia.github.io/rebekah-s-home/personal-kb-vscode/docs/demo/) · [使用手册](./docs/USAGE.md) · [返回作品集](../README.md)

</div>

![卡片墙](https://raw.githubusercontent.com/Rebecia/rebekah-s-home/main/personal-kb-vscode/media/screenshots/wall.png)

## 怎么用

### 1. 接入你的 AI 助手

装完插件会弹一次，列出本机检测到的助手让你勾（默认全勾）。也可以随时用命令面板搜
`Personal KB: 接入 AI 助手`。

支持 **Comate**、**Claude Code**、**Codex**、**Cursor**。接入做的事是往它们各自的指令文件写一段
「什么时候沉淀、卡片写到哪、什么格式」：

- Comate / Claude Code → `~/.comate/skills/personal-kb/SKILL.md`、`~/.claude/skills/personal-kb/SKILL.md`
- Codex → 在 `~/.codex/AGENTS.md` 里插一段带 `<!-- personal-kb:begin -->` 标记的块
- Cursor → `~/.cursor/rules/personal-kb.mdc`

没装的助手不会被创建目录。已经有同名文件而且不是插件写的，会跳过并告诉你，不覆盖。
不想要了就搜 `Personal KB: 移除 AI 助手的沉淀指令`，只删标记内那段，你自己写的内容不动。

### 2. 说一句话

聊完一件事，说「沉淀本次」。助手会先把 1–3 张候选卡片报给你——标题、类型、一句话结论
——**你点头它才写文件**。

不用记固定咒语，**按意图识别**：「记一下这个」「存成卡片」「这条值得留」「以后还会用到」
「save this」都算。任务收尾时如果本轮有值得留的东西，助手也会主动问你要不要沉淀。

卡片落在 `~/Personal-KB/`，按类型分六个目录。插件监听这个目录，文件一写出来卡片墙就刷新。

### 3. 看卡片

命令面板搜 `Personal KB: 打开卡片墙`，所有卡片摊在一个网格里。顶栏按类型筛，右上角搜标题、
结论和标签。点一张看全文，再点一下跳到 md 原文接着写。

不接入助手也能用——卡片自己手写就行，格式见下。想换存放位置，点侧栏的「选择卡片目录」。

## 主要界面

### 卡片墙：先看结论

bento 网格，最新一张放大成主卡并多显示一段「为什么重要」。顶栏按类型筛选，右上角搜标题、结论、标签。

![卡片墙](https://raw.githubusercontent.com/Rebecia/rebekah-s-home/main/personal-kb-vscode/media/screenshots/wall.png)

### 卡片详情：读完整四段

点任意卡片弹出详情：结论 / 为什么重要 / 怎么用 / 反例。可以跳去 Markdown 原文继续编辑。

![卡片详情](https://raw.githubusercontent.com/Rebecia/rebekah-s-home/main/personal-kb-vscode/media/screenshots/detail.png)

### 侧栏统计：知道攒了多少

已沉淀 / 本周新写 / 待复习三个数，分类分布环形饼图，以及 Obsidian 连接状态。

![侧栏统计](https://raw.githubusercontent.com/Rebecia/rebekah-s-home/main/personal-kb-vscode/media/screenshots/sidebar.png)

图是脚本拍的，改完界面重跑就同步（无头 Chrome，不占屏幕）：

```bash
npm run demo && npm run shots
```

## 如何体验

不装插件也能点：[在线 demo](https://rebecia.github.io/rebekah-s-home/personal-kb-vscode/docs/demo/)——筛选、搜索、点开卡片、点标签都能用，数据是示例卡，不是任何人的真实知识库。

本地预览同一份页面：

```bash
npm run serve      # http://localhost:8080
```

或者直接双击 `docs/demo/index.html`——单文件、离线、用的是插件里同一份 CSS。

## 安装

在 VS Code 里搜 `Personal KB 卡片墙`，或者命令面板执行：

```
ext install Rebekah.personal-kb
```

也可以直接打开 [Marketplace 页面](https://marketplace.visualstudio.com/items?itemName=Rebekah.personal-kb) 点 Install。

装完 `Developer: Reload Window`，左侧活动栏会出现 Personal KB 图标。

Comate 用户命令行装：

```bash
"/Applications/Comate.app/Contents/Resources/app/bin/comate" \
  --install-extension Rebekah.personal-kb
```

## 从源码构建

```bash
export PATH="$HOME/.local/node/bin:$PATH"   # 本机 Node 不在 PATH 时需要
npm install
npm test
npm run package     # 产出 personal-kb-<version>.vsix
```

然后命令面板 → **Extensions: Install from VSIX…** → 选这个 `.vsix`。

## 能做什么

- **侧栏 · 统计**：已沉淀 / 本周新写 / 待复习三个数，分类分布环形饼图，Obsidian 连接状态
- **侧栏 · 卡片**：按月分组的列表，支持类型筛选与关键词搜索，点开跳原文
- **卡片墙**（`Personal KB: 打开卡片墙`）：bento 网格，最新一张放大成主卡；点卡片看结论 / 为什么重要 / 怎么用 / 反例；标签可点筛选
- **接入 AI 助手**（`Personal KB: 接入 AI 助手`）：给 Comate / Claude Code / Codex / Cursor 写沉淀指令，可一键移除
- **连接 Obsidian**：在 vault 根目录建软链 `Personal-KB` → 卡片目录，两边同一份文件
- **换存放位置**：`Personal KB: 选择卡片目录`；从 0.3.0 之前的位置搬卡片用 `Personal KB: 从旧位置复制卡片`
- 预留 flomo / 思源 / Notion / 印象笔记 接口，一期未接通

## 卡片长什么样

一个文件一张卡，`type` 六选一（不写就按所在目录名推断）：

```markdown
---
title: 需求评审先对齐口径，再谈方案
type: fundamentals
tags: [需求, 评审]
created: 2026-08-26
review_after:
---

# 需求评审先对齐口径，再谈方案

## 结论
评审吵不出结果，八成不是方案分歧，是同一个指标两边算法不同。

## 为什么重要
## 怎么用
## 反例 / 易错点
## 来源
```

`review_after` 只有 `pitfall` 需要，到期会计入侧栏的「待复习」。`INDEX.md` 不会被当成卡片。完整说明见 [docs/USAGE.md](docs/USAGE.md)。

## 开发

```bash
npm test        # tsc + node --test，覆盖卡片解析、统计、Obsidian 软链、agent 接入
npm run copy    # 改完 copy.json 后同步三处对外文案
npm run compile
npm run icon    # 重新生成 media/logo.png
npm run demo    # 重新生成 docs/demo/*.html
npm run shots   # 无头 Chrome 拍 media/screenshots/*.png
npm run package # 打 vsix
npm run ship:patch  # 升版本 + 打包 + 直接发 Marketplace
```

开发模式跑（改完重开窗口即可，不用重装）：

```bash
"/Applications/Comate.app/Contents/Resources/app/bin/comate" \
  --extensionDevelopmentPath="$PWD"
```

- 视觉规范见 [media/DESIGN.md](media/DESIGN.md)：字号五档、间距 8pt 阶梯、圆角两档、阴影两档，视图 CSS 只准引用 `theme.css` 的 token
- `media/logo.png` 和 `docs/demo/*.html` 都是脚本产物，别手改
- 上架清单见 [PUBLISH.md](PUBLISH.md)

## 目录

```
src/
  extension.ts            激活、命令注册、文件监听
  panel.ts                webview 宿主（卡片墙 panel + 两个侧栏 view）
  core/
    types.ts              Card / Stats / 六种类型
    parse.ts              frontmatter 与小节解析
    library.ts            扫目录、排序、算统计
    protocol.ts           沉淀协议正文（各 agent 共用一份）
    agents.ts             检测 agent、写入/移除沉淀指令
    migrate.ts            从旧卡片目录搬家
    connectors/obsidian.ts  软链连接
media/                    theme.css + 三个视图的 css/js
docs/USAGE.md             使用手册
docs/demo/                离线 demo（脚本生成）
scripts/                  图标生成、demo 生成、截图录屏
```

## 明确不做

- 插件自己不调模型、不抽知识：提炼是 AI 助手干的，插件只负责给它指令和展示结果
- 不双向同步 Notion / 印象笔记
- 不把云端库当主库
- 不上传卡片内容，插件只读写本地文件

## License

MIT

---

[← 返回作品集](../README.md)
