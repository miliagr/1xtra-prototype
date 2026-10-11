/**
 * Enforces the perf budget in perf-budget.json against the built dist/.
 *
 * Run `npm run budget` after a build, or let CI do it on every push. Exits
 * non-zero when a ceiling is breached, printing what went over and by how much.
 *
 * First-load code is measured gzipped, because that is what the wire actually
 * carries — GitHub Pages, Netlify and Vercel all serve it compressed. Images
 * and audio are measured raw, since those formats are already compressed.
 */
import { gzipSync } from 'node:zlib';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

const budget = JSON.parse(readFileSync(join(ROOT, 'perf-budget.json'), 'utf8'));

/** On the critical path to the first frame. */
const FIRST_LOAD_EXTENSIONS = new Set(['.js', '.css', '.html', '.woff2', '.woff']);
/** Loaded by the game after boot — sprites, audio, atlases. */
const RUNTIME_ASSET_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.avif',
  '.mp3',
  '.ogg',
  '.m4a',
  '.wav',
]);
/** App icons ship in dist/icons/ but are never on a gameplay load path. */
const EXCLUDED_PREFIXES = ['icons/'];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

let files;
try {
  files = walk(DIST);
} catch {
  console.error('No dist/ found. Run `npm run build` first.');
  process.exit(1);
}

const measured = files
  .map((file) => {
    const path = relative(DIST, file);
    const ext = extname(file).toLowerCase();
    const raw = readFileSync(file);
    return { path, ext, raw };
  })
  .filter((asset) => !EXCLUDED_PREFIXES.some((prefix) => asset.path.startsWith(prefix)));

const firstLoad = measured
  .filter((asset) => FIRST_LOAD_EXTENSIONS.has(asset.ext))
  .map((asset) => ({
    path: asset.path,
    ext: asset.ext,
    rawKB: asset.raw.length / 1024,
    sizeKB: gzipSync(asset.raw, { level: 9 }).length / 1024,
  }))
  .sort((a, b) => b.sizeKB - a.sizeKB);

const runtimeAssets = measured
  .filter((asset) => RUNTIME_ASSET_EXTENSIONS.has(asset.ext))
  .map((asset) => ({ path: asset.path, ext: asset.ext, sizeKB: asset.raw.length / 1024 }))
  .sort((a, b) => b.sizeKB - a.sizeKB);

const sum = (list) => list.reduce((total, asset) => total + asset.sizeKB, 0);
const kb = (n) => `${n.toFixed(1)} kB`;

const firstLoadTotal = sum(firstLoad);
const code = budget.firstLoadGzipKB;
const art = budget.runtimeAssetsKB;

const checks = [
  ['first-load total', firstLoadTotal, code.totalTransfer],
  ['first-load js', sum(firstLoad.filter((a) => a.ext === '.js')), code.javascript],
  ['first-load css', sum(firstLoad.filter((a) => a.ext === '.css')), code.css],
  ['largest code asset', firstLoad[0]?.sizeKB ?? 0, code.largestSingleAsset],
  ['runtime assets total', sum(runtimeAssets), art.total],
  ['largest runtime asset', runtimeAssets[0]?.sizeKB ?? 0, art.largestSingleAsset],
];

console.log('\nFirst-load code (gzipped):\n');
for (const asset of firstLoad) {
  console.log(`  ${kb(asset.sizeKB).padStart(9)}  ${asset.path}  (${kb(asset.rawKB)} raw)`);
}

console.log(`\nRuntime assets (raw):\n`);
if (runtimeAssets.length === 0) {
  console.log('  (none yet)');
} else {
  for (const asset of runtimeAssets) {
    console.log(`  ${kb(asset.sizeKB).padStart(9)}  ${asset.path}`);
  }
}

console.log('\nBudget:\n');
let failed = false;
for (const [name, actual, ceiling] of checks) {
  const ok = actual <= ceiling;
  if (!ok) failed = true;
  const headroom = ceiling - actual;
  const pct = ((actual / ceiling) * 100).toFixed(0);
  console.log(
    `  ${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(22)} ${kb(actual).padStart(9)} / ${kb(
      ceiling,
    ).padStart(9)}  ${String(pct).padStart(3)}%  ${
      headroom >= 0 ? `${kb(headroom)} headroom` : `${kb(-headroom)} OVER`
    }`,
  );
}

const { targetSeconds, slow4gKilobytesPerSecond } = budget.firstLoad;
const estimatedSeconds = firstLoadTotal / slow4gKilobytesPerSecond;
const loadOk = estimatedSeconds <= targetSeconds;
if (!loadOk) failed = true;
console.log(
  `  ${loadOk ? 'PASS' : 'FAIL'}  ${'est. first load on 4G'.padEnd(22)} ${estimatedSeconds.toFixed(
    2,
  )}s / ${targetSeconds.toFixed(2)}s  (transfer only; excludes RTT and JS parse)`,
);

console.log(
  `\n  ${budget.runtime.targetFps}fps on mid-range hardware is verified on device, not here —` +
    ` see docs/device-test-log.md.\n`,
);

if (failed) {
  console.error('Perf budget exceeded. Trim it, or raise the ceiling deliberately.\n');
  process.exit(1);
}

console.log('Perf budget OK.\n');
