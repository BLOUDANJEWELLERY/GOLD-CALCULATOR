const CACHE_NAME = 'single-page-cache-v1';
const OFFLINE_URL = '/offline.html';

const FILES_TO_CACHE = [
  './index.html',
  './offline.html',
  './Icon-512.png',
  './Icon.png',
  './icon-192.png',
  './Icons/Icon.png',
  './Icons/icon-192.png',
  './Icons/icon-512.png'
];

// Install – cache main page and offline fallback
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of FILES_TO_CACHE) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            await cache.put(url, response);
          }
        } catch (_) {}
      }
    })
  );
  self.skipWaiting();
});

// Fetch – try network, fallback to offline page
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return await cache.match(OFFLINE_URL);
      })
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((response) => response || fetch(event.request))
    );
  }
});

// Activate – cleanup old caches if version changes
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});
