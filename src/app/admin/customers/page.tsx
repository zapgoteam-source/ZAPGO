'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Customer } from '@/types';
import { fetchCustomerList } from '@/lib/queries';

function getStatusMeta(status: string): { label: string; cls: string } {
  switch (status) {
    case 'COMPLETED':       return { label: '시공완료', cls: 'bg-[#ffdad6] text-[#3b0000]' };
    case 'CONSULTING':      return { label: '상담중',   cls: 'bg-[#ffdbcd] text-[#360f00]' };
    case 'SCHEDULED':       return { label: '시공예약', cls: 'bg-[#ffdad6] text-[#843939]' };
    case 'NEW':             return { label: '신규문의', cls: 'bg-[#ffdad6] text-[#843939]' };
    case 'SELF_ESTIMATE':   return { label: '셀프견적', cls: 'bg-[#ffdad6] text-[#843939]' };
    case 'VISIT_REQUESTED': return { label: '방문요청', cls: 'bg-[#ffdad6] text-[#843939]' };
    case 'PENDING':         return { label: '보류',     cls: 'bg-[#ffdad6] text-[#93000a]' };
    case 'CLOSED':          return { label: '종결',     cls: 'bg-[#ffdad6] text-[#93000a]' };
    default: return { label: status, cls: 'bg-gray-100 text-gray-600' };
  }
}

function fmtDate(d?: string | null) {
  if (!d) return '-';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '-';
  return `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, '0')}.${String(dt.getDate()).padStart(2, '0')}`;
}

const PAGE_SIZE = 20;


