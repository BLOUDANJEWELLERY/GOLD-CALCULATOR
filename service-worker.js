]const CACHE_NAME = 'gold-calculator-offline-v1';
const FILES_TO_CACHE = [
  '/', 
  '/index.html', 
  '/offline.html', 
  '/manifest.json',
  '/Icons/Icon.png', 
  '/Icons/icon-192.png', 
  '/Icons/icon-512.png'
];

// Optional: URLs for external assets you want offline
const EXTERNAL_FILES = [
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Install – pre-cache everything
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(FILES_TO_CACHE);
      // Optional: fetch external assets and cache them
      for (const url of EXTERNAL_FILES) {
        try {
          const response = await fetch(url);
          if (response.ok) await cache.put(url, response.clone());
        } catch (err) {
          console.warn('[SW] External asset failed to cache:', url);
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

// Fetch – offline-first with fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && request.url.startsWith(self.location.origin)) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallbacks
          if (request.mode === 'navigate') {
            return caches.match('/offline.html'); // show offline page for HTML
          }
          if (request.destination === 'image') {
            return '/Icons/Icon.png'; // optional default image
          }
        })
    })
  );
});
