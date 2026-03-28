import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryProvider } from '@/components/providers/QueryProvider';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: '에너지잡고 셀프견적',
  description: '창문 단열 시공 셀프견적 서비스',
  icons: {
    icon: '/APP LOGO.webp',
    apple: '/APP LOGO.webp',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#FEE500',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${inter.variable} min-h-screen bg-white`}
        style={{
          touchAction: 'pan-x pan-y',
          WebkitOverflowScrolling: 'touch',
          fontFamily: 'Pretendard, sans-serif',
        }}
      >
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
