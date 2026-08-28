# 更新记录

本项目版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [0.1.0] - 2026-08-28

首个可打包版本，尚未上架。

### 新增

- 活动栏 **Personal KB**：统计视图 + 卡片列表视图（均为 webview）
- 命令 **Personal KB: 打开卡片墙**：bento 布局的卡片墙，点开看结论 / 为什么重要 / 怎么用 / 反例
- 统计：已沉淀、本周新写、待复习三项指标，分类分布环形饼图
- 卡片列表按月分组，支持按类型筛选与关键词搜索；卡片墙内标签可点筛选
- **连接到 Obsidian vault**：在 vault 根目录创建软链 `Personal-KB` 指向 `kb/`，两边同一份文件
- 文件监听：`kb/` 下的 Markdown 变化后自动刷新
- 配置项 `personalKb.kbPath`、`personalKb.obsidianVault`
- 预留 flomo / 思源 / Notion / 印象笔记 连接器接口（一期未接通）
