const CACHE_NAME = 'gold-calculator-cache-v1';
const OFFLINE_URL = './offline.html';

const FILES_TO_CACHE = [
  './',
  './offline.html',
  './manifest.json',
  './Icons/Icon.png',
  './Icons/icon-192.png',
  './Icons/icon-512.png'
];

// Install – cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      for (const url of FILES_TO_CACHE) {
        try {
          const response = await fetch(url);
          if (response.ok) await cache.put(url, response);
        } catch (err) {
          // silently fail
        }
      }
    })()
  );
  self.skipWaiting();
});

// Fetch – network-first for pages, cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Offline fallback for navigations
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return await cache.match(OFFLINE_URL);
      })
    );
    return;
  }

  // Cache-first for static assets
  if (
    request.url.startsWith(self.location.origin) &&
    (request.url.endsWith('.png') ||
      request.url.endsWith('.jpg') ||
      request.url.endsWith('.jpeg') ||
      request.url.endsWith('.svg') ||
      request.url.endsWith('.css') ||
      request.url.endsWith('.js'))
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return response;
        }).catch(() => undefined);
      })
    );
  }
});

// Activate – delete old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)))
    )
  );
  self.clients.claim();
});
