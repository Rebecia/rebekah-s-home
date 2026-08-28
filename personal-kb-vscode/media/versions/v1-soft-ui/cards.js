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

let state = { cards: [], filterType: 'all', query: '' };

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

function card(c, i) {
  return `<article class="card ${TINT[i % 3]}" data-id="${esc(c.id)}">
    <div class="top">
      <div class="badge ${esc(c.type)}">${esc(TYPE_CHAR[c.type] || '卡')}</div>
      <span class="when">${esc(c.created)}</span>
    </div>
    <div class="name">${esc(c.title)}</div>
    <div class="gist">${esc(c.conclusion)}</div>
  </article>`;
}

function render() {
  const cards = visible();
  const nav = ['all', 'thinking', 'fundamentals', 'idea', 'pitfall', 'life', 'glossary']
    .map(t => `<button class="pill ${state.filterType === t ? 'on' : ''}" data-filter="${t}">${t === 'all' ? '全部' : TYPE_LABEL[t]}</button>`)
    .join('');
  const keepFocus = document.activeElement && document.activeElement.classList.contains('search');
  document.getElementById('app').innerHTML = `
    <input class="search" placeholder="搜索卡片" value="${esc(state.query)}">
    <div class="nav">${nav}</div>
    <div class="list">${cards.length ? cards.map(card).join('') : '<div class="empty">没有匹配的卡片。在对话里说「沉淀这次」。</div>'}</div>
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
  if (t.dataset.filter) {
    state.filterType = t.dataset.filter;
    render();
    return;
  }
  const hit = t.closest('.card');
  if (hit && hit.dataset.id) {
    vscode.postMessage({ type: 'open', id: hit.dataset.id });
  }
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
