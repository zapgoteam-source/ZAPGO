import SelfEstimateV2Client from './SelfEstimateV2Client';

type PageProps = {
  searchParams?: Promise<{ r?: string }>;
};

export default async function SelfEstimateV2PrototypePage({ searchParams }: PageProps) {
  const params = await searchParams;
  return <SelfEstimateV2Client initialRestoreToken={params?.r ?? ''} />;
}
