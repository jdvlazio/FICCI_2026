// FICCI 65 — Service Worker
// Cache strategy: Cache First para assets estáticos, Network First para HTML

const CACHE_NAME = 'otrofestiv-v1';
const STATIC_ASSETS = [
  '/FICCI_2026/',
  '/FICCI_2026/index.html',
];

// Instalar y pre-cachear assets esenciales
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activar y limpiar caches viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: Network First para HTML (siempre fresco), Cache First para el resto
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo interceptar requests del mismo origen
  if (url.origin !== location.origin) return;

  // HTML → Network First (actualiza la app cuando hay conexión)
  if (request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Resto → Cache First
  event.respondWith(
    caches.match(request)
      .then(cached => cached || fetch(request))
  );
});
