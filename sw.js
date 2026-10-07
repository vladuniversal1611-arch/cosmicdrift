// Offline cache for the web/PWA build. Bump CACHE whenever any listed file changes.
const CACHE = 'hillrush-v6';
const ASSETS = ['./hill_rush.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // ignoreSearch so ?adtest=1 and similar still load offline
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(cached => cached || fetch(e.request)));
});
