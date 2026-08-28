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

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

window.addEventListener('message', event => {
  if (event.data?.type !== 'render') return;
  const { stats, connectors, kbPath } = event.data.payload;
  const types = (stats.byType || []).filter(x => x.count);
  const max = Math.max(1, ...types.map(x => x.count));
  const bars = types.map((x, i) =>
    `<div class="${i % 2 ? 'pale' : ''}" style="height:${Math.round(14 + (x.count / max) * 32)}px"></div>`
  ).join('');
  const labels = types.map(x => `<span>${esc(TYPE_LABEL[x.type] || x.type)}</span>`).join('');
  const obsidian = (connectors || []).find(c => c.id === 'obsidian') || {};
  const linked = !!obsidian.linked;

  document.getElementById('app').innerHTML = `
    <h2 class="head">知识库</h2>
    <div class="tiles">
      <div class="tile wide sky">
        <div class="row">
          <div class="badge thinking">卡</div>
          <span class="chip">全部</span>
        </div>
        <div class="cap">已沉淀卡片</div>
        <div class="sub">对话里说「沉淀这次」即新增</div>
        <div class="big">${stats.total || 0}<i> 则</i></div>
      </div>
      <div class="tile">
        <div class="row"><div class="badge fundamentals">周</div></div>
        <div class="cap">本周新写</div>
        <div class="big">${stats.createdThisWeek || 0}<i> 则</i></div>
      </div>
      <div class="tile cream">
        <div class="row"><div class="badge pitfall">复</div></div>
        <div class="cap">待复习</div>
        <div class="big">${stats.duePitfalls || 0}<i> 则</i></div>
      </div>
      <div class="tile wide">
        <div class="row">
          <div class="cap" style="margin:0">分类分布</div>
          <span class="chip">${stats.tagCount || 0} 标签</span>
        </div>
        <div class="bars">${bars || '<div style="height:8px"></div>'}</div>
        <div class="barlabels">${labels}</div>
      </div>
    </div>
    <div class="link-row">
      <span>Obsidian ${linked ? '已连接' : '未连接'}</span>
      <button class="go" data-link="obsidian">${linked ? '重选' : '连接'}</button>
    </div>
    <div class="foot">${esc(kbPath || '')}</div>
  `;
});

document.addEventListener('click', e => {
  const t = e.target;
  if (t instanceof HTMLElement && t.dataset.link === 'obsidian') {
    vscode.postMessage({ type: 'linkObsidian' });
  }
});

vscode.postMessage({ type: 'ready' });
