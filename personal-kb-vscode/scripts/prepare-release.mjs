// 发版：改版本号、补 CHANGELOG 占位、同步文案、重生成 demo 与截图、跑测试、打包。
// 用法：node scripts/prepare-release.mjs patch|minor|major [--publish]
// 带 --publish 会直接发到 Marketplace（需要先 npx vsce login Rebekah）。
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const publish = args.includes('--publish');
const kind = args.find(a => !a.startsWith('--')) || 'patch';
if (!['patch', 'minor', 'major'].includes(kind)) {
  console.error('用法：node scripts/prepare-release.mjs patch|minor|major [--publish]');
  process.exit(1);
}

const run = (cmd, cmdArgs) => execFileSync(cmd, cmdArgs, { cwd: root, stdio: 'inherit' });
const pkgPath = join(root, 'package.json');
const before = JSON.parse(readFileSync(pkgPath, 'utf8')).version;

// 0. 文案先同步，免得改了 copy.json 忘了跑
run('node', ['scripts/apply-copy.mjs']);

// 1. 版本号（不打 git tag，tag 留到人工确认 CHANGELOG 之后）
run('npm', ['version', kind, '--no-git-tag-version']);
const version = JSON.parse(readFileSync(pkgPath, 'utf8')).version;
console.log(`\n版本 ${before} → ${version}\n`);

// 2. CHANGELOG 占位：已经有这一版就不动，避免覆盖手写内容
const clPath = join(root, 'CHANGELOG.md');
const changelog = readFileSync(clPath, 'utf8');
if (changelog.includes(`## [${version}]`)) {
  console.log(`CHANGELOG 已有 ${version} 的条目，跳过。\n`);
} else {
  const today = new Date().toISOString().slice(0, 10);
  const stub = `## [${version}] - ${today}\n\n### 新增\n\n- TODO\n\n### 变更\n\n- TODO\n\n### 修复\n\n- TODO\n\n`;
  const anchor = '\n## [';
  const at = changelog.indexOf(anchor);
  writeFileSync(clPath, changelog.slice(0, at + 1) + stub + changelog.slice(at + 1));
  console.log(`已在 CHANGELOG 顶部插入 ${version} 占位，记得把 TODO 换成真内容。\n`);
}

// 3. 界面产物：改过 CSS/JS 就必须重生成，否则文档里的图和产品对不上
run('node', ['scripts/make-demo.mjs']);
run('node', ['scripts/shots.mjs']);

// 4. 测试 + 打包
run('npm', ['test']);
run('npx', ['vsce', 'package', '--no-dependencies']);

if (!publish) {
  console.log(`
准备完成：personal-kb-${version}.vsix

接下来：
  1. 把 CHANGELOG.md 里 ${version} 的 TODO 补完
  2. 本地装一遍确认：
     "/Applications/Comate.app/Contents/Resources/app/bin/comate" --install-extension personal-kb-${version}.vsix --force
  3. 想直接发就跑：npm run ship:${kind}
     想走 CI 就提交并打 tag：
     git add -A && git commit -m "release: ${version}"
     git tag v${version} && git push && git push --tags
`);
  process.exit(0);
}

// 5. 真发版前的闸门：CHANGELOG 里这一版不许还留着 TODO
const finalLog = readFileSync(clPath, 'utf8');
const from = finalLog.indexOf(`## [${version}]`);
const next = finalLog.indexOf('\n## [', from + 1);
const section = finalLog.slice(from, next === -1 ? undefined : next);
if (/-\s*TODO/.test(section)) {
  console.error(`
CHANGELOG.md 里 ${version} 这一节还有 TODO 没填，不发。
填完再跑一次：npx vsce publish --no-dependencies
（版本号和包都已经就绪，不用重新 bump）
`);
  process.exit(1);
}

// 6. 发到 Marketplace。需要先 npx vsce login Rebekah 存一次 PAT
run('npx', ['vsce', 'publish', '--no-dependencies']);
console.log(`
已发布 ${version} 到 Marketplace，几分钟内生效：
  https://marketplace.visualstudio.com/items?itemName=Rebekah.personal-kb

别忘了把代码推上去，否则页面上的截图和在线 demo 还是旧的：
  git add -A && git commit -m "release: ${version}" && git push
`);

