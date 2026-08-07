// Minimal offline support: network-first for navigations and API GETs, with a
// cache fallback so pages and data you've already loaded once still render
// when the connection drops. Nothing is precached — the cache fills in as you browse.
const CACHE = 'slipbook-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  const data = event.data.json();

  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/pwa-icon?size=192',
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      const existing = clients.find((client) => client.url.includes('/admin'));

      if (existing) {
        return existing.focus();
      }

      return self.clients.openWindow('/admin?tab=manage');
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (url.pathname.startsWith('/api/admin')) {
    return; // never cache admin-authenticated responses
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || Response.error()))
  );
});
