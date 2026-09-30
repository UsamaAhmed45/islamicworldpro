/* Islamic World Pro — offline cache. © 2026 Aurevia Solution. All rights reserved.
   Pages: network-first (always fresh after a deploy, cached copy only when offline).
   Assets: stale-while-revalidate (fast, and refreshed in the background). */
const CACHE = 'iwp-v14';
const SHELL = [
  '/', '/quran', '/hadith', '/azkar', '/duas', '/prayer-times', '/99-names-of-allah',
  '/assets/css/style.css', '/assets/css/islamic.css', '/assets/css/polish.css',
  '/assets/js/main.js', '/assets/js/polish.js', '/assets/js/iwp-core.js', '/assets/js/slide-tabs.js',
  '/assets/js/quran-meta.js', '/assets/js/quran-core.js', '/assets/js/quran-hub.js', '/assets/js/quran-plus.js',
  '/assets/fonts/UthmanicHafs.woff2'
];

self.addEventListener('install', (ev) => {
  ev.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window' }))
      // Pages that were opened from an old cache reload once to show the new version.
      .then((clients) => clients.forEach((c) => c.postMessage({ type: 'iwp-sw-updated' })))
  );
});

function put(req, res) {
  if (res && res.status === 200 && res.type === 'basic') {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copy));
  }
  return res;
}

self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // third-party audio/tafseer/API calls go straight to the network

  // HTML pages: network first, fall back to cache when offline
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    ev.respondWith(
      fetch(req).then((res) => put(req, res))
        .catch(() => caches.match(req).then((c) => c || caches.match('/')))
    );
    return;
  }

  // Everything else: serve cached copy instantly, refresh it in the background
  ev.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => put(req, res)).catch(() => cached);
      return cached || network;
    })
  );
});
