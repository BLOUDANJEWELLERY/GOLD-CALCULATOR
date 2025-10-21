const CACHE_NAME = 'single-page-cache-v1';
const OFFLINE_URL = '/offline.html';

const FILES_TO_CACHE = [
  '/index.html',
  '/offline.html',
  '/Icon-512.png',
  '/Icon.png',
  '/icon-192.png',
  '/Icons/Icon.png',
  '/Icons/icon-192.png',
  '/Icons/icon-512.png'
];

// Install – cache main page and offline fallback with detailed error logging
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker and caching assets...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of FILES_TO_CACHE) {
        try {
          const response = await fetch(url);
          if (!response.ok) {
            console.error(`[SW] ❌ Failed to fetch ${url}: ${response.status} ${response.statusText}`);
            continue;
          }
          await cache.put(url, response);
          console.log(`[SW] ✅ Cached successfully: ${url}`);
        } catch (err) {
          console.error(`[SW] ⚠️ Error caching ${url}:`, err);
        }
      }
    })
  );

  self.skipWaiting();
});

// Fetch – try network, fallback to offline page
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(OFFLINE_URL);
          return cachedResponse;
        })
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});

// Activate – cleanup old caches if version changes
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating new service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      )
    )
  );
  self.clients.claim();
});
