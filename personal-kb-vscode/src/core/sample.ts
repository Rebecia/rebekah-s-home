import * as fs from 'fs';
import * as path from 'path';

/* 首次使用时写一张能跑通的示例卡片。内容本身就是卡片格式的说明。 */
export const SAMPLE_FILENAME = 'thinking/示例卡片.md';

export function sampleCard(today: string): string {
  return `---
title: 这就是一张卡片
type: thinking
tags: [示例, 上手]
created: ${today}
source: 插件自带示例
review_after:
---

# 这就是一张卡片

## 结论

一张卡片就是一个 Markdown 文件：上面一段 frontmatter 定类型和标签，下面按固定小节写内容。删掉这张、按同样格式写你自己的就行。

## 为什么重要

固定结构换来两件事：卡片墙能把「结论」直接摆到最前面，统计能按类型和日期聚合。散着写的笔记做不到这两点。

## 怎么用

- \`type\` 六选一：thinking / fundamentals / idea / pitfall / life / glossary
- 不写 \`type\` 也行，会按所在目录名推断（\`ideas/\` → idea，\`pitfalls/\` → pitfall）
- \`review_after\` 只有 pitfall 需要，到期会计入侧栏的「待复习」
- \`INDEX.md\` 不会被当成卡片，可以放目录索引

## 反例 / 易错点

小节标题写错（比如把「结论」写成「总结」）时，卡片墙上会读不到摘要——解析是按 \`## 结论\` 这一行匹配的。

## 来源

插件自带示例，可以直接删。
`;
}

export function writeSampleCard(kbRoot: string, today: string): string {
  const target = path.join(kbRoot, SAMPLE_FILENAME);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (!fs.existsSync(target)) {
    fs.writeFileSync(target, sampleCard(today), 'utf8');
  }
  return target;
}
