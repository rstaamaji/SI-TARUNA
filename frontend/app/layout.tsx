import type { Metadata } from 'next';
import './globals.css';

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
        {children}
      </body>
    </html>
  );
}
