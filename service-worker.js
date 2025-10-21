const CACHE_NAME = 'single-page-cache-v1';
const OFFLINE_URL = '/offline.html';

// Install – cache the main page and offline fallback
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/index.html',
        '/offline.html',
        '/Icon-512.png',
        '/Icon.png',
        '/icon-192.png',
        '/Icons/Icon.png',
        '/Icons/icon-192.png',
        '/Icons/icon-512.png'
      ]);
    })
  );
  self.skipWaiting();
});

// Fetch – try network, fallback to offline page
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((response) => response || fetch(event.request))
    );
  }
});
