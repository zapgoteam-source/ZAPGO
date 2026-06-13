import type { Metadata, Viewport } from 'next';
import SelfEstimateV2Client from '@/app/prototype/selfest-v2/SelfEstimateV2Client';

export const metadata: Metadata = {
  metadataBase: new URL('https://zapgo-eight.vercel.app'),
  title: '에너지잡고 셀프견적',
  description: '창문 단열 시공 맞춤 예상 견적 서비스',
  openGraph: {
    title: '에너지잡고 셀프견적',
    description: '창문 단열 시공 맞춤 예상 견적 서비스',
    url: '/q',
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
  params: Promise<{
    dealerCode: string;
    referralCode?: string[];
  }>;
  searchParams?: Promise<{ r?: string }>;
};

export default async function DealerQuotePage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const referralCode = resolvedParams.referralCode?.[0] ?? resolvedParams.dealerCode;

  return (
    <SelfEstimateV2Client
      initialRestoreToken={resolvedSearchParams?.r ?? ''}
      initialDealerCode={resolvedParams.dealerCode}
      initialReferralCode={referralCode}
    />
  );
}
