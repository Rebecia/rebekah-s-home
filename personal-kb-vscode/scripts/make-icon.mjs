// 生成 media/logo.png（上架用图标，256×256）。
// 不引三方依赖：手写 PNG 编码 + zlib deflate，颜色取自 media/theme.css 的 token。
// 用法：node scripts/make-icon.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SIZE = 256;
const RADIUS = 58;
const DARK = [0x15, 0x17, 0x1b];
const AMBER = [0xe2, 0x90, 0x0f];
const PAPER = [0xf4, 0xf5, 0xf6];
const SS = 3; // 每边超采样次数，用来做抗锯齿

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/* 圆角方形：点在内部返回 true */
function inRounded(x, y) {
  const dx = Math.max(RADIUS - x, x - (SIZE - RADIUS), 0);
  const dy = Math.max(RADIUS - y, y - (SIZE - RADIUS), 0);
  return dx * dx + dy * dy <= RADIUS * RADIUS;
}

/* 圆角矩形，用来画「卡片」 */
function inRect(x, y, x0, y0, x1, y1, r) {
  const dx = Math.max(x0 + r - x, x - (x1 - r), 0);
  const dy = Math.max(y0 + r - y, y - (y1 - r), 0);
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  return dx * dx + dy * dy <= r * r;
}

/* 菱形（品牌标记 ◆）：曼哈顿距离 */
function inDiamond(x, y, cx, cy, r) {
  return Math.abs(x - cx) + Math.abs(y - cy) <= r;
}

function coverage(px, py, test) {
  let hit = 0;
  for (let i = 0; i < SS; i++) {
    for (let j = 0; j < SS; j++) {
      if (test(px + (i + 0.5) / SS, py + (j + 0.5) / SS)) hit++;
    }
  }
  return hit / (SS * SS);
}

function over(dst, src, a) {
  return [0, 1, 2].map(i => Math.round(src[i] * a + dst[i] * (1 - a)));
}

const raw = Buffer.alloc((SIZE * 4 + 1) * SIZE);
let p = 0;
for (let y = 0; y < SIZE; y++) {
  raw[p++] = 0; // filter: none
  for (let x = 0; x < SIZE; x++) {
    const aShape = coverage(x, y, inRounded);
    let rgb = DARK;
    // 后面压着的一张卡，制造卡片堆
    rgb = over(rgb, PAPER, coverage(x, y, (u, v) => inRect(u, v, 74, 52, 208, 168, 16)) * 0.26);
    // 前面的主卡
    rgb = over(rgb, PAPER, coverage(x, y, (u, v) => inRect(u, v, 48, 78, 182, 214, 18)) * 0.97);
    // 卡上的琥珀菱形 + 两条正文线
    rgb = over(rgb, AMBER, coverage(x, y, (u, v) => inDiamond(u, v, 115, 126, 26)));
    rgb = over(rgb, DARK, coverage(x, y, (u, v) => inRect(u, v, 74, 168, 156, 178, 5)) * 0.22);
    rgb = over(rgb, DARK, coverage(x, y, (u, v) => inRect(u, v, 74, 188, 126, 198, 5)) * 0.14);
    raw[p++] = rgb[0];
    raw[p++] = rgb[1];
    raw[p++] = rgb[2];
    raw[p++] = Math.round(aShape * 255);
  }
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8;  // bit depth
ihdr[9] = 6;  // truecolor + alpha
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0))
]);

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'media', 'logo.png');
writeFileSync(out, png);
console.log(`wrote ${out} (${png.length} bytes)`);
