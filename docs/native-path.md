# Native path (iOS / Android)

**Status: documented, not built.** Nothing in this repo depends on Capacitor
today. This note exists so the native path stays unblocked — read it before
making a decision that would close it off.

## Why it stays open

The game is a static web build: `dist/` is plain HTML, JS and assets with no
server. That is exactly what Capacitor wraps. Wrapping is a day of work
whenever we decide we want it, not a rewrite.

## What it would take

```bash
npm i -D @capacitor/cli
npm i @capacitor/core
npx cap init "1xtra" com.onextra.prototype --web-dir=dist

npm i @capacitor/ios @capacitor/android
npm run build
npx cap add ios
npx cap add android
npx cap sync
npx cap open ios      # needs Xcode
npx cap open android  # needs Android Studio
```

`ios/` and `android/` are already in `.gitignore` — they are generated, and
regenerating them from `capacitor.config.ts` is cleaner than maintaining them
by hand.

## Things to not break in the meantime

These are the only decisions that would actually cost us later:

1. **Keep the build relative-path-safe.** Capacitor serves from a local file
   scheme, so absolute `/asset.png` paths break. `vite.config.ts` already
   drives the base path from `VITE_BASE`; a Capacitor build would use
   `VITE_BASE=./`. Don't hardcode leading-slash URLs anywhere.
2. **No server-side anything.** The moment the game needs a backend, the wrap
   stops being free. Keep state client-side until that is a deliberate call.
3. **Keep the safe-area handling.** It is the same `env(safe-area-inset-*)`
   mechanism inside a Capacitor WebView, so the work already done carries over
   unchanged.
4. **Don't depend on browser-only APIs** without a fallback — service workers
   in particular are a no-op under Capacitor. `src/pwa.ts` already fails soft.

## What we would owe the founder before shipping native

Both of these need the founder, not an engineer:

- An **Apple Developer account** ($99/yr) and a **Google Play developer
  account** ($25 one-off). Neither exists yet, and neither should be created
  without the founder deciding to.
- A **bundle identifier / store identity** — `com.onextra.prototype` above is a
  placeholder, not a reservation.

No app-store submission is in scope on this push.
