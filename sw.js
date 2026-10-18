const CACHE_NAME = 'my-progress-neon-v9';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './pushups.svg', './pullups.svg'];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(ASSETS.map(async asset => { try { await cache.add(asset); } catch (error) { console.warn('Не удалось кешировать ресурс:', asset, error); } }));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('my-progress-') && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(event.request);
    if (cached) {
      if (event.request.mode === 'navigate') event.waitUntil(fetch(event.request).then(response => { if (response.ok) cache.put('./index.html', response.clone()); }).catch(() => {}));
      return cached;
    }
    try {
      const response = await fetch(event.request);
      if (response.ok && new URL(event.request.url).origin === self.location.origin) cache.put(event.request, response.clone());
      return response;
    } catch (error) {
      if (event.request.mode === 'navigate') return (await cache.match('./index.html')) || Response.error();
      return Response.error();
    }
  })());
});
