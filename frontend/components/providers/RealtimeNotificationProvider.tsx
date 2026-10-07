'use client';

import React, { useEffect, createContext, useContext, useState, useCallback } from 'react';
import { connectSocket } from '@/lib/socket';
import {
  registerServiceWorker,
  showDeviceNotification,
  getNotificationPermission,
  requestNotificationPermission,
  testDeviceNotification,
  NotificationPermissionStatus,
} from '@/lib/pushNotification';

export interface RealtimeNotificationEvent {
  id?: string;
  title: string;
  message: string;
  type?: string;
  link?: string | null;
  createdAt?: string;
}

interface NotificationContextValue {
  permission: NotificationPermissionStatus;
  requestPermission: () => Promise<boolean>;
  sendTestNotification: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextValue>({
  permission: 'default',
  requestPermission: async () => false,
  sendTestNotification: async () => false,
});

export const useDeviceNotification = () => useContext(NotificationContext);

export const RealtimeNotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [permission, setPermission] = useState<NotificationPermissionStatus>('default');

  // 1. Daftarkan Service Worker & cek permission saat komponen pertama kali dimuat
  useEffect(() => {
    registerServiceWorker();
    if (typeof window !== 'undefined') {
      const currentPerm = getNotificationPermission();
      setPermission(currentPerm);

      // Minta izin native notifikasi perangkat pada interaksi pertama jika belum pernah diminta
      if (currentPerm === 'default') {
        const handleFirstInteraction = () => {
          requestNotificationPermission().then(() => {
            setPermission(getNotificationPermission());
          });
          window.removeEventListener('click', handleFirstInteraction);
        };
        window.addEventListener('click', handleFirstInteraction, { once: true });
      }
    }
  }, []);

  const handleRequestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setPermission(getNotificationPermission());
    return granted;
  }, []);

  const handleSendTestNotification = useCallback(async () => {
    const success = await testDeviceNotification();
    setPermission(getNotificationPermission());
    return success;
  }, []);

  useEffect(() => {
    // 2. Hubungkan socket client
    const socket = connectSocket();

    // 3. Handler saat menerima notifikasi realtime baru dari server
    // Notifikasi HANYA berupa notifikasi mengambang di homescreen HP/Laptop/Device (OS native notification),
    // tanpa menampilkan kartu/toast/inbox di dalam layar aplikasi.
    const handleNewNotification = async (data: RealtimeNotificationEvent) => {
      console.log('🔔 [Device Notification Emitted]:', data);

      const title = data.title.startsWith('🔔') ? data.title : `🔔 ${data.title}`;

      // A. Munculkan Floating Native Notification di Homescreen / Lockscreen OS Perangkat
      try {
        await showDeviceNotification(title, {
          body: data.message,
          url: data.link || '/dashboard',
          tag: data.id || 'si-taruna-' + Date.now(),
        });
      } catch (err) {
        console.warn('Gagal memunculkan notifikasi perangkat:', err);
      }

      // B. Mainkan suara lonceng notifikasi perangkat (Web Audio API sintetis)
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
          osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start();
          osc.stop(ctx.currentTime + 0.4);
        }
      } catch {
        // Abaikan jika browser memblokir audio autoplay
      }
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        permission,
        requestPermission: handleRequestPermission,
        sendTestNotification: handleSendTestNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
