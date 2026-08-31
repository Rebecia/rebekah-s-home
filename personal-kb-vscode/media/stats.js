const vscode = acquireVsCodeApi();
const TYPE_LABEL = {
  thinking: '思考',
  fundamentals: '基本功',
  idea: 'Idea',
  pitfall: '易错',
  life: '人生',
  glossary: '术语'
};

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

window.addEventListener('message', event => {
  if (event.data?.type !== 'render') return;
  const { stats, connectors, kbPath, kbExists } = event.data.payload;

  // 没指目录 / 目录里还没有卡片：给引导，不给空仪表盘
  if (!kbExists || !(stats.total > 0)) {
    document.getElementById('app').innerHTML = `
      <div class="stack">
        <section class="pane onboard">
          <h3>还没有卡片</h3>
          <p>在 AI 助手里说一句「沉淀本次」，卡片会自动写到<br><code>${esc(kbPath || '')}</code></p>
          <div class="acts">
            <button class="go" data-cmd="personalKb.connectAgents">接入 AI 助手</button>
            <button class="ghost" data-cmd="personalKb.createSampleCard">先看张示例</button>
          </div>
          <p class="fmt">接入会往 Comate / Claude Code / Codex / Cursor 的指令文件写一段「怎么沉淀」，随时可以移除。也可以自己手写卡片：frontmatter 写 <code>title</code> / <code>type</code> / <code>tags</code> / <code>created</code>，正文写「结论 / 为什么重要 / 怎么用 / 反例」。</p>
        </section>
      </div>
    `;
    return;
  }

  const types = (stats.byType || []).filter(x => x.count).sort((a, b) => b.count - a.count).slice(0, 6);
  const sum = types.reduce((n, x) => n + x.count, 0) || 1;
  let acc = 0;
  const stops = types.map((x, i) => {
    const from = (acc / sum) * 100;
    acc += x.count;
    const to = (acc / sum) * 100;
    return `var(--sl${i + 1}) ${from.toFixed(2)}% ${to.toFixed(2)}%`;
  }).join(', ');
  const legend = types.map((x, i) => `
    <div class="li">
      <span class="dot" style="background:var(--sl${i + 1})"></span>
      <span class="nm">${esc(TYPE_LABEL[x.type] || x.type)}</span>
      <span class="ct num">${x.count}</span>
    </div>`).join('');
  const pie = types.length
    ? `<div class="pie-wrap">
        <div class="pie-hole">
          <div class="pie" style="background: conic-gradient(${stops})"></div>
          <div class="mid"><b class="num">${sum}</b><span>张</span></div>
        </div>
        <div class="legend">${legend}</div>
      </div>`
    : `<div class="row"><span class="lb">还没有</span></div>`;
  const obsidian = (connectors || []).find(c => c.id === 'obsidian') || {};
  const linked = !!obsidian.linked;
  const due = stats.duePitfalls || 0;

  document.getElementById('app').innerHTML = `
    <div class="stack">
      <section class="pane hero">
        <div class="tagline"><i>◆</i> 忙完说一句「沉淀本次」，知识库就厚一点</div>
        <h1>你的知识库</h1>
        <p>思考、基本功、idea、易错点，按类型攒在一处，随时回看。</p>
        <button class="go" data-cmd="personalKb.openWall">打开卡片墙</button>
      </section>

      <section class="pane strip">
        <div class="cell"><span class="n num">${stats.total || 0}</span><span class="k">已沉淀</span></div>
        <div class="cell"><span class="n num">${stats.createdThisWeek || 0}</span><span class="k">本周新写</span></div>
        <div class="cell"><span class="n num ${due ? 'warn' : ''}">${due}</span><span class="k">待复习</span></div>
      </section>

      <section class="pane block">
        <h2>分类分布 <span>${stats.tagCount || 0} 个标签</span></h2>
        ${pie}
      </section>

      <section class="pane conn">
        <div class="line">
          <div class="badge">Ob</div>
          <span class="name">Obsidian</span>
          <span class="state ${linked ? 'ok' : ''}">${linked ? '已连接' : '未连接'}</span>
        </div>
        <button class="go plain" data-link="obsidian">${linked ? '重新选择 vault' : '连接 vault'}</button>
      </section>

      <div class="path">${esc(kbPath || '')}</div>
    </div>
  `;
});

document.addEventListener('click', e => {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;
  const hit = t.closest('button');
  if (!hit) return;
  if (hit.dataset.link === 'obsidian') { vscode.postMessage({ type: 'linkObsidian' }); return; }
  if (hit.dataset.cmd) { vscode.postMessage({ type: 'cmd', id: hit.dataset.cmd }); }
});

vscode.postMessage({ type: 'ready' });
