'use client';

/**
 * Utilitas Web Push & Native Device Notification untuk SI-TARUNA
 * Menampilkan notifikasi langsung di layar Homescreen / Lockscreen / OS
 * layaknya notifikasi aplikasi native (WhatsApp / Instagram).
 */

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

/**
 * Cek apakah browser mendukung Web Notification API & Service Worker
 */
export function isNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Ambil status izin notifikasi saat ini
 */
export function getNotificationPermission(): NotificationPermissionStatus {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission as NotificationPermissionStatus;
}

/**
 * Daftarkan Service Worker untuk menangani background push dan notifikasi klik
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isNotificationSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    console.log('✅ [Service Worker] Berhasil terdaftar dengan scope:', registration.scope);
    return registration;
  } catch (error) {
    console.warn('⚠️ [Service Worker] Gagal mendaftarkan service worker:', error);
    return null;
  }
}

/**
 * Minta izin kepada pengguna untuk menampilkan notifikasi di layar perangkat
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) {
    console.warn('⚠️ Browser tidak mendukung Web Notification API.');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Pastikan service worker sudah terdaftar
      await registerServiceWorker();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error saat meminta izin notifikasi:', error);
    return false;
  }
}

export interface ShowDeviceNotificationOptions {
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  renotify?: boolean;
}

/**
 * Munculkan notifikasi langsung ke Layar Perangkat (Homescreen / Action Center / Lockscreen)
 */
export async function showDeviceNotification(
  title: string,
  options: ShowDeviceNotificationOptions
): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  const iconUrl = options.icon || '/assets/logo.png';
  const badgeUrl = options.badge || '/assets/logo.png';
  const targetUrl = options.url || '/dashboard';
  const notifTag = options.tag || 'si-taruna-alert-' + Date.now();

  try {
    // 1. Coba lewat Service Worker (Standar PWA / Mobile Android / Desktop OS)
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, {
          body: options.body,
          icon: iconUrl,
          badge: badgeUrl,
          tag: notifTag,
          renotify: options.renotify ?? true,
          requireInteraction: true,
          // Pola getar smartphone (Vibrate) seperti WhatsApp
          // getar 200ms, jeda 100ms, getar 200ms
          vibrate: [200, 100, 200, 100, 200],
          data: {
            url: targetUrl,
          },
        } as any);
        return true;
      }
    }

    // 2. Fallback: Browser Native Notification API biasa
    const notification = new Notification(title, {
      body: options.body,
      icon: iconUrl,
      tag: notifTag,
    });

    notification.onclick = () => {
      window.focus();
      if (targetUrl) {
        window.location.href = targetUrl;
      }
      notification.close();
    };

    return true;
  } catch (error) {
    console.warn('⚠️ Gagal memunculkan notifikasi perangkat:', error);
    return false;
  }
}

/**
 * Uji coba kirim notifikasi contoh langsung ke layar pengguna
 */
export async function testDeviceNotification(): Promise<boolean> {
  const granted = await requestNotificationPermission();
  if (!granted) {
    return false;
  }

  return await showDeviceNotification('🔔 SI-TARUNA (Notifikasi Layar Aktif)', {
    body: 'Notifikasi berhasil terhubung! Anda akan menerima pembaruan kegiatan dan pengumuman langsung di layar perangkat Anda seperti WhatsApp.',
    url: '/dashboard/pengumuman',
    tag: 'si-taruna-test-notification',
  });
}
