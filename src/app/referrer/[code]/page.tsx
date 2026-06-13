import ReferrerDashboardClient from './ReferrerDashboardClient';

type PageProps = {
  params: Promise<{ code: string }>;
  searchParams?: Promise<{ secret?: string }>;
};

export default async function ReferrerDashboardPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  return (
    <ReferrerDashboardClient
      code={resolvedParams.code}
      secret={resolvedSearchParams?.secret}
    />
  );
}
