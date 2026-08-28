// 生成 docs/demo/index.html —— 把真实的 theme.css / wall.css / wall.js 内联进一个单文件，
// 配一份示例卡片。用途：GitHub Pages 上的可交互 demo，以及拍界面图的对象。
// 单一真相仍在 media/，这个文件是产物，不要手改。
// 用法：node scripts/make-demo.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(join(root, p), 'utf8');

/* 示例卡片：只用通用内容，不放真实个人知识库里的东西 */
const CARDS = [
  ['需求评审先对齐口径，再谈方案', 'fundamentals', '2026-08-26', ['需求', '评审'],
    '评审吵不出结果，八成不是方案分歧，是同一个指标两边算法不同。先把口径写在白板上，再讨论方案。',
    '口径不一致时，双方都在用自己的数字证明自己对，讨论无法收敛。', '开场五分钟先念一遍指标定义和统计范围。', '直接进方案讨论，一小时后发现两边说的"转化率"分母不一样。'],
  ['Agent 产品的评测要分层', 'thinking', '2026-08-24', ['Agent', '评测'],
    '把端到端成功率拆成"意图识别 / 工具调用 / 结果组织"三层，才知道该改哪一层。',
    '只看端到端指标，回归时无法定位是哪一环退化。', '每层单独打分并留 badcase 样本集。', '只报一个 78% 成功率，下一版降到 74% 却查不出原因。'],
  ['UTR', 'glossary', '2026-08-22', ['指标', '口径'],
    'Unique Trigger Rate，去重后触发过某功能的用户占比，分母是有机会触发的用户，不是全量用户。',
    '分母取错会让数字虚高一倍以上。', '算之前先确认"有机会触发"的判定条件。', '拿 DAU 当分母，导致低估功能渗透。'],
  ['把复习做成到期提醒，而不是列表', 'idea', '2026-08-20', ['知识管理'],
    '易错点卡片加一个 review_after 日期，到期才出现在"待复习"，避免每次打开都面对全量列表。',
    '全量列表会让人放弃复习，到期制把复习变成有限任务。', '写卡时顺手填一个日期，一周或一个月后。', '把 200 张卡列成一页，指望自己每天翻。'],
  ['先量后砍：需求排期用数据止损', 'fundamentals', '2026-08-18', ['排期'],
    '排期争不下来时，先给每个需求配一个可观测指标和放弃条件，再决定先做哪个。',
    '有放弃条件的需求可以试错，没有的只能一路做到底。', '每个需求写一行"若两周后 X 未达 Y，则停"。', '按老板关注度排序，做完没人回看效果。'],
  ['文档协作别动别人的内容', 'pitfall', '2026-08-16', ['协作'],
    '往共享文档补内容时，填进已有结构里，不改写他人段落，不重排他人表格。',
    '改写会覆盖别人的上下文，也让 diff 无法review。', '新增内容单独成行或成列，保留原结构。', '为了"整理得更清楚"重排整张表，作者找不到自己写的东西。'],
  ['判断要不要做，先问谁会因此改变行为', 'thinking', '2026-08-14', ['判断'],
    '一个功能如果说不出"谁的哪个动作会变"，通常是想象出来的需求。',
    '行为变化是唯一能观测的收益来源。', '写一句"某角色原来做 A，之后会做 B"。', '用"提升体验"当收益描述，上线后没有指标可看。'],
  ['把决定写下来，比记住它更省事', 'life', '2026-08-12', ['方法'],
    '任何需要第二次解释的决定，都值得写一段话记下当时的约束和取舍。',
    '人只记得结论，忘记约束，于是下次会推翻一个其实正确的决定。', '记三行：决定、当时的约束、放弃了什么。', '半年后重新讨论同一个问题，且没人记得为什么当初这么定。'],
  ['指标别只看均值', 'fundamentals', '2026-08-10', ['指标', '分析'],
    '看均值的同时至少看一个分位数（P50 / P90），均值会被长尾拖着走。',
    '均值改善但 P90 恶化，意味着一部分用户体验在变差。', '看板上给关键指标同时放均值和 P90。', '平均耗时下降就宣布优化成功，实际上重度用户变慢了。'],
  ['需求文档的"不做什么"和"要做什么"一样重要', 'pitfall', '2026-08-08', ['需求', 'PRD'],
    'PRD 里显式写一节"本期不做"，能挡住一半的范围蔓延。',
    '不写就要靠口头共识，而口头共识在下一次会议就失效。', '每份 PRD 固定留"明确不做"小节，逐条列。', '只写要做的，评审时被追加三个"顺便"。']
];

