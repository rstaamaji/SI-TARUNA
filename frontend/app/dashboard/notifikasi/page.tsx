'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotifikasiPage() {
  const router = useRouter();

  useEffect(() => {
    // Pengguna tidak membutuhkan tampilan modul notifikasi di dalam sistem;
    // diarahkan langsung ke Dashboard.
    router.replace('/dashboard');
  }, [router]);

  return null;
}
