const CACHE_NAME = 'bombardilo-v1';
const assets = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './img/buaya.png',
  './img/buaya1.png',
  './img/buaya2.png',
  './img/buaya3.png',
  './img/buaya4.png',
  './img/awan.png',
  './img/pelangi.png',
  './img/Petir.png',
  './music/backsound.wav'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
