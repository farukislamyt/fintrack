/**
 * FinTrack Pro — Service Worker v1.0
 * Offline-first caching strategy with network-aware updates.
 *
 * Strategy:
 *  - App shell (HTML, CSS, JS): Cache-first with network fallback
 *  - Fonts / CDN assets: Stale-while-revalidate
 *  - Charts.js: Cache-first
 *  - Dynamic data: Network-first (localStorage is source of truth)
 */

const CACHE_NAME = 'fintrack-pro-v3.0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/storage.js',
  './js/utils.js',
  './js/charts.js',
  './js/transactions.js',
  './js/budget.js',
  './js/goals.js',
  './js/reports.js',
  './js/app.js',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
];

const CDN_ASSETS = [
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap',
];

// ── Install: Pre-cache app shell ──────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Pre-cache failed:', err))
  );
});

// ── Activate: Clean up old caches ─────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME && key.startsWith('fintrack-pro-'))
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: Serve from cache or network ────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests (POST, PUT, etc.)
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) return;

  // CDN fonts/assets: Stale-while-revalidate
  if (CDN_ASSETS.some(cdn => event.request.url.startsWith(cdn)) ||
      url.hostname === 'fonts.googleapis.com' ||
      url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  // App shell assets: Cache-first, network fallback
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Everything else: Network-first, cache fallback
  event.respondWith(networkFirst(event.request));
});

// ── Caching strategies ────────────────────────────────────────
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Return offline fallback for navigation requests
    if (request.mode === 'navigate') {
      const offline = await caches.match('./index.html');
      if (offline) return offline;
    }
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}