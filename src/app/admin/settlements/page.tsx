'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type SettlementRow = {
  agencyId: string;
  agencyName: string;
  agencyCode: string;
  periodMonth: string;
  completedCount: number;
  grossAmount: number;
  royaltyRate: number;
  royaltyAmount: number;
  laborCostAmount: number;
  incentiveAmount: number;
  netAmount: number;
  status: string;
  memo: string;
};

type SettlementResponse = {
  periodMonth: string;
  rows: SettlementRow[];
  summary: {
    grossAmount: number;
    royaltyAmount: number;
    incentiveAmount: number;
    netAmount: number;
  };
  warnings?: string[];
};

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: '초안' },
  { value: 'CONFIRMED', label: '확정' },
  { value: 'INVOICED', label: '계산서' },
  { value: 'PAID', label: '지급완료' },
  { value: 'HOLD', label: '보류' },
];

function fmtKRW(value: number) {
  return `${value.toLocaleString('ko-KR')}원`;
}

export default function AdminSettlementsPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [data, setData] = useState<SettlementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const response = await fetch(`/api/hq/settlements?month=${month}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || '정산 데이터를 불러오지 못했습니다.');
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : '정산 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  async function saveRow(row: SettlementRow, status: string) {
    setSavingKey(row.agencyId);
    setError('');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const response = await fetch('/api/hq/settlements', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ...row, status }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || '정산 상태를 저장하지 못했습니다.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : '정산 상태를 저장하지 못했습니다.');
    } finally {
      setSavingKey('');
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold tracking-widest text-[#B10000]">SETTLEMENTS</p>
          <h1 className="mt-1 text-3xl font-extrabold text-gray-900">정산 관리</h1>
          <p className="mt-2 text-sm text-gray-500">대리점 월 매출, 로열티, 추천인 인센티브를 확인하고 정산 상태를 관리합니다.</p>
        </div>
        <input
          type="month"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
          className="border border-gray-300 bg-white px-3 py-2 text-sm font-semibold"
        />
      </header>

      {error && <div className="border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
      {data?.warnings && data.warnings.length > 0 && (
        <div className="border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{data.warnings.join(' ')}</div>
      )}

      {loading ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin border-b-2 border-gray-900" />
        </div>
      ) : data ? (
        <>
          <section className="grid gap-3 md:grid-cols-4">
            <Metric label="총 시공매출" value={fmtKRW(data.summary.grossAmount)} />
            <Metric label="로열티" value={fmtKRW(data.summary.royaltyAmount)} />
            <Metric label="추천인 인센티브" value={fmtKRW(data.summary.incentiveAmount)} />
            <Metric label="정산 후 금액" value={fmtKRW(data.summary.netAmount)} />
          </section>

          <section className="border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    {['대리점', '완료', '시공매출', '로열티', '인건비', '인센티브', '정산 후', '상태'].map((head) => (
                      <th key={head} className="px-4 py-3 font-semibold">{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.rows.map((row) => (
                    <tr key={row.agencyId}>
                      <td className="px-4 py-4">
                        <p className="font-bold text-gray-900">{row.agencyName}</p>
                        <p className="mt-0.5 text-xs text-gray-400">{row.agencyCode}</p>
                      </td>
                      <td className="px-4 py-4">{row.completedCount}건</td>
                      <td className="px-4 py-4 font-semibold">{fmtKRW(row.grossAmount)}</td>
                      <td className="px-4 py-4">{fmtKRW(row.royaltyAmount)} <span className="text-xs text-gray-400">({row.royaltyRate}%)</span></td>
                      <td className="px-4 py-4">{fmtKRW(row.laborCostAmount)}</td>
                      <td className="px-4 py-4">{fmtKRW(row.incentiveAmount)}</td>
                      <td className="px-4 py-4 font-bold text-[#B10000]">{fmtKRW(row.netAmount)}</td>
                      <td className="px-4 py-4">
                        <select
                          value={row.status}
                          disabled={savingKey === row.agencyId}
                          onChange={(event) => saveRow(row, event.target.value)}
                          className="border border-gray-300 bg-white px-2 py-1 text-xs font-semibold"
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status.value} value={status.value}>{status.label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
