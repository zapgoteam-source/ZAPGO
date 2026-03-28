'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Estimate, EstimateStatus } from '@/types';
import { formatKRW } from '@/lib/estimateCalculator';
import { DUMMY_ESTIMATES } from '@/data/estimates';
import { fetchEstimateList } from '@/lib/queries';

const STATUS_LABELS: Record<EstimateStatus, string> = {
  DRAFT: '초안',
  REQUESTED: '신규접수',
  ASSIGNED: '담당배정',
  VISIT_REQUESTED: '방문요청',
  VISIT_SCHEDULED: '방문예약',
  COMPLETED: '완료',
};

const STATUS_STYLES: Record<EstimateStatus, string> = {
  DRAFT: 'bg-[#eceef0] text-[#434655]',
  REQUESTED: 'bg-[#dbe1ff] text-[#003ea8]',
  ASSIGNED: 'bg-[#ffdbcd] text-[#360f00]',
  VISIT_REQUESTED: 'bg-[#ffdad6] text-[#843939]',
  VISIT_SCHEDULED: 'bg-[#ffdad6] text-[#3b0000]',
  COMPLETED: 'bg-[#ffdad6] text-[#3b0000]',
};

function fmtDate(d?: string | null) {
  if (!d) return '-';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '-';
  return `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, '0')}.${String(dt.getDate()).padStart(2, '0')}`;
}

const PAGE_SIZE = 20;

