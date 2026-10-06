// Service Worker for SI-TARUNA Push Notifications
const CACHE_NAME = 'si-taruna-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Event saat menerima push notification dari Web Push server
self.addEventListener('push', (event) => {
  let data = {
    title: '🔔 Pemberitahuan Baru - SI-TARUNA',
    message: 'Ada informasi terbaru untuk Karang Taruna Tuk Uluh.',
    url: '/dashboard',
    icon: '/assets/logo.png',
    badge: '/assets/logo.png',
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch {
      data.message = event.data.text();
    }
  }

  const options = {
    body: data.message,
    icon: data.icon || '/assets/logo.png',
    badge: data.badge || '/assets/logo.png',
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: data.url || data.link || '/dashboard',
    },
    tag: data.id || 'si-taruna-notification',
    renotify: true,
    requireInteraction: true,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Event saat pengguna mengklik notifikasi di layar HP / Desktop
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
