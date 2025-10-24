const CACHE_NAME = 'gold-calculator-v5';
const FILES_TO_CACHE = [
  '/',                     // Main page
  '/index.html',           
  '/manifest.json',
  '/Icons/Icon.png',
  '/Icons/icon-192.png',
  '/Icons/icon-512.png',
  '/offline.html',         // optional fallback page
  // Optional: include CDN assets you want offline
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

// Activate – remove old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch – offline-first strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse; // serve cache if available

      return fetch(request)
        .then((networkResponse) => {
          // Cache only same-origin requests (optional)
          if (networkResponse && networkResponse.status === 200 && request.url.startsWith(self.location.origin)) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed – serve fallback HTML for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          // Optionally: return a default offline image or CSS if request fails
        })
    })
  );
});
