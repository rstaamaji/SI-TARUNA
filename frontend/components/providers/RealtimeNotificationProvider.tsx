'use client';

import React, { useEffect, createContext, useContext, useState, useCallback } from 'react';
import { connectSocket } from '@/lib/socket';
import { useToast } from '@/components/ui/Toast';
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
  const toast = useToast();
  const [permission, setPermission] = useState<NotificationPermissionStatus>('default');

  // 1. Daftarkan Service Worker & cek permission saat komponen pertama kali dimuat
  useEffect(() => {
    registerServiceWorker();
    if (typeof window !== 'undefined') {
      setPermission(getNotificationPermission());
    }
  }, []);

  const handleRequestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setPermission(getNotificationPermission());
    if (granted) {
      toast.success(
        'Notifikasi layar berhasil diaktifkan! Anda akan menerima update di HP/PC seperti WhatsApp.',
        'Notifikasi Layar Aktif'
      );
    } else {
      toast.warning(
        'Izin notifikasi tidak diberikan atau diblokir pada browser Anda.',
        'Izin Ditolak'
      );
    }
    return granted;
  }, [toast]);

  const handleSendTestNotification = useCallback(async () => {
    const success = await testDeviceNotification();
    setPermission(getNotificationPermission());
    if (success) {
      toast.info(
        'Notifikasi contoh telah dikirimkan ke layar perangkat Anda!',
        'Tes Notifikasi'
      );
    } else {
      toast.warning(
        'Pastikan izin notifikasi sudah diizinkan di browser Anda.',
        'Gagal Mengirim'
      );
    }
    return success;
  }, [toast]);

  useEffect(() => {
    // 2. Hubungkan socket client
    const socket = connectSocket();

    // 3. Handler saat menerima notifikasi realtime baru dari server
    const handleNewNotification = async (data: RealtimeNotificationEvent) => {
      console.log('🔔 [Realtime Notification Received]:', data);

      const title = data.title.startsWith('🔔') ? data.title : `🔔 ${data.title}`;

      // A. Tampilkan toast in-app
      if (data.type === 'ATTENTION') {
        toast.warning(data.message, title);
      } else if (data.type === 'KERJA_BAKTI') {
        toast.success(data.message, title);
      } else {
        toast.info(data.message, title);
      }

      // B. Tampilkan Push Notification Langsung ke Layar Homescreen / Lockscreen OS Pengguna
      try {
        await showDeviceNotification(title, {
          body: data.message,
          url: data.link || '/dashboard/pengumuman',
          tag: data.id || 'si-taruna-' + Date.now(),
        });
      } catch (err) {
        console.warn('Gagal memunculkan notifikasi perangkat:', err);
      }

      // C. Mainkan suara lonceng notifikasi (Web Audio API sintetis)
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

      // D. Siarkan custom event ke window
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('si_taruna_notification', {
            detail: data,
          })
        );
      }
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [toast]);

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
