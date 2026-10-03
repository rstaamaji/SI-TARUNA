'use client';

import React, { useEffect } from 'react';
import { connectSocket } from '@/lib/socket';
import { useToast } from '@/components/ui/Toast';

export interface RealtimeNotificationEvent {
  id?: string;
  title: string;
  message: string;
  type?: string;
  link?: string | null;
  createdAt?: string;
}

export const RealtimeNotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const toast = useToast();

  useEffect(() => {
    // 1. Hubungkan socket client
    const socket = connectSocket();

    // 2. Handler saat menerima notifikasi realtime baru dari server
    const handleNewNotification = (data: RealtimeNotificationEvent) => {
      console.log('🔔 [Realtime Notification Received]:', data);

      // Tampilkan toast notifikasi realtime
      const title = data.title.startsWith('🔔') ? data.title : `🔔 ${data.title}`;

      if (data.type === 'ATTENTION') {
        toast.warning(data.message, title);
      } else if (data.type === 'KERJA_BAKTI') {
        toast.success(data.message, title);
      } else {
        toast.info(data.message, title);
      }

      // Mainkan suara lonceng notifikasi (Web Audio API sintetis yang ringan & kompatibel)
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

      // Siarkan custom event ke window agar Navbar & Halaman Notifikasi langsung update tanpa refresh
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

  return <>{children}</>;
};
