// 用无头 Chrome 给 docs/demo 里的页面拍界面图，输出到 media/screenshots/。
// 不占屏幕、不碰其他窗口、尺寸可复现——比手动截屏可靠。
// 用法：node scripts/shots.mjs
import { execFileSync } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'media', 'screenshots');
mkdirSync(outDir, { recursive: true });

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if (!existsSync(CHROME)) {
  console.error('没找到 Chrome，改用 ./scripts/capture.sh shots 手动拍。');
  process.exit(1);
}

const SHOTS = [
  ['wall', 'docs/demo/index.html?bare=1', 1400, 940],
  ['detail', 'docs/demo/index.html?bare=1&open=1', 1400, 940],
  ['sidebar', 'docs/demo/sidebar.html?bare=1', 420, 900]
];

for (const [name, page, w, h] of SHOTS) {
  const out = join(outDir, `${name}.png`);
  execFileSync(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=2',
    '--virtual-time-budget=1500',
    `--window-size=${w},${h}`,
    `--screenshot=${out}`,
    `file://${join(root, page)}`
  ], { stdio: ['ignore', 'ignore', 'ignore'] });
  console.log(`wrote media/screenshots/${name}.png  (${w}×${h} @2x)`);
}
