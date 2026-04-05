/**
 * FinTrack Pro — Service Worker v3.0
 * Cache-first for static assets, network-first for CDN resources
 */
const CACHE     = 'fintrack-v3';
const STATIC    = [
  './',
  './index.html',
  './css/style.css',
  './js/storage.js',
  './js/utils.js',
  './js/charts.js',
  './js/transactions.js',
  './js/budget.js',
  './js/goals.js',
  './js/loans.js',
  './js/reports.js',
  './js/app.js',
  './manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(STATIC))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // CDN resources: network first, fallback to cache
  if (url.hostname.includes('cdn.jsdelivr') || url.hostname.includes('fonts.g')) {
    e.respondWith(
      fetch(e.request)
        .then(r => { const c = r.clone(); caches.open(CACHE).then(cache => cache.put(e.request, c)); return r; })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Local assets: cache first
  e.respondWith(
    caches.match(e.request)
      .then(cached => cached || fetch(e.request)
        .then(r => { const c = r.clone(); caches.open(CACHE).then(cache => cache.put(e.request, c)); return r; })
      )
  );
});
