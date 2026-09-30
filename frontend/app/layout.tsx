import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'SI-TARUNA | Karang Taruna Springin - Jumantono',
  description: 'Sistem Informasi Karang Taruna Springin - Jumantono',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-white text-taruna-dark antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
