import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { RealtimeNotificationProvider } from '@/components/providers/RealtimeNotificationProvider';
import { OrganizationProvider } from '@/context/OrganizationContext';

export const metadata: Metadata = {
  title: 'SI-TARUNA | Karang Taruna Setya Bakti - Tuk Uluh, Sringin, Jumantono',
  description: 'Sistem Informasi Karang Taruna Setya Bakti - Tuk Uluh, Sringin, Jumantono',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen bg-white text-taruna-dark antialiased transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
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
