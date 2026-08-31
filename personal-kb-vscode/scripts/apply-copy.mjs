// 对外文案的唯一出处：改 copy.json，跑 npm run copy，三处一起同步。
// description → package.json（Marketplace 搜索结果那行）
// tagline     → media/stats.js 侧栏顶部那条
// readmeLead  → README.md 标题下那句加粗
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = name => readFileSync(join(root, name), 'utf8');
const write = (name, text) => writeFileSync(join(root, name), text, 'utf8');

const copy = JSON.parse(read('copy.json'));
for (const key of ['description', 'tagline', 'readmeLead']) {
  if (typeof copy[key] !== 'string' || !copy[key].trim()) {
    console.error(`copy.json 里缺 ${key}，或者写成了空字符串。`);
    process.exit(1);
  }
}

const changed = [];

// 1. package.json：只动 description，键的顺序和缩进都保持原样
const pkg = JSON.parse(read('package.json'));
if (pkg.description !== copy.description) {
  pkg.description = copy.description;
  write('package.json', JSON.stringify(pkg, null, 2) + '\n');
  changed.push('package.json description');
}

// 2. 侧栏 tagline
const statsPath = 'media/stats.js';
const stats = read(statsPath);
const taglineRe = /(<div class="tagline"><i>◆<\/i> )([^<]*)(<\/div>)/;
if (!taglineRe.test(stats)) {
  console.error(`${statsPath} 里找不到 tagline 那一行，改过结构的话要同步改本脚本。`);
  process.exit(1);
}
const nextStats = stats.replace(taglineRe, `$1${copy.tagline}$3`);
if (nextStats !== stats) {
  write(statsPath, nextStats);
  changed.push('侧栏 tagline');
}

// 3. README 标题下那句加粗
const readme = read('README.md');
const leadRe = /(^# Personal KB 卡片墙\n\n)\*\*[^\n]*\*\*/m;
if (!leadRe.test(readme)) {
  console.error('README.md 里找不到标题下那句加粗，改过结构的话要同步改本脚本。');
  process.exit(1);
}
const nextReadme = readme.replace(leadRe, `$1**${copy.readmeLead}**`);
if (nextReadme !== readme) {
  write('README.md', nextReadme);
  changed.push('README 首句');
}

if (!changed.length) {
  console.log('三处文案都已经和 copy.json 一致，没改动。');
} else {
  console.log('已同步：' + changed.join('、'));
  console.log('\n提醒：Marketplace 上的简介只有重新发版才会变，发版用 npm run ship:patch。');
}
