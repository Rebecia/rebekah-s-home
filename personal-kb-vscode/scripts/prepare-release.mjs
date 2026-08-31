// 发版前的准备：改版本号、补 CHANGELOG 占位、重生成 demo 与截图、跑测试、打包。
// 用法：node scripts/prepare-release.mjs patch|minor|major
// 跑完人工检查 CHANGELOG，再 commit + 打 tag，CI 会负责真正 publish。
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const kind = process.argv[2] || 'patch';
if (!['patch', 'minor', 'major'].includes(kind)) {
  console.error('用法：node scripts/prepare-release.mjs patch|minor|major');
  process.exit(1);
}

const run = (cmd, args) => execFileSync(cmd, args, { cwd: root, stdio: 'inherit' });
const pkgPath = join(root, 'package.json');
const before = JSON.parse(readFileSync(pkgPath, 'utf8')).version;

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

console.log(`
准备完成：personal-kb-${version}.vsix

接下来：
  1. 把 CHANGELOG.md 里 ${version} 的 TODO 补完
  2. 本地装一遍确认：
     "/Applications/Comate.app/Contents/Resources/app/bin/comate" --install-extension personal-kb-${version}.vsix --force
  3. 提交并打 tag，CI 会自动发到 Marketplace：
     git add -A && git commit -m "release: ${version}"
     git tag v${version} && git push && git push --tags
`);
