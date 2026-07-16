/* ============================================================
   SERVICE WORKER — офлайн-режим (PWA)
   Кеш-перший підхід: гра повністю працює без інтернету.
   При оновленні гри підніміть версію CACHE.
   ============================================================ */
const CACHE = 'block-kingdom-v2';
const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/style.css',
  'js/i18n.js',
  'js/storage.js',
  'js/audio.js',
  'js/ads.js',
  'js/notify.js',
  'js/shapes.js',
  'js/levels.js',
  'js/particles.js',
  'js/board.js',
  'js/game.js',
  'js/meta.js',
  'js/ui.js',
  'js/main.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // сторонні запити (реклама) — повз кеш
  e.respondWith(
    caches.match(e.request).then((hit) => {
      if (hit) return hit;
      return fetch(e.request).then((res) => {
        // Кладемо в кеш лише успішні відповіді
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, copy));
        }
        return res;
      });
    })
  );
});
