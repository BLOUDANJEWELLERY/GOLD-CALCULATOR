const CACHE_NAME = 'gold-calculator-v4';
const FILES_TO_CACHE = [
  './',
  './index.html',
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
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// Fetch – network first, fallback to cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If we got a valid response, update the cache
        if (networkResponse && networkResponse.status === 200) {
          const clonedResponse = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clonedResponse));
        }
        return networkResponse;
      })
      .catch(() => {
        // Network failed, use cache
        return caches.match(event.request).then((cachedResponse) => {
          // If cached, return it; otherwise, return the main page as fallback
          return cachedResponse || caches.match('./index.html');
        });
      })
  );
});

// Activate – remove old cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});