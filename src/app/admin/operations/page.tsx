'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

type HqDashboardResponse = {
  summary: {
    leads: number;
    consultPending: number;
    scheduled: number;
    completed: number;
    revenue: number;
    unanswered: number;
  };
  agencies: Array<{
    id: string;
    name: string;
    code: string;
    leads: number;
    consults: number;
    scheduled: number;
    completed: number;
    revenue: number;
    pending: number;
    conversionRate: number;
    status: 'NORMAL' | 'ATTENTION' | 'INACTIVE';
  }>;
  recentCustomers: Array<{
    id: string;
    name: string;
    phone: string;
    agencyName: string;
    referrerCode: string;
    status: string;
    amount: number;
    createdAt?: string | null;
  }>;
  alerts: Array<{ type: string; severity: string; title: string; body: string }>;
  warnings?: string[];
};

const STATUS_LABELS = {
  NORMAL: '정상',
  ATTENTION: '주의',
  INACTIVE: '비활성',
};

const STATUS_CLASS = {
  NORMAL: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ATTENTION: 'bg-amber-50 text-amber-700 border-amber-200',
  INACTIVE: 'bg-gray-100 text-gray-600 border-gray-200',
};

function formatKRW(value: number) {
  return `${value.toLocaleString('ko-KR')}원`;
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('ko-KR');
}

export default function AdminOperationsPage() {
  const [data, setData] = useState<HqDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAgencyId, setSelectedAgencyId] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        const response = await fetch('/api/hq/dashboard', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || '운영 대시보드를 불러오지 못했습니다.');
        setData(payload);
        setSelectedAgencyId(payload.agencies?.[0]?.id || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : '운영 대시보드를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const selectedAgency = useMemo(
    () => data?.agencies.find((agency) => agency.id === selectedAgencyId),
    [data?.agencies, selectedAgencyId],
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
        {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold tracking-widest text-[#B10000]">SAAS OPERATIONS</p>
          <h1 className="mt-1 text-3xl font-extrabold text-gray-900">본사 SaaS 운영</h1>
          <p className="mt-2 text-sm text-gray-500">대리점 유입, 상담, 시공, 정산 전 상태를 실제 데이터로 확인합니다.</p>
        </div>
        <a
          href="/prototype/hq-dashboard"
          className="border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700"
        >
          목업 보기
        </a>
      </header>

      {data.warnings && data.warnings.length > 0 && (
        <div className="border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {data.warnings.join(' ')}
        </div>
      )}

      <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Metric label="전체 유입" value={`${data.summary.leads}명`} />
        <Metric label="상담 대기" value={`${data.summary.consultPending}건`} tone="text-amber-700" />
        <Metric label="시공 예약" value={`${data.summary.scheduled}건`} tone="text-blue-700" />
        <Metric label="시공 완료" value={`${data.summary.completed}건`} tone="text-emerald-700" />
        <Metric label="미응대" value={`${data.summary.unanswered}건`} tone="text-red-700" />
        <Metric label="예상 매출" value={formatKRW(data.summary.revenue)} tone="text-[#B10000]" />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-sm font-bold">대리점 성과</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  {['대리점', '유입', '상담', '예약', '완료', '전환율', '매출', '미응대', '상태'].map((head) => (
                    <th key={head} className="px-4 py-3 font-semibold">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.agencies.map((agency) => (
                  <tr
                    key={agency.id}
                    onClick={() => setSelectedAgencyId(agency.id)}
                    className={`cursor-pointer hover:bg-gray-50 ${selectedAgencyId === agency.id ? 'bg-red-50/40' : ''}`}
                  >
                    <td className="px-4 py-4">
                      <p className="font-bold text-gray-900">{agency.name}</p>
                      <p className="mt-0.5 text-xs text-gray-400">{agency.code}</p>
                    </td>
                    <td className="px-4 py-4 font-semibold">{agency.leads}</td>
                    <td className="px-4 py-4">{agency.consults}</td>
                    <td className="px-4 py-4">{agency.scheduled}</td>
                    <td className="px-4 py-4">{agency.completed}</td>
                    <td className="px-4 py-4 font-semibold">{agency.conversionRate}%</td>
                    <td className="px-4 py-4">{formatKRW(agency.revenue)}</td>
                    <td className="px-4 py-4 font-semibold text-amber-700">{agency.pending}</td>
                    <td className="px-4 py-4">
                      <span className={`border px-2 py-1 text-xs font-semibold ${STATUS_CLASS[agency.status]}`}>
                        {STATUS_LABELS[agency.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="text-sm font-bold">주의 필요</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {data.alerts.length === 0 ? (
                <p className="p-4 text-sm text-gray-500">현재 주의 필요 항목이 없습니다.</p>
              ) : (
                data.alerts.map((alert) => (
                  <div key={`${alert.type}-${alert.title}`} className="p-4">
                    <p className="font-semibold text-gray-900">{alert.title}</p>
                    <p className="mt-1 text-sm leading-5 text-gray-600">{alert.body}</p>
                  </div>
                ))
              )}
            </div>
          </section>

          {selectedAgency && (
            <section className="border border-gray-200 bg-white p-4">
              <h2 className="text-sm font-bold">선택 대리점</h2>
              <p className="mt-3 text-xl font-bold">{selectedAgency.name}</p>
              <p className="mt-1 text-sm text-gray-500">{selectedAgency.code}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <Info label="유입" value={`${selectedAgency.leads}명`} />
                <Info label="완료" value={`${selectedAgency.completed}건`} />
                <Info label="미응대" value={`${selectedAgency.pending}건`} />
                <Info label="매출" value={formatKRW(selectedAgency.revenue)} />
              </div>
              <p className="mt-4 break-all bg-gray-50 p-3 text-xs font-semibold text-gray-600">
                /q/{selectedAgency.code}/{selectedAgency.code}
              </p>
            </section>
          )}
        </aside>
      </div>

      <section className="border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-bold">최근 유입 고객</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {data.recentCustomers.map((customer) => (
            <div key={customer.id} className="grid gap-3 px-4 py-3 text-sm md:grid-cols-[1fr_1fr_1fr_1fr_auto] md:items-center">
              <div>
                <p className="font-semibold">{customer.name}</p>
                <p className="mt-0.5 text-xs text-gray-500">{customer.phone}</p>
              </div>
              <p>{customer.agencyName}</p>
              <p className="text-gray-500">{customer.referrerCode || '직접 유입'}</p>
              <p className="font-semibold">{customer.status}</p>
              <p className="text-xs text-gray-400">{formatDate(customer.createdAt)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, tone = 'text-gray-900' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 font-bold text-gray-900">{value}</p>
    </div>
  );
}
