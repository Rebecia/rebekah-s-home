const vscode = acquireVsCodeApi();
const TYPE_LABEL = {
  thinking: '思考',
  fundamentals: '基本功',
  idea: 'Idea',
  pitfall: '易错',
  life: '人生',
  glossary: '术语'
};
const TYPE_CHAR = {
  thinking: '思',
  fundamentals: '基',
  idea: 'i',
  pitfall: '错',
  life: '生',
  glossary: '术'
};

let state = { cards: [], stats: {}, connectors: [], kbPath: '', filterType: 'all', query: '' };
let openId = null;

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function visible() {
  const q = (state.query || '').trim().toLowerCase();
  return (state.cards || []).filter(c => {
    if (state.filterType !== 'all' && c.type !== state.filterType) return false;
    if (!q) return true;
    return [c.title, c.conclusion, (c.tags || []).join(' '), c.source].join(' ').toLowerCase().includes(q);
  });
}

function badge(c) {
  return `<div class="badge ${esc(c.type)}">${esc(TYPE_CHAR[c.type] || '卡')}</div>`;
}

function head(c) {
  return `<div class="top">
    ${badge(c)}
    <span class="kind">${esc(TYPE_LABEL[c.type] || c.type)}</span>
    <span class="when num">${esc(c.created)}</span>
  </div>`;
}

/* 第一张放大成 feature，第四张横跨两列，其余常规 —— bento 的节奏 */
function tile(c, i) {
  const size = i === 0 ? 'feature' : (i === 3 ? 'wide' : '');
  const tags = (c.tags || []).slice(0, 3).map(t => `<button class="tag" data-tag="${esc(t)}">${esc(t)}</button>`).join('');
  // feature 卡地方大，多给一段「为什么重要」，否则下半张是空的
  const extra = size === 'feature' && c.why
    ? `<div class="gist why"><b>为什么重要</b>${esc(c.why)}</div>`
    : '';
  return `<article class="pane card ${size}" data-id="${esc(c.id)}">
    ${head(c)}
    <div class="name">${esc(c.title)}</div>
    <div class="gist">${esc(c.conclusion)}</div>
    ${extra}
    ${tags ? `<div class="tags">${tags}</div>` : ''}
  </article>`;
}

function sheet(c) {
  return `<div class="detail on">
    <div class="pane sheet">
      ${head(c)}
      <h2>${esc(c.title)}</h2>
      <p class="lead">${esc(c.conclusion || '—')}</p>
      <h3>为什么重要</h3><p>${esc(c.why || '—')}</p>
      <h3>怎么用</h3><p>${esc(c.how || '—')}</p>
      <h3>反例 / 易错点</h3><p>${esc(c.pitfall || '—')}</p>
      <h3>来源</h3><p>${esc(c.origin || c.source || '—')}</p>
      <div class="actions">
        <button class="go" data-open="${esc(c.id)}">打开原文</button>
        <button class="ghost" data-close="1">关闭</button>
      </div>
    </div>
  </div>`;
}

function onboard() {
  return `<section class="pane onboard" style="grid-column: 1 / -1">
    <h3>还没有卡片</h3>
    <p>在 AI 助手里说一句「沉淀本次」，卡片会自动写到 <code>${esc(state.kbPath || '')}</code></p>
    <div class="acts">
      <button class="go" data-cmd="personalKb.connectAgents">接入 AI 助手</button>
      <button class="ghost" data-cmd="personalKb.createSampleCard">先看张示例</button>
    </div>
    <p class="fmt">接入会往 Comate / Claude Code / Codex / Cursor 的指令文件写一段「怎么沉淀」，随时可以移除。也可以自己手写卡片：frontmatter 写 <code>title</code> / <code>type</code> / <code>tags</code> / <code>created</code>，正文写「结论 / 为什么重要 / 怎么用 / 反例」。</p>
  </section>`;
}

function render() {
  const cards = visible();
  const stats = state.stats || {};
  const nav = ['all', 'thinking', 'fundamentals', 'idea', 'pitfall', 'life', 'glossary']
    .map(t => `<button class="pill ${state.filterType === t ? 'on' : ''}" data-filter="${t}">${t === 'all' ? '全部' : TYPE_LABEL[t]}</button>`)
    .join('');
  const grid = !(state.cards || []).length
    ? onboard()
    : cards.length
      ? cards.map(tile).join('')
      : `<div class="empty">这个分类还没有卡片。<br>换个筛选，或者清空搜索词。</div>`;
  const current = (state.cards || []).find(c => c.id === openId);
  const obsidian = (state.connectors || []).find(c => c.id === 'obsidian') || {};
  const keepFocus = document.activeElement && document.activeElement.classList.contains('search');

  document.getElementById('app').innerHTML = `
    <div class="pane topbar">
      <span class="brand"><i>◆</i> Personal KB</span>
      <div class="nav">${nav}</div>
      <input class="search" placeholder="搜索标题、结论、标签" value="${esc(state.query || '')}">
    </div>

    <div class="grid">${grid}</div>

    <div class="pane cta">
      <div class="badge">◆</div>
      <div class="txt">
        <div class="t1">${stats.total || 0} 张卡片，本周新写 ${stats.createdThisWeek || 0} 张</div>
        <div class="t2">Obsidian ${obsidian.linked ? '已连接，卡片同一份文件' : '未连接'} · ${esc(state.kbPath || '')}</div>
      </div>
      <div class="acts">
        <button class="go" data-link="obsidian">${obsidian.linked ? '重新连接 Obsidian' : '连接 Obsidian'}</button>
      </div>
    </div>

    ${current ? sheet(current) : ''}
  `;

  if (keepFocus) {
    const input = document.querySelector('.search');
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }
}

document.addEventListener('click', e => {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;
  const btn = t.closest('button');
  if (btn) {
    if (btn.dataset.cmd) { vscode.postMessage({ type: 'cmd', id: btn.dataset.cmd }); return; }
    if (btn.dataset.filter) { state.filterType = btn.dataset.filter; render(); return; }
    if (btn.dataset.tag) { state.query = btn.dataset.tag; state.filterType = 'all'; render(); return; }
    if (btn.dataset.close) { openId = null; render(); return; }
    if (btn.dataset.open) { vscode.postMessage({ type: 'open', id: btn.dataset.open }); return; }
    if (btn.dataset.link === 'obsidian') { vscode.postMessage({ type: 'linkObsidian' }); return; }
  }
  if (t.classList.contains('detail')) { openId = null; render(); return; }
  const hit = t.closest('.card');
  if (hit && hit.dataset.id) { openId = hit.dataset.id; render(); }
});

document.addEventListener('input', e => {
  const t = e.target;
  if (t instanceof HTMLInputElement && t.classList.contains('search')) {
    state.query = t.value;
    render();
  }
});

window.addEventListener('message', event => {
  if (event.data?.type !== 'render') return;
  state = Object.assign({ filterType: state.filterType || 'all', query: state.query || '' }, event.data.payload);
  render();
});

vscode.postMessage({ type: 'ready' });
