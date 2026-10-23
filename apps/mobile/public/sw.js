// Offline support for the installed web app. Hashed /assets/ files never change, so they are served cache-first;
// everything else in scope (index.html, content snapshot, icons) is network-first with the cache as the offline fallback.
const CACHE = 'psova-app-v1';
const scopePath = new URL(self.registration.scope).pathname;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(
  caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()),
));

function fetchAndCache(request) {
  return fetch(request).then((response) => {
    if (response.ok) { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(request, copy)); }
    return response;
  });
}

self.addEventListener('fetch', (event) => {
  const { request } = event; const url = new URL(request.url);
  // Only GETs for the app itself; API calls and the rest of the website go straight to the network.
  if (request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(scopePath)) return;
  if (url.pathname.startsWith(`${scopePath}assets/`)) event.respondWith(caches.match(request).then((hit) => hit || fetchAndCache(request)));
  else event.respondWith(fetchAndCache(request).catch(() => caches.match(request, { ignoreSearch: true }).then((hit) => hit || Response.error())));
});
