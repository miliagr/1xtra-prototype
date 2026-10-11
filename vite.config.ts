import { defineConfig } from 'vite';

// GitHub Pages serves this repo from /<repo-name>/, so CI passes VITE_BASE.
// Locally (and on any host serving from the domain root) '/' is correct.
const base = process.env.VITE_BASE ?? '/';

export default defineConfig({
  base,
  server: {
    // Exposed on the LAN so the founder can open the dev server on a real phone.
    host: true,
    port: 5173,
  },
  build: {
    target: 'es2022',
    // Phaser is ~1.2 MB minified on its own; the default 500 kB warning is noise here.
    // The real ceiling is enforced by `npm run budget` (see docs/perf-budget).
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
        },
      },
    },
  },
});
