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

function card(c) {
  return `<article class="card" data-id="${esc(c.id)}">
    <div class="top">
      <div class="badge ${esc(c.type)}">${esc(TYPE_CHAR[c.type] || '卡')}</div>
      <span class="kind">${esc(TYPE_LABEL[c.type] || c.type)}</span>
      <span class="when num">${esc((c.created || '').slice(5) || '—')}</span>
    </div>
    <div class="name">${esc(c.title)}</div>
    <div class="gist">${esc(c.conclusion)}</div>
  </article>`;
}

function monthOf(c) {
  const m = /^(\d{4})-(\d{2})/.exec(c.created || '');
  return m ? `${m[1]} 年 ${Number(m[2])} 月` : '未标日期';
}

/* 按月分组，列表才有层次，不然是一堆等重的块 */
function groups(cards) {
  const out = [];
  for (const c of cards) {
    const key = monthOf(c);
    const last = out[out.length - 1];
    if (last && last.key === key) { last.items.push(c); } else { out.push({ key, items: [c] }); }
  }
  return out;
}

function onboard() {
  return `<section class="pane onboard">
    <h3>还没有卡片</h3>
    <p>在 AI 助手里说一句「沉淀本次」，卡片会自动写到<br><code>${esc(state.kbPath || '')}</code></p>
    <div class="acts">
      <button class="go" data-cmd="personalKb.connectAgents">接入 AI 助手</button>
      <button class="ghost" data-cmd="personalKb.createSampleCard">先看张示例</button>
    </div>
  </section>`;
}

function render() {
  const all = state.cards || [];
  if (!all.length) {
    document.getElementById('app').innerHTML = onboard();
    return;
  }
  const cards = visible();
  const nav = ['all', 'thinking', 'fundamentals', 'idea', 'pitfall', 'life', 'glossary']
    .map(t => `<button class="pill ${state.filterType === t ? 'on' : ''}" data-filter="${t}">${t === 'all' ? '全部' : TYPE_LABEL[t]}</button>`)
    .join('');
  const keepFocus = document.activeElement && document.activeElement.classList.contains('search');
  const body = cards.length
    ? groups(cards).map(g => `
      <section class="group">
        <div class="gtitle">${esc(g.key)} · ${g.items.length}</div>
        ${g.items.map(card).join('')}
      </section>`).join('')
    : '<div class="empty">没有匹配的卡片。<br>在对话里说「沉淀本次」。</div>';
  document.getElementById('app').innerHTML = `
    <div class="bar"><input class="search" placeholder="搜索卡片" value="${esc(state.query)}"></div>
    <div class="nav">${nav}</div>
    ${body}
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
  if (btn && btn.dataset.cmd) {
    vscode.postMessage({ type: 'cmd', id: btn.dataset.cmd });
    return;
  }
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
