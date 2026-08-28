# 使用手册

## 它和 Comate Skill 的分工

沉淀这件事发生在**对话里**，不在插件里。

- **写入层** = Comate 的 `personal-kb` Skill。你在对话里说「沉淀这次」，它把这轮的可复用结论写成一张 Markdown 卡片。
- **阅读层** = 这个插件。它只做三件事：把卡片渲染成卡片墙、统计全局卡片、把同一份文件连到 Obsidian。

两层共用同一个目录，没有第二份数据：

```
~/.comate/skills/personal-kb/kb/
├── INDEX.md          索引
├── thinking/         产品思考
├── fundamentals/     产品基本功
├── ideas/            产品 idea
├── pitfalls/         易错点
├── life/             人生建议
└── glossary/         术语黑话
```

插件是只读的（除了 Obsidian 软链），删卡片、改卡片都直接编辑 Markdown。

## 装完先做这一步

命令面板 → `Developer: Reload Window`，左侧活动栏会出现 Personal KB 图标。

如果你的卡片不在默认路径，设置里改 `personalKb.kbPath`。

## 三个界面

### 侧栏 · 统计

- **已沉淀 / 本周新写 / 待复习** 三个数。「本周」从本周一算起；「待复习」= 易错点卡片里 `review_after` 已到期的数量
- **分类分布** 环形饼图，中心是总数，占比最大的类型用琥珀色标出
- **Obsidian** 连接状态与连接入口

### 侧栏 · 卡片

- 按月分组的列表，组标题上带数量
- 顶部搜索框搜标题、结论、标签、来源
- 类型胶囊筛选
- 点任意卡片 → 打开它的 Markdown 原文

### 卡片墙

命令面板 → `Personal KB: 打开卡片墙`，或侧栏标题栏的图标。

- bento 网格：最新一张放大成主卡，其余按序铺开
- 点卡片 → 弹出详情，读结论 / 为什么重要 / 怎么用 / 反例，可跳去原文
- 点卡片上的标签 → 按这个标签筛选
- 顶栏胶囊按类型筛选

不想装插件也想看长什么样：`docs/demo/index.html`（离线单文件，双击即可）。

## 怎么往里加卡片

在 Comate 对话里说这几句之一：

| 你说的 | 会发生什么 |
| --- | --- |
| 沉淀这次 | 把本轮的可复用结论整理成候选卡片，等你确认后落盘 |
| 这条值得留 / 记到知识库 | 同上 |
| 知识库里有什么 | 先检索再回答，不凭空编 |
| 复习易错点 | 抽出 `review_after` 已到期的易错点卡 |

Skill 不会在你没确认前写文件。任务收尾时它会主动提 1–3 张候选卡片，你说要哪张才写。

## 卡片格式

插件按这个结构解析，手写卡片也照这个来：

```markdown
---
title: 用一句话能看懂的标题
type: thinking          # thinking / fundamentals / idea / pitfall / life / glossary
tags: [标签1, 标签2]
created: 2026-08-28
source: 哪次对话 / 哪份文档
review_after: 2026-09-28   # 只有易错点需要，到期会进「待复习」
---

# 标题
## 结论
## 为什么重要
## 怎么用
## 反例 / 易错点
## 来源
```

`type` 缺失时按所在目录推断（`ideas/` → idea，`pitfalls/` → pitfall）。`INDEX.md` 不会被当成卡片。

## 接到 Obsidian

1. 命令面板 → `Personal KB: 连接到 Obsidian vault`
2. 选 vault 根目录（里面有 `.obsidian` 文件夹的那个）
3. vault 里出现文件夹 `Personal-KB`，它是指向 `kb/` 的软链——**同一份文件**，不是拷贝
4. 之后在 Obsidian 里搜索、双链、Dataview 都能用

取消连接：`Personal KB: 取消 Obsidian 连接`。只删软链，不动卡片；如果那个位置不是软链（比如你自己建了个真文件夹），会拒绝删除。

flomo / 思源 / Notion / 印象笔记 的接口留了，一期没接——云端库双向同步容易把本地这份唯一真相搞脏。

## 命令与配置

命令（命令面板搜 `Personal KB`）：

- 打开卡片墙
- 刷新卡片
- 打开卡片原文
- 连接到 Obsidian vault
- 取消 Obsidian 连接
- 在 Finder 中显示知识库

配置：

- `personalKb.kbPath` — 卡片目录，留空用默认路径
- `personalKb.obsidianVault` — Obsidian vault 根目录，连接后自动写入

## 常见问题

**卡片数是 0。** 看设置里的 `personalKb.kbPath` 指到哪了，或者命令面板 `在 Finder 中显示知识库` 确认目录里有 `.md`。

**新写的卡片没出现。** 插件监听 `kb/` 的文件变化，正常会自动刷新；没刷就手动 `Personal KB: 刷新卡片`。

**「待复习」一直是 0。** 只有 `type: pitfall` 且 `review_after` 日期不晚于今天的卡片才计入。

**饼图只有几块。** 只画卡片数最多的前 6 类，空类型不画。

**改了界面代码看不到变化。** 装的是 vsix 的话要重新打包安装并 Reload Window；开发模式（`--extensionDevelopmentPath`）下重开窗口即可。
