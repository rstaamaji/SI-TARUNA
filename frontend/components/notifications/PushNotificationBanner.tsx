'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Smartphone, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useDeviceNotification } from '@/components/providers/RealtimeNotificationProvider';

export const PushNotificationBanner: React.FC = () => {
  const { permission, requestPermission } = useDeviceNotification();
  const [isDismissed, setIsDismissed] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const dismissed = localStorage.getItem('si_taruna_dismiss_notif_banner');
    if (!dismissed && permission !== 'granted' && permission !== 'unsupported') {
      setIsDismissed(false);
    }
  }, [permission]);

  if (!mounted || isDismissed) return null;

  // Jika sudah diizinkan, sembunyikan banner
  if (permission === 'granted') return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('si_taruna_dismiss_notif_banner', 'true');
  };

  const handleActivate = async () => {
    setIsLoading(true);
    try {
      const granted = await requestPermission();
      if (granted) {
        setIsDismissed(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-6 relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-4 sm:p-5 shadow-lg border border-blue-400/30 animate-in fade-in slide-in-from-top-4 duration-300">
      {/* Background glow ornament */}
      <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/25 shadow-inner">
            <Smartphone className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm sm:text-base text-white">
                Aktifkan Notifikasi Layar (Homescreen)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-amber-950">
                Seperti WhatsApp
              </span>
            </div>
            <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-xl leading-relaxed">
              Dapatkan pemberitahuan kegiatan warga &amp; pengumuman mendesak langsung muncul di layar HP atau komputer Anda bahkan saat aplikasi sedang ditutup.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <Button
            size="sm"
            onClick={handleActivate}
            disabled={isLoading}
            className="bg-white text-blue-700 hover:bg-blue-50 font-bold shadow-md border-0 text-xs px-3.5 py-2"
          >
            <Bell className="w-3.5 h-3.5 mr-1.5" />
            {isLoading ? 'Mengaktifkan...' : 'Aktifkan Sekarang'}
          </Button>
          <button
            onClick={handleDismiss}
            aria-label="Tutup Banner"
            className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
