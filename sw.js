const CACHE_NAME = 'mathrank-v12';
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

// 네트워크가 되는 동안은 항상 최신 파일을 받아오고(그래야 배포한 수정사항이 바로 반영됨),
// 오프라인일 때만 캐시로 대체한다. (예전엔 캐시를 먼저 써서 수정해도 반영이 안 됐음)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request, { cache: 'no-cache' })
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
