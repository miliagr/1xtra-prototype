# 1xtra prototype

Casual mobile-web game prototype. TypeScript + Phaser 3, built with Vite,
deployed to GitHub Pages on every push to `main`.

**Live:** https://miliagr.github.io/1xtra-prototype/

Open it on a phone. Portrait. Tap the circle.

## Run it locally

```bash
npm install && npm run dev
```

That's the whole thing. Vite prints a LAN address alongside `localhost` — open
that one on your phone (same Wi-Fi) to test touch on real hardware while you
work.

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server with hot reload, exposed on the LAN |
| `npm run build` | Typecheck, then production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | `tsc --noEmit`, strict |
| `npm run budget` | Check `dist/` against the perf budget |
| `npm run check` | All of the above, the same gate CI runs |

Node 22 (see `.nvmrc`).

## Layout

```
index.html              viewport meta, PWA tags
src/
  main.ts               game config, scale mode, input
  viewport.ts           safe-area insets, browser-gesture suppression
  pwa.ts                service worker registration
  styles.css            the mobile shell
  scenes/BootScene.ts   pipeline proof: a shape that reacts to a tap
  dev/fpsMeter.ts       on-device FPS readout (?fps=1)
public/                 copied verbatim: manifest, icons, sw.js
scripts/                budget checker, icon generator
docs/                   mobile shell, native path, device test log
perf-budget.json        the ceilings CI enforces
```

Gameplay goes in new scenes under `src/scenes/`. Read
[docs/mobile-shell.md](docs/mobile-shell.md) before touching scaling, safe
areas or touch handling — there are reasons behind the current setup, and a
couple of them are not obvious.

## Perf budget

Enforced by `npm run budget`, and by CI on every push and pull request. A build
that breaches a ceiling fails. The numbers live in
[`perf-budget.json`](perf-budget.json).

| Budget | Ceiling | Currently |
| --- | --- | --- |
| First-load total, gzipped | 420 kB | 327 kB |
| First-load JS, gzipped | 400 kB | 326 kB |
| First-load CSS, gzipped | 15 kB | 0.3 kB |
| Largest code asset, gzipped | 345 kB | 323 kB (Phaser) |
| Runtime assets, raw | 1500 kB | 0 kB |
| Largest runtime asset, raw | 400 kB | 0 kB |
| First load on slow 4G | < 3.0s | ~1.9s (transfer) |
| Frame rate, mid-range phone | 60fps, never below 55 | not yet measured on device |

Three things worth knowing about these numbers:

- **Phaser 3.90 is 323 kB gzipped by itself**, which is 94% of the
  largest-asset ceiling and most of the total. That is the floor; the ~75 kB of
  JS headroom above it is the game's to spend. If we ever need more, the lever
  is a custom Phaser build with unused subsystems stripped, not a bigger
  ceiling.
- **Runtime assets** — sprites and audio — are budgeted separately because they
  load after first paint. They cost loading-screen time, not time-to-first-frame.
- **The frame rate target is not machine-checkable.** It is verified by hand on
  real hardware and recorded in
  [docs/device-test-log.md](docs/device-test-log.md), which currently has no
  rows in it. Treat the fps and cold-load figures as predicted until it does.

One measurement caveat: the budget checker compresses at gzip level 9, while
GitHub Pages serves at a lower level. The Phaser chunk measures 322.7 kB here
and arrives as 325.9 kB on the wire — about 1% more. The numbers are consistent
for tracking growth, just don't read the last kilobyte as gospel.

Raising a ceiling is a deliberate decision. Say why in the commit message.

## Deploys

Every push to `main` runs typecheck → build → perf budget, and publishes to the
URL above if all three pass. There is no per-PR preview URL: GitHub Pages hosts
one site per repo. Pull requests still get the full check, just not a
deployment.

**If your phone still shows the old build**, it is almost certainly one of two
caches. GitHub Pages sends `cache-control: max-age=600`, so the HTML can be up
to 10 minutes stale on a device that already loaded it. Our own service worker
is network-first and shouldn't be the culprit, but to rule both out at once,
load the URL with `?nosw=1`.

Hosting is GitHub Pages on the free tier — no paid infrastructure, no accounts
beyond the GitHub one that already existed. **The repo is public**, because
Pages on a private repo requires a paid GitHub plan. There is nothing sensitive
in here today; if that changes, the move is to Netlify's free tier, which
serves private repos and gives per-PR preview URLs as a bonus.

## Native

This is mobile web, not native, and nothing here is being submitted to an app
store. The Capacitor wrap path is kept open and written down in
[docs/native-path.md](docs/native-path.md).

## Dependencies

Deliberately short, and meant to stay that way:

- `phaser` — the engine
- `vite`, `typescript`, `@types/node` — the build

Everything else in here is hand-written to avoid a dependency: the service
worker, the icon generator, the budget checker. Flag new dependencies before
adding them.