export default function AdminCustomersPage() {
  const { role } = useAuth();
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');

  const { data, isFetching } = useQuery({
    queryKey: ['customers', { page, search, dateFrom }],
    queryFn: () => fetchCustomerList({ page, search, dateFrom }),
    enabled: role === 'ADMIN',
    placeholderData: (prev) => prev,
  });

  const customers = data?.data ?? [];
  const total = data?.total ?? 0;
  const dataLoading = isFetching && customers.length === 0;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // 통계 카드 계산 (현재 로드된 전체 데이터 기준)
  const allRows = customers; // 더미 or 실제
  const thisMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
  const newThisMonth = allRows.filter((c) => c.created_at.startsWith(thisMonth)).length;
  const inProgress = allRows.filter((c) => ['CONSULTING', 'SCHEDULED', 'VISIT_REQUESTED'].includes(c.status)).length;
  const totalRevenue = allRows.reduce((sum, c) => sum + (c.final_construction_amount || 0), 0);

  const pageButtons = (() => {
    const start = Math.max(0, Math.min(page - 2, totalPages - 5));
    return Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);
  })();

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1
            className="text-3xl font-extrabold text-[#191c1e] tracking-tight mb-2"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            고객 통합 관리
          </h1>
          <p className="text-[#434655] text-sm">에너지잡고 전체 고객 데이터를 조회하고 관리할 수 있습니다.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-[#B10000] text-white font-bold text-sm active:scale-95 transition-transform shadow-md">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          고객 등록
        </button>
      </div>

      {/* Filter Bento Box */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="md:col-span-2 bg-[#f2f4f6] p-6 flex flex-col gap-3">
          <span className="text-[10px] font-bold tracking-[0.05em] text-[#434655] uppercase">STEP 01. 기간 및 검색어</span>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#434655]">등록일 범위</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                className="w-full bg-[#e0e3e5] border-none px-3 py-2 text-sm focus:bg-white focus:ring-1 focus:ring-[#B10000]/40 outline-none transition-all"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#434655]">고객명/연락처</label>
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                placeholder="검색어 입력..."
                className="w-full bg-[#e0e3e5] border-none px-3 py-2 text-sm focus:bg-white focus:ring-1 focus:ring-[#B10000]/40 outline-none transition-all"
              />
            </div>
          </div>
        </div>
        <div className="bg-[#f2f4f6] p-6 flex flex-col gap-3">
          <span className="text-[10px] font-bold tracking-[0.05em] text-[#434655] uppercase">STEP 02. 담당자</span>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#434655]">상담자 선택</label>
            <select className="w-full bg-[#e0e3e5] border-none px-3 py-2 text-sm focus:bg-white focus:ring-1 focus:ring-[#B10000]/40 outline-none transition-all">
              <option>전체</option>
            </select>
          </div>
        </div>
        <div className="bg-[#f2f4f6] p-6 flex flex-col gap-3">
          <span className="text-[10px] font-bold tracking-[0.05em] text-[#434655] uppercase">STEP 03. 현장</span>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#434655]">시공팀장 선택</label>
            <select className="w-full bg-[#e0e3e5] border-none px-3 py-2 text-sm focus:bg-white focus:ring-1 focus:ring-[#B10000]/40 outline-none transition-all">
              <option>전체</option>
            </select>
          </div>
        </div>
      </section>

      {/* Data Table */}
      <div className="bg-white shadow-sm overflow-hidden border border-[#c3c6d7]/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f2f4f6]">
                {['등록일', '상태', '이름', '연락처', '주소', '상담자', '시공일정', '최종시공금액', '입금일자'].map((h, i) => (
                  <th
                    key={h}
                    className={`px-6 py-4 text-[10px] font-bold tracking-[0.05em] text-[#434655] uppercase whitespace-nowrap${i === 7 ? ' text-right' : ''}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c3c6d7]/10">
              {dataLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin h-6 w-6 border-b-2 border-[#B10000]" />
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-[#434655] text-sm">
                    고객 데이터가 없습니다
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const status = getStatusMeta(c.status);
                  return (
                    <tr
                      key={c.id}
                      onClick={() => router.push(`/admin/customers/${c.id}`)}
                      className="hover:bg-[#eceef0]/30 cursor-pointer transition-colors group"
                    >
                      <td className="px-6 py-5 text-sm text-[#191c1e] whitespace-nowrap" style={{ fontFamily: 'Manrope, sans-serif' }}>
                        {fmtDate(c.created_at)}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 text-[11px] font-bold whitespace-nowrap ${status.cls}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm font-bold text-[#B10000] group-hover:underline whitespace-nowrap">
                        {c.name}
                      </td>
                      <td className="px-6 py-5 text-sm text-[#434655] whitespace-nowrap">{c.phone}</td>
                      <td className="px-6 py-5 text-sm text-[#434655] truncate max-w-[180px]">{c.address || '-'}</td>
                      <td className="px-6 py-5 text-sm text-[#434655]">-</td>
                      <td className="px-6 py-5 text-sm text-[#434655] whitespace-nowrap">{fmtDate(c.scheduled_date)}</td>
                      <td className="px-6 py-5 text-sm font-bold text-right text-[#191c1e] whitespace-nowrap" style={{ fontFamily: 'Manrope, sans-serif' }}>
                        {c.final_construction_amount > 0 ? c.final_construction_amount.toLocaleString() : '0'}
                      </td>
                      <td className="px-6 py-5 text-sm text-[#434655] whitespace-nowrap">{fmtDate(c.payment_received_date)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 flex items-center justify-between bg-[#f2f4f6]/50 border-t border-[#c3c6d7]/10">
          <p className="text-xs text-[#434655]">
            전체 <span className="font-bold text-[#B10000]">{total.toLocaleString()}</span>명 중{' '}
            {total === 0 ? '0' : page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, total)} 표시
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="w-8 h-8 flex items-center justify-center border border-[#c3c6d7]/30 hover:bg-white text-[#434655] disabled:opacity-40 text-lg leading-none"
            >
              ‹
            </button>
            {pageButtons.map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 flex items-center justify-center text-xs font-bold ${
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
              className="w-8 h-8 flex items-center justify-center border border-[#c3c6d7]/30 hover:bg-white text-[#434655] disabled:opacity-40 text-lg leading-none"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-[#f2f4f6] flex flex-col justify-between h-32 relative overflow-hidden">
          <span className="text-[10px] font-bold tracking-[0.05em] text-[#434655] uppercase">이번 달 신규 고객</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-[#191c1e] tracking-tighter" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {newThisMonth}
            </span>
            <span className="text-sm font-bold text-[#434655]">명</span>
          </div>
        </div>
        <div className="p-6 bg-[#f2f4f6] flex flex-col justify-between h-32 relative overflow-hidden">
          <span className="text-[10px] font-bold tracking-[0.05em] text-[#434655] uppercase">진행 중인 시공</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-[#191c1e] tracking-tighter" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {inProgress}
            </span>
            <span className="text-sm font-bold text-[#434655]">건</span>
          </div>
        </div>
        <div className="p-6 bg-[#f2f4f6] flex flex-col justify-between h-32 relative overflow-hidden">
          <span className="text-[10px] font-bold tracking-[0.05em] text-[#434655] uppercase">총 누적 매출</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-[#191c1e] tracking-tighter" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {(totalRevenue / 10000).toLocaleString()}
            </span>
            <span className="text-sm font-bold text-[#943700]">만원</span>
          </div>
        </div>
      </div>
    </div>
  );
}
