import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { ActiveUserGuard } from "@/components/auth/ActiveUserGuard";

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "ZAPGO - 빠른 서비스 관리",
  description: "효율적인 비즈니스 관리 시스템",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='45' fill='%23b10000'/><text x='50' y='65' font-size='50' text-anchor='middle' fill='white'>Z</text></svg>",
        type: "image/svg+xml",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover', // Safari의 safe area 전체를 사용
  themeColor: '#b10000', // 상단바 색상 지정
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
        <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} min-h-screen`} style={{ 
        touchAction: 'pan-x pan-y', 
        WebkitOverflowScrolling: 'touch',
      }}>
        <AuthProvider>
          <ActiveUserGuard>
            <MainLayout>
              {children}
            </MainLayout>
          </ActiveUserGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
