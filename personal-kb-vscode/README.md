<div align="center">

# Personal KB 卡片墙

**一个文件夹的 Markdown，就是一面结论优先的卡片墙。**

[打开在线 demo](https://rebecia.github.io/rebekah-s-home/personal-kb-vscode/docs/demo/) · [使用手册](./docs/USAGE.md) · [返回作品集](../README.md)

</div>

![卡片墙](https://raw.githubusercontent.com/Rebecia/rebekah-s-home/main/personal-kb-vscode/media/screenshots/wall.png)

## 这是什么

一个 VS Code 插件：指一个装着 Markdown 卡片的文件夹，它把这些卡片渲染成**结论优先**的卡片墙，按类型统计，并能软链连接 Obsidian。

**唯一真相是你本地的 Markdown 文件。** 插件只读，不建库、不上传、不同步云端。删卡片、改卡片都是直接编辑文件。

装完第一次打开会让你选目录，也能一键生成一张示例卡片——那张卡片本身就是格式说明。

用 Comate 的话还有一条捷径：`personal-kb` Skill 会在对话里把结论沉淀成卡片（说「沉淀这次」），默认落在 `~/.comate/skills/personal-kb/kb/`，插件不配置就直接读这里。但这只是**其中一种来源**，手写、从别处导出、Obsidian 里现成的卡片都一样能用。

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

## 快速开始

```bash
export PATH="$HOME/.local/node/bin:$PATH"   # 本机 Node 不在 PATH 时需要
npm install
npm test
npm run package     # 产出 personal-kb-0.1.0.vsix
```

安装：命令面板 → **Extensions: Install from VSIX…** → 选这个 `.vsix` → `Developer: Reload Window`。

Comate 用户也可以直接命令行装：

```bash
"/Applications/Comate.app/Contents/Resources/app/bin/comate" \
  --install-extension personal-kb-0.1.0.vsix --force
```

## 能做什么

- **侧栏 · 统计**：已沉淀 / 本周新写 / 待复习三个数，分类分布环形饼图，Obsidian 连接状态
- **侧栏 · 卡片**：按月分组的列表，支持类型筛选与关键词搜索，点开跳原文
- **卡片墙**（`Personal KB: 打开卡片墙`）：bento 网格，最新一张放大成主卡；点卡片看结论 / 为什么重要 / 怎么用 / 反例；标签可点筛选
- **连接 Obsidian**：在 vault 根目录建软链 `Personal-KB` → 卡片目录，两边同一份文件
- **首次上手**：`Personal KB: 选择卡片目录`、`Personal KB: 创建示例卡片`
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
npm test        # tsc + node --test，覆盖卡片解析、统计、Obsidian 软链
npm run compile
npm run icon    # 重新生成 media/logo.png
npm run demo    # 重新生成 docs/demo/*.html
npm run shots   # 无头 Chrome 拍 media/screenshots/*.png
npm run package # 打 vsix
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
    connectors/obsidian.ts  软链连接
media/                    theme.css + 三个视图的 css/js
docs/USAGE.md             使用手册
docs/demo/                离线 demo（脚本生成）
scripts/                  图标生成、demo 生成、截图录屏
```

## 明确不做

- 不在插件里从对话抽知识（那是 Skill 的事）
- 不双向同步 Notion / 印象笔记
- 不把云端库当主库
- 不上传卡片内容，插件全程只读本地文件

## License

MIT

---

[← 返回作品集](../README.md)