const cards = CARDS.map(([title, type, created, tags, conclusion, why, how, pitfall], i) => ({
  id: `demo/${i}.md`, title, type, created, tags, conclusion, why, how, pitfall,
  source: '示例数据', origin: '示例数据', reviewAfter: ''
}));

const byType = ['thinking', 'fundamentals', 'idea', 'pitfall', 'life', 'glossary']
  .map(type => ({ type, count: cards.filter(c => c.type === type).length }));

const payload = {
  cards,
  stats: { total: cards.length, byType, createdThisWeek: 2, duePitfalls: 1, tagCount: 14 },
  connectors: [{ id: 'obsidian', linked: true }],
  kbPath: '~/.comate/skills/personal-kb/kb',
  filterType: 'all'
};

/* demo 页顶部的一条说明栏。拍图时用 ?bare=1 去掉，免得进产品图 */
const REPO = 'https://github.com/Rebecia/rebekah-s-home/tree/main/personal-kb-vscode';
const BAR_CSS = `
.demobar {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 16px;
  font-size: 11px;
  color: var(--mute);
  background: var(--glass);
  border-bottom: 1px solid var(--hair);
  backdrop-filter: blur(20px);
}
.demobar b { color: var(--ink); font-weight: 600; }
.demobar .sep { color: var(--faint); }
.demobar a { color: var(--mute); text-decoration: none; border-bottom: 1px solid var(--hair); }
.demobar a:hover, .demobar a[aria-current="page"] { color: var(--ink); border-bottom-color: var(--ink); }
.demobar .right { margin-left: auto; }
body.bare .demobar { display: none; }
`;

const bar = active => `<header class="demobar">
  <b>Personal KB</b>
  <span class="sep">示例数据，可以随便点</span>
  <span class="right">
    <a href="./" ${active === 'wall' ? 'aria-current="page"' : ''}>卡片墙</a>
    ·
    <a href="./sidebar.html" ${active === 'side' ? 'aria-current="page"' : ''}>统计侧栏</a>
    ·
    <a href="${REPO}">安装与源码</a>
  </span>
</header>`;

const bareScript = `
// 拍图时 ?bare=1 隐藏说明栏
if (new URLSearchParams(location.search).has('bare')) document.body.classList.add('bare');
`;

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Personal KB 卡片墙 · 在线 demo</title>
<style>
${read('media/theme.css')}
${read('media/wall.css')}
${BAR_CSS}
</style>
</head>
<body>
${bar('wall')}
<div id="app"></div>
<script>${bareScript}</script>
<script>
// demo 里没有宿主，桩掉 VS Code API；点「打开原文」只弹提示
window.acquireVsCodeApi = () => ({
  postMessage: m => { if (m && m.type === 'open') alert('在插件里会打开这张卡的 Markdown 原文'); }
});
</script>
<script>
${read('media/wall.js')}
</script>
<script>
window.postMessage({ type: 'render', payload: ${JSON.stringify(payload)} }, '*');
// ?open=N 自动打开第 N 张卡的详情，用来拍详情图；?q=xxx 预填搜索词
const q = new URLSearchParams(location.search);
if (q.has('open') || q.has('q')) {
  setTimeout(() => {
    if (q.has('q')) {
      const input = document.querySelector('.search');
      if (input) { input.value = q.get('q'); input.dispatchEvent(new Event('input', { bubbles: true })); }
    }
    if (q.has('open')) {
      const cards = document.querySelectorAll('.card');
      const target = cards[Number(q.get('open')) || 0];
      if (target) target.click();
    }
  }, 30);
}
</script>
</body>
</html>
`;

mkdirSync(join(root, 'docs', 'demo'), { recursive: true });
const out = join(root, 'docs', 'demo', 'index.html');
writeFileSync(out, html);
console.log(`wrote ${out} (${(html.length / 1024).toFixed(1)} KB)`);

/* 侧栏 demo：统计视图单独一页，按真实侧栏宽度 360px 裱起来，方便拍图 */
const side = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Personal KB 统计侧栏 · demo</title>
<style>
${read('media/theme.css')}
${read('media/stats.css')}
${BAR_CSS}
html, body { min-height: 100vh; }
#app { width: 360px; margin: 0 auto; }
</style>
</head>
<body>
${bar('side')}
<div id="app"></div>
<script>${bareScript}</script>
<script>
window.acquireVsCodeApi = () => ({ postMessage: () => {} });
</script>
<script>
${read('media/stats.js')}
</script>
<script>
window.postMessage({ type: 'render', payload: ${JSON.stringify(payload)} }, '*');
</script>
</body>
</html>
`;
const outSide = join(root, 'docs', 'demo', 'sidebar.html');
writeFileSync(outSide, side);
console.log(`wrote ${outSide} (${(side.length / 1024).toFixed(1)} KB)`);
