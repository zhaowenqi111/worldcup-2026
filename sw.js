const CACHE = 'wc2026-v1';
const ASSETS = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Network-first for API, cache-first for assets
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.hostname === 'www.thesportsdb.com') {
    // API: network first, fallback to cache
    e.respondWith(
      fetch(e.request).then(r => {
        const clone = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return r;
      }).catch(() => caches.match(e.request))
    );
  } else {
    // Assets: cache first, fallback to network
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request))
    );
  }
});
