'use client';

import { useEffect, useState } from 'react';

type ReferrerDashboard = {
  referrer: { name: string; code: string; type: string };
  summary: { leads: number; inProgress: number; completed: number; payableAmount: number };
  customers: Array<{
    id: string;
    maskedName: string;
    maskedPhone: string;
    status: string;
    createdAt: string;
    incentiveStatus: string;
    incentiveAmount: number;
  }>;
};

function formatKRW(value: number) {
  return `${value.toLocaleString('ko-KR')}원`;
}

export default function ReferrerDashboardClient({ code, secret }: { code: string; secret?: string }) {
  const [data, setData] = useState<ReferrerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({ code });
        if (secret) params.set('secret', secret);
        const response = await fetch(`/api/referrer/dashboard?${params.toString()}`);
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || '추천인 정보를 불러오지 못했습니다.');
        setData(payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : '추천인 정보를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [code, secret]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="mx-auto max-w-md border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/q/dealer/${data.referrer.code}`;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-md px-4 py-6">
        <header className="mb-6">
          <p className="mb-1 text-xs font-semibold text-gray-400">REFERRER</p>
          <h1 className="text-2xl font-bold">추천인 대시보드</h1>
          <p className="mt-1 text-sm text-gray-500">{data.referrer.name}</p>
        </header>

        <section className="mb-4 border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm font-bold text-yellow-800">내 추천 코드</p>
          <p className="mt-1 text-xs text-yellow-700">대리점 코드와 함께 `/q/대리점코드/{data.referrer.code}` 형식으로 공유합니다.</p>
          <div className="mt-3 bg-white p-2">
            <p className="truncate text-xs text-gray-600">{referralLink}</p>
          </div>
        </section>

        <section className="mb-4 grid grid-cols-2 gap-3">
          <Metric label="유입 고객" value={`${data.summary.leads}명`} />
          <Metric label="진행 중" value={`${data.summary.inProgress}명`} />
          <Metric label="시공 완료" value={`${data.summary.completed}건`} />
          <Metric label="지급대상" value={formatKRW(data.summary.payableAmount)} />
        </section>

        <section className="border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-sm font-bold">내 유입 고객</h2>
            <p className="mt-0.5 text-xs text-gray-500">개인정보는 제한적으로 표시됩니다.</p>
          </div>
          <div className="divide-y divide-gray-100">
            {data.customers.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">아직 유입 고객이 없습니다.</p>
            ) : (
              data.customers.map((customer) => (
                <div key={customer.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{customer.maskedName}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{customer.maskedPhone || '연락처 비공개'}</p>
                    </div>
                    <span className="shrink-0 bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                      {customer.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[#b10000]">
                    인센티브: {customer.incentiveStatus} · {formatKRW(customer.incentiveAmount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-200 bg-white p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
