const CACHE_NAME = 'mathrank-v5';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './assets/mascot.jpg',
  './assets/logo.jpg',
  './assets/npc_owl.jpg',
  './assets/npc_fox.jpg',
  './assets/char_correct.jpg',
  './assets/char_wrong.jpg',
  './assets/badge_candy.jpg',
  './assets/badge_twinkle.jpg',
  './assets/badge_shining.jpg',
  './assets/badge_shooting.jpg',
  './assets/badge_galaxy.jpg',
  './assets/badge_supernova.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return res;
        })
        .catch(() => cached);
    })
  );
});
