/**
 * Service worker registration.
 *
 * Production only — in dev it would just serve stale builds and waste your
 * afternoon. Open the preview URL with `?nosw=1` to unregister and wipe the
 * caches if you ever suspect you are looking at an old build.
 */
export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;

  const escapeHatch = new URLSearchParams(location.search).has('nosw');

  if (escapeHatch || import.meta.env.DEV) {
    void navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) void registration.unregister();
    });
    if (escapeHatch && 'caches' in window) {
      void caches.keys().then((keys) => keys.forEach((key) => void caches.delete(key)));
    }
    return;
  }

  window.addEventListener('load', () => {
    void navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .catch((error: unknown) => {
        // Offline caching is a nicety; never let it break the boot.
        console.warn('Service worker registration failed', error);
      });
  });
}
