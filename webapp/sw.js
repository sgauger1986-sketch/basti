/* mexXsoft X2 Cloud — Service Worker
 * Strategie:
 *  - App-Hülle (HTML/JS/Icons/Seed) wird beim Installieren zwischengespeichert → App startet auch komplett offline.
 *  - Statische Dateien: Cache zuerst, im Hintergrund aktualisieren (stale-while-revalidate).
 *  - /api/… wird NIE gecacht — Synchronisation läuft immer gegen den Server.
 */
const VERSION = 'x2cloud-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './js/db.js',
  './js/sync.js',
  './js/app.js',
  './data/seed.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;               // Sync-POSTs immer ans Netz
  if (url.pathname.includes('/api/')) return;           // API nie cachen
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(cached => {
      const fetched = fetch(e.request).then(res => {
        if (res && res.ok && url.origin === location.origin) {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});