export default function AdminEstimateListPage() {
  const { role } = useAuth();
  const router = useRouter();

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EstimateStatus | ''>('');
  const [dateFrom, setDateFrom] = useState('');

  const { data, isFetching } = useQuery({
    queryKey: ['estimates', { page, search, statusFilter, dateFrom }],
    queryFn: () => fetchEstimateList({ page, search, statusFilter, dateFrom }),
    enabled: role === 'ADMIN',
    placeholderData: (prev) => prev,
    select: (res) => {
      if (res.data.length === 0 && !search && !statusFilter && !dateFrom && page === 0) {
        return { data: DUMMY_ESTIMATES as Estimate[], total: DUMMY_ESTIMATES.length };
      }
      return res;
    },
  });

  const estimates = data?.data ?? [];
  const total = data?.total ?? 0;
  const dataLoading = isFetching && estimates.length === 0;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // 통계 계산
  const thisMonth = new Date().toISOString().slice(0, 7);
  const newThisMonth = estimates.filter((e) => e.created_at.startsWith(thisMonth)).length;
  const pending = estimates.filter((e) =>
    ['REQUESTED', 'ASSIGNED', 'VISIT_REQUESTED', 'VISIT_SCHEDULED'].includes(e.status)
  ).length;
  const totalAmount = estimates.reduce(
    (sum, e) => sum + (e.final_confirmed_amount || e.self_estimated_amount || 0),
    0
  );

  const pageButtons = (() => {
    const start = Math.max(0, Math.min(page - 2, totalPages - 5));
    return Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);
  })();

  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1
            className="text-3xl font-extrabold text-[#191c1e] tracking-tight mb-2"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            견적 관리
          </h1>
          <p className="text-[#434655] text-sm">접수된 셀프견적을 조회하고 상태를 관리할 수 있습니다.</p>
        </div>
      </div>

      {/* 필터 영역 */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="md:col-span-2 bg-[#f2f4f6] p-6 rounded-xl flex flex-col gap-3">
          <span className="text-[10px] font-bold tracking-[0.05em] text-[#434655] uppercase">STEP 01. 기간 및 검색어</span>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#434655]">접수일 범위</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                className="w-full bg-[#e0e3e5] border-none rounded px-3 py-2 text-sm focus:bg-white focus:ring-1 focus:ring-[#B10000]/40 outline-none transition-all"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#434655]">고객명/연락처/주소</label>
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                placeholder="검색어 입력..."
                className="w-full bg-[#e0e3e5] border-none rounded px-3 py-2 text-sm focus:bg-white focus:ring-1 focus:ring-[#B10000]/40 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="bg-[#f2f4f6] p-6 rounded-xl flex flex-col gap-3">
          <span className="text-[10px] font-bold tracking-[0.05em] text-[#434655] uppercase">STEP 02. 진행 상태</span>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#434655]">상태 선택</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as EstimateStatus | ''); setPage(0); }}
              className="w-full bg-[#e0e3e5] border-none rounded px-3 py-2 text-sm focus:bg-white focus:ring-1 focus:ring-[#B10000]/40 outline-none transition-all"
            >
              <option value="">전체</option>
              {(Object.keys(STATUS_LABELS) as EstimateStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-[#f2f4f6] p-6 rounded-xl flex flex-col gap-3">
          <span className="text-[10px] font-bold tracking-[0.05em] text-[#434655] uppercase">STEP 03. 대리점</span>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#434655]">대리점 코드</label>
            <input
              type="text"
              placeholder="코드 입력..."
              className="w-full bg-[#e0e3e5] border-none rounded px-3 py-2 text-sm focus:bg-white focus:ring-1 focus:ring-[#B10000]/40 outline-none transition-all"
            />
          </div>
        </div>
      </section>

      {/* 데이터 테이블 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-[#c3c6d7]/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f2f4f6]">
                {['접수일', '상태', '견적번호', '고객명', '연락처', '주소', '평형', '대리점', '셀프견적', '최종금액'].map((h, i) => (
                  <th
                    key={h}
                    className={`px-5 py-4 text-[10px] font-bold tracking-[0.05em] text-[#434655] uppercase whitespace-nowrap${
                      i >= 8 ? ' text-right' : ''
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c3c6d7]/10">
              {dataLoading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#B10000]" />
                    </div>
                  </td>
                </tr>
              ) : estimates.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-16 text-center">
                    <p className="text-[#434655] text-sm font-medium">견적 데이터가 없습니다</p>
                    <p className="text-[#737686] text-xs mt-1">접수된 셀프견적이 여기에 표시됩니다.</p>
                  </td>
                </tr>
              ) : (
                estimates.map((est) => {
                  const estCode = `EST-${est.id.slice(0, 8).toUpperCase()}`;
                  const statusCls = STATUS_STYLES[est.status] || 'bg-gray-100 text-gray-600';
                  const statusLabel = STATUS_LABELS[est.status] || est.status;
                  return (
                    <tr
                      key={est.id}
                      onClick={() => router.push(`/admin/estimate/${est.id}`)}
                      className="hover:bg-[#eceef0]/30 cursor-pointer transition-colors group"
                    >
                      <td className="px-5 py-5 text-sm text-[#191c1e] whitespace-nowrap" style={{ fontFamily: 'Manrope, sans-serif' }}>
                        {fmtDate(est.created_at)}
                      </td>
                      <td className="px-5 py-5">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${statusCls}`}>
                          {statusLabel}
                        </span>
                        {est.locked_at && (
                          <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ffdad6] text-[#93000a]">
                            잠김
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-5 text-sm font-bold text-[#B10000] group-hover:underline whitespace-nowrap" style={{ fontFamily: 'Manrope, sans-serif' }}>
                        {estCode}
                      </td>
                      <td className="px-5 py-5 text-sm font-bold text-[#191c1e] whitespace-nowrap">
                        {est.customer_name || '-'}
                      </td>
                      <td className="px-5 py-5 text-sm text-[#434655] whitespace-nowrap">
                        {est.customer_phone || '-'}
                      </td>
                      <td className="px-5 py-5 text-sm text-[#434655] truncate max-w-[160px]">
                        {est.address || '-'}
                      </td>
                      <td className="px-5 py-5 text-sm text-[#434655] whitespace-nowrap text-center">
                        {est.housing_area_pyeong}평
                      </td>
                      <td className="px-5 py-5 text-sm text-[#434655] whitespace-nowrap">
                        {est.referral_code ? (
                          <span className="text-[#B10000] font-bold">{est.referral_code}</span>
                        ) : '-'}
                      </td>
                      <td className="px-5 py-5 text-sm text-right text-[#434655] whitespace-nowrap" style={{ fontFamily: 'Manrope, sans-serif' }}>
                        {est.self_estimated_amount > 0 ? formatKRW(est.self_estimated_amount) : '-'}
                      </td>
                      <td className="px-5 py-5 text-sm font-bold text-right text-[#191c1e] whitespace-nowrap" style={{ fontFamily: 'Manrope, sans-serif' }}>
                        {est.final_confirmed_amount > 0 ? formatKRW(est.final_confirmed_amount) : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        <div className="px-6 py-4 flex items-center justify-between bg-[#f2f4f6]/50 border-t border-[#c3c6d7]/10">
          <p className="text-xs text-[#434655]">
            전체 <span className="font-bold text-[#B10000]">{total.toLocaleString()}</span>건 중{' '}
            {total === 0 ? '0' : page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, total)} 표시
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#c3c6d7]/30 hover:bg-white text-[#434655] disabled:opacity-40 text-lg leading-none"
            >
              ‹
            </button>
            {pageButtons.map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold ${
                  p === page
                    ? 'bg-[#B10000] text-white'
                    : 'border border-[#c3c6d7]/30 hover:bg-white text-[#434655]'
                }`}
              >
                {p + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#c3c6d7]/30 hover:bg-white text-[#434655] disabled:opacity-40 text-lg leading-none"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* 하단 통계 */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-[#f2f4f6] rounded-xl flex flex-col justify-between h-32 relative overflow-hidden">
          <span className="text-[10px] font-bold tracking-[0.05em] text-[#434655] uppercase">이번 달 신규 접수</span>
          <div className="flex items-baseline gap-2">
            <span
              className="text-4xl font-black text-[#191c1e] tracking-tighter"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              {newThisMonth}
            </span>
            <span className="text-sm font-bold text-[#434655]">건</span>
          </div>
        </div>
        <div className="p-6 bg-[#f2f4f6] rounded-xl flex flex-col justify-between h-32 relative overflow-hidden">
          <span className="text-[10px] font-bold tracking-[0.05em] text-[#434655] uppercase">진행 중인 견적</span>
          <div className="flex items-baseline gap-2">
            <span
              className="text-4xl font-black text-[#191c1e] tracking-tighter"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              {pending}
            </span>
            <span className="text-sm font-bold text-[#434655]">건</span>
          </div>
        </div>
        <div className="p-6 bg-[#f2f4f6] rounded-xl flex flex-col justify-between h-32 relative overflow-hidden">
          <span className="text-[10px] font-bold tracking-[0.05em] text-[#434655] uppercase">총 견적 금액</span>
          <div className="flex items-baseline gap-2">
            <span
              className="text-4xl font-black text-[#191c1e] tracking-tighter"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              {(totalAmount / 10000).toLocaleString()}
            </span>
            <span className="text-sm font-bold text-[#943700]">만원</span>
          </div>
        </div>
      </div>
    </div>
  );
}
