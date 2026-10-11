/**
 * Generates the PNG app icons from the same shapes as public/icons/icon.svg.
 *
 * Run with `node scripts/gen-icons.mjs`; the PNGs it writes are committed, so
 * this only needs re-running when the icon design changes. Written by hand
 * against node:zlib so the repo needs no image-processing dependency.
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');

const BG = [0x0e, 0x11, 0x16];
const CYAN = [0x4c, 0xc9, 0xf0];
const PINK = [0xf7, 0x25, 0x85];

/** Anti-aliasing: sample each pixel on a 3x3 grid and average coverage. */
const SAMPLES = 3;

/**
 * Coverage of the icon artwork at a point in a 0..512 design space.
 * `cornerRadius` is 0 for maskable icons (the platform crops them itself).
 * Returns the colour at that point, or null for "background".
 */
function shapeAt(x, y, cornerRadius) {
  // Rounded-rect clip. Outside it, the pixel is fully transparent.
  if (cornerRadius > 0) {
    const dx = Math.max(cornerRadius - x, x - (512 - cornerRadius), 0);
    const dy = Math.max(cornerRadius - y, y - (512 - cornerRadius), 0);
    if (Math.hypot(dx, dy) > cornerRadius) return null;
  }

  const cx = x - 256;
  const cy = y - 256;
  const half = 14; // half of the 28px stroke width

  // Horizontal pink bar (drawn last in the SVG, so it wins).
  if (Math.abs(cy) <= half && Math.abs(cx) <= 98) return PINK;
  // Vertical cyan bar.
  if (Math.abs(cx) <= half && Math.abs(cy) <= 98) return CYAN;
  // Cyan ring, radius 132, stroke 28.
  const r = Math.hypot(cx, cy);
  if (Math.abs(r - 132) <= half) return CYAN;

  return BG;
}

function renderRGBA(size, { maskable = false } = {}) {
  const scale = 512 / size;
  const cornerRadius = maskable ? 0 : 96;
  const px = Buffer.alloc(size * size * 4);

  for (let py = 0; py < size; py++) {
    for (let pxX = 0; pxX < size; pxX++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      for (let sy = 0; sy < SAMPLES; sy++) {
        for (let sx = 0; sx < SAMPLES; sx++) {
          const dx = (pxX + (sx + 0.5) / SAMPLES) * scale;
          const dy = (py + (sy + 0.5) / SAMPLES) * scale;
          const c = shapeAt(dx, dy, cornerRadius);
          if (c) {
            r += c[0];
            g += c[1];
            b += c[2];
            a += 255;
          }
        }
      }

      const n = SAMPLES * SAMPLES;
      const i = (py * size + pxX) * 4;
      // Un-premultiply: colour is the average of the covered samples only.
      const covered = a / 255;
      px[i] = covered ? Math.round(r / covered) : 0;
      px[i + 1] = covered ? Math.round(g / covered) : 0;
      px[i + 2] = covered ? Math.round(b / covered) : 0;
      px[i + 3] = Math.round(a / n);
    }
  }

  return px;
}

function crc32(buf) {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePNG(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  // bytes 10-12: deflate / no filter / no interlace, all zero already.

  // One filter byte (0 = None) per scanline.
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    const dst = y * (size * 4 + 1);
    raw[dst] = 0;
    rgba.copy(raw, dst + 1, y * size * 4, (y + 1) * size * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(OUT_DIR, { recursive: true });

const targets = [
  ['icon-180.png', 180, {}], // apple-touch-icon
  ['icon-192.png', 192, {}],
  ['icon-512.png', 512, {}],
  ['icon-512-maskable.png', 512, { maskable: true }],
];

for (const [name, size, opts] of targets) {
  const png = encodePNG(size, renderRGBA(size, opts));
  writeFileSync(join(OUT_DIR, name), png);
  console.log(`${name.padEnd(24)} ${size}x${size}  ${(png.length / 1024).toFixed(1)} kB`);
}
