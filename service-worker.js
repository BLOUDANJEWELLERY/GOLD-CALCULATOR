const CACHE_NAME = 'gold-calculator-v6';
const OFFLINE_URL = './offline.html';

const FILES_TO_CACHE = [
  './',
  './index.html',
  './offline.html',
  './manifest.json',
  './Icons/Icon.png',
  './Icons/icon-192.png',
  './Icons/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Install – pre-cache all core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      for (const url of FILES_TO_CACHE) {
        try {
          const response = await fetch(url);
          if (response.ok) await cache.put(url, response.clone());
        } catch (err) {
          // ignore failures
        }
      }
    })()
  );
  self.skipWaiting();
});

// Activate – clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch – network first, fallback to cached index + fonts, else offline
self.addEventListener('fetch', (event) => {
  const { request } = event;

  event.respondWith(
    (async () => {
      try {
        // Try network first
        const networkResponse = await fetch(request);
        // Cache same-origin requests
        if (networkResponse && networkResponse.status === 200 && request.url.startsWith(self.location.origin)) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (err) {
        // Network failed
        const cache = await caches.open(CACHE_NAME);

        // Check if index.html + fonts are cached
        const indexCached = await cache.match('./index.html');
        const fontAwesomeCached = await cache.match('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css');
        const googleFontCached = await cache.match('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        if (indexCached && fontAwesomeCached && googleFontCached) {
          return indexCached; // Serve cached index.html if all fonts are available
        }

        // Fallback to offline page
        const offlineFallback = await cache.match(OFFLINE_URL);
        return offlineFallback;
      }
    })()
  );
});
