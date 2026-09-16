/* Islamic World Pro — offline cache. © 2026 Aurevia Solution. All rights reserved. */
const CACHE = 'iwp-v3';
const SHELL = [
  '/', '/quran', '/hadith', '/azkar', '/duas', '/prayer-times', '/99-names-of-allah',
  '/assets/css/style.css', '/assets/css/islamic.css',
  '/assets/js/main.js', '/assets/js/iwp-core.js', '/assets/js/slide-tabs.js',
  '/assets/js/quran-meta.js', '/assets/js/quran-core.js', '/assets/js/quran-hub.js',
  '/assets/fonts/UthmanicHafs.woff2'
];

self.addEventListener('install', (ev) => {
  ev.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // let third-party audio/tafseer/API calls go straight to the network

  ev.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached || caches.match('/'));
      return cached || network;
    })
  );
});
