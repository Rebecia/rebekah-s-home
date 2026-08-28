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
const TINT = ['', 'sky', 'cream'];

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

function tile(c, i) {
  return `<article class="card ${TINT[i % 3]}" data-id="${esc(c.id)}">
    <div class="top">
      ${badge(c)}
      <span class="kind">${esc(TYPE_LABEL[c.type] || c.type)}</span>
      <span class="when">${esc(c.created)}</span>
    </div>
    <div class="name">${esc(c.title)}</div>
    <div class="gist">${esc(c.conclusion)}</div>
  </article>`;
}

function sheet(c) {
  return `<div class="detail on">
    <div class="sheet">
      <div class="top">
        ${badge(c)}
        <span class="kind">${esc(TYPE_LABEL[c.type] || c.type)}</span>
        <span class="when">${esc(c.created)}</span>
      </div>
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

function render() {
  const cards = visible();
  const stats = state.stats || {};
  const nav = ['all', 'thinking', 'fundamentals', 'idea', 'pitfall', 'life', 'glossary']
    .map(t => `<button class="pill ${state.filterType === t ? 'on' : ''}" data-filter="${t}">${t === 'all' ? '全部' : TYPE_LABEL[t]}</button>`)
    .join('');
  const grid = cards.length
    ? cards.map(tile).join('')
    : `<div class="empty">这个分类还没有卡片。在对话里说「沉淀这次」。</div>`;
  const current = (state.cards || []).find(c => c.id === openId);
  const obsidian = (state.connectors || []).find(c => c.id === 'obsidian') || {};
  const keepFocus = document.activeElement && document.activeElement.classList.contains('search');

  document.getElementById('app').innerHTML = `
    <div class="masthead">
      <h1>知识库</h1>
      <div class="count"><b>${stats.total || 0}</b> 张 · 本周 <b>${stats.createdThisWeek || 0}</b></div>
    </div>
    <div class="toolbar">
      <div class="nav">${nav}</div>
      <input class="search" placeholder="搜索标题或结论" value="${esc(state.query || '')}">
    </div>
    <div class="grid">${grid}</div>
    <div class="foot">
      <span>Obsidian ${obsidian.linked ? '已连接' : '未连接'}</span>
      <button class="go" data-link="obsidian">${obsidian.linked ? '重新连接' : '连接 vault'}</button>
      <span>${esc(state.kbPath || '')}</span>
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
  if (t.dataset.filter) { state.filterType = t.dataset.filter; render(); return; }
  if (t.dataset.close) { openId = null; render(); return; }
  if (t.dataset.open) { vscode.postMessage({ type: 'open', id: t.dataset.open }); return; }
  if (t.dataset.link === 'obsidian') { vscode.postMessage({ type: 'linkObsidian' }); return; }
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
