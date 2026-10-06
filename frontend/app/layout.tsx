import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { RealtimeNotificationProvider } from '@/components/providers/RealtimeNotificationProvider';
import { OrganizationProvider } from '@/context/OrganizationContext';
import { NavigationProgressBar } from '@/components/layout/NavigationProgressBar';

export const metadata: Metadata = {
  title: 'SI-TARUNA | Sistem Informasi Karang Taruna Dusun Tuk Uluh, Sringin, Jumantono',
  description: 'SI-TARUNA - Sistem Informasi Karang Taruna Dusun Tuk Uluh, Sringin, Jumantono. Transparansi keuangan kas, absensi kegiatan, arisan dan pengumuman warga.',
  manifest: '/manifest.json',
  icons: {
    icon: '/assets/logo.png',
    apple: '/assets/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen bg-white text-taruna-dark antialiased transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
        <NavigationProgressBar />
        <ThemeProvider>
          <ToastProvider>
            <OrganizationProvider>
              <RealtimeNotificationProvider>{children}</RealtimeNotificationProvider>
            </OrganizationProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
