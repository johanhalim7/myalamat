import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { PWAProvider } from '@/components/PWAProvider';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'AlamatKu — Temukan Alamat Lengkap Akurat untuk Shopee & Paket Online',
  description:
    'Sistem pencari alamat lengkap instan berbasis GPS dan peta interaktif. Dapatkan nama Jalan, RT/RW, Kelurahan, Kecamatan, Kota, hingga Kode Pos siap pakai untuk belanja online.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon.svg',
  },
  keywords: [
    'alamat lengkap',
    'cari alamat sendiri',
    'shopee',
    'tokopedia',
    'tiktok shop',
    'gofood',
    'rt rw',
    'kode pos',
    'peta indonesia',
    'reverse geocoding',
  ],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2563eb',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200`}
      >
        <ThemeProvider>
          <PWAProvider>{children}</PWAProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
