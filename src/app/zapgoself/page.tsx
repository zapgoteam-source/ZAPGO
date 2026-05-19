import type { Metadata, Viewport } from 'next';
import SelfEstimateV2Client from '../prototype/selfest-v2/SelfEstimateV2Client';

export const metadata: Metadata = {
  metadataBase: new URL('https://zapgo-eight.vercel.app'),
  title: '에너지잡고 셀프견적',
  description: '창문 단열 시공 맞춤 예상 견적 서비스',
  openGraph: {
    title: '에너지잡고 셀프견적',
    description: '창문 단열 시공 맞춤 예상 견적 서비스',
    url: '/zapgoself',
    siteName: '에너지잡고',
    type: 'website',
    images: [
      {
        url: '/zapgoself-og.png',
        width: 1200,
        height: 630,
        alt: '에너지잡고 셀프견적',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '에너지잡고 셀프견적',
    description: '창문 단열 시공 맞춤 예상 견적 서비스',
    images: ['/zapgoself-og.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#7A1515',
};

type PageProps = {
  searchParams?: Promise<{ r?: string }>;
};

export default async function ZapgoSelfPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return <SelfEstimateV2Client initialRestoreToken={params?.r ?? ''} />;
}
