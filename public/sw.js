/*
 * Offline-ish caching. Deliberately tiny and hand-written — the alternative was
 * another build dependency for about 40 lines of logic.
 *
 * Rules:
 *   - Navigations (the HTML document) are network-first. A push always shows up
 *     on the next load; the cache is only a fallback when the network is gone.
 *   - Everything else same-origin is cache-first. Vite content-hashes asset
 *     filenames, so a cached asset is never a stale asset.
 *
 * Caveat: old hashed assets are not pruned, so the cache grows slowly across
 * many deploys. Harmless at prototype scale; bump CACHE below to clear it.
 */
const CACHE = 'onextra-v1';

self.addEventListener('install', () => {
  // Take over immediately rather than waiting for every tab to close.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          const cache = await caches.open(CACHE);
          await cache.put(request, response.clone());
          return response;
        } catch {
          const cached = await caches.match(request);
          return cached ?? Response.error();
        }
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) return cached;

      const response = await fetch(request);
      // Only cache clean, complete responses.
      if (response.ok && response.type === 'basic') {
        const cache = await caches.open(CACHE);
        await cache.put(request, response.clone());
      }
      return response;
    })(),
  );
});
