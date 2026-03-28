'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { formatKRW } from '@/lib/estimateCalculator';
import { Estimate, EstimateStatus } from '@/types';
import { fetchDashboardEstimates } from '@/lib/queries';
import { RefreshCw, Edit, PlusCircle } from 'lucide-react';

// ─── 상태 메타 ────────────────────────────────────────────────────────────────
const STATUS_META: Record<EstimateStatus, { label: string; pill: string }> = {
  DRAFT:          { label: '대기 중',   pill: 'bg-orange-50 text-orange-700' },
  REQUESTED:      { label: '신규접수',  pill: 'bg-blue-50 text-blue-700' },
  ASSIGNED:       { label: '상담 중',   pill: 'bg-red-50 text-red-700' },
  VISIT_REQUESTED:{ label: '방문요청',  pill: 'bg-amber-50 text-amber-700' },
  VISIT_SCHEDULED:{ label: '방문예약',  pill: 'bg-yellow-50 text-yellow-800' },
  COMPLETED:      { label: '완료',      pill: 'bg-green-50 text-green-700' },
};

const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'ALL',             label: '전체 상태' },
  { value: 'DRAFT',           label: '대기 중' },
  { value: 'REQUESTED',       label: '신규접수' },
  { value: 'ASSIGNED',        label: '상담 중' },
  { value: 'VISIT_REQUESTED', label: '방문요청' },
  { value: 'VISIT_SCHEDULED', label: '방문예약' },
  { value: 'COMPLETED',       label: '완료' },
];

// ─── 한글 초성 추출 ────────────────────────────────────────────────────────────
function getInitial(name?: string | null): string {
  if (!name) return '?';
  return name.charAt(0);
}

// ─── 날짜 포맷 ─────────────────────────────────────────────────────────────────
function fmtDate(d?: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).replace(/\. /g, '.').replace('.', '년 ').replace('.', '월 ').replace('.', '일');
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  useAuth();
  const router = useRouter();

  const [selected, setSelected] = useState<Estimate | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [referralFilter, setReferralFilter] = useState('ALL');

  const { data: estimates = [], isFetching, refetch: refetchEstimates } = useQuery({
    queryKey: ['dashboard-estimates'],
    queryFn: fetchDashboardEstimates,
    staleTime: 2 * 60 * 1000,
    select: (data) => {
      // 첫 로드 시 첫 번째 항목 자동 선택
      if (data.length > 0 && !selected) setSelected(data[0]);
      return data;
    },
  });

  // 필터된 목록
  const filtered = useMemo(() => {
    return estimates.filter(e => {
      if (statusFilter !== 'ALL' && e.status !== statusFilter) return false;
      if (referralFilter !== 'ALL' && e.referral_code !== referralFilter) return false;
      return true;
    });
  }, [estimates, statusFilter, referralFilter]);

  // 대리점 코드 목록 (유니크)
  const referralCodes = useMemo(() => {
    const codes = [...new Set(estimates.map(e => e.referral_code).filter(Boolean))];
    return codes as string[];
  }, [estimates]);

  // 상태별 카운트
  const counts = useMemo(() => ({
    waiting:    estimates.filter(e => ['DRAFT', 'REQUESTED'].includes(e.status)).length,
    consulting: estimates.filter(e => ['ASSIGNED', 'VISIT_REQUESTED', 'VISIT_SCHEDULED'].includes(e.status)).length,
    done:       estimates.filter(e => e.status === 'COMPLETED').length,
  }), [estimates]);

  return (
    <div className="min-h-full">

      {/* ── 헤더 ──────────────────────────────────────────────────────────── */}
      <header className="mb-8 flex flex-col gap-5">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-xs font-bold text-primary tracking-widest uppercase">STEP 01</span>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mt-1">
              대시보드 실시간 현황
            </h1>
          </div>
          {/* 상태 카운터 */}
          <div className="hidden md:flex items-center gap-5 bg-gray-50 px-5 py-2.5 rounded-xl text-sm font-medium">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              대기 {counts.waiting}
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              상담 {counts.consulting}
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              완료 {counts.done}
            </span>
          </div>
        </div>

        {/* 필터 바 */}
        <div className="bg-gray-50 p-2 rounded-xl flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[140px]">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full bg-white rounded-lg text-sm px-4 py-2.5 shadow-sm border-0 focus:ring-2 focus:ring-primary/20 outline-none"
            >
              {STATUS_FILTER_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <select
              value={referralFilter}
              onChange={e => setReferralFilter(e.target.value)}
              className="w-full bg-white rounded-lg text-sm px-4 py-2.5 shadow-sm border-0 focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="ALL">유입 경로 (전체)</option>
              {referralCodes.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <select className="w-full bg-white rounded-lg text-sm px-4 py-2.5 shadow-sm border-0 focus:ring-2 focus:ring-primary/20 outline-none">
              <option>대리점 코드</option>
            </select>
          </div>
          <button
            onClick={() => refetchEstimates()}
            className="bg-white p-2.5 rounded-lg shadow-sm hover:bg-red-50 transition-colors"
            title="새로고침"
          >
            <RefreshCw size={18} className={`text-gray-500 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* ── 2-컬럼 레이아웃 ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-6">

        {/* ── 왼쪽: 고객 목록 ─────────────────────────────────────────────── */}
        <section className="col-span-12 lg:col-span-7 space-y-3">
          <div className="flex justify-between items-center px-1 mb-1">
            <h2 className="text-base font-bold text-gray-900">접수 고객 목록</h2>
            <span className="text-sm text-gray-400">총 {filtered.length}명</span>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm bg-gray-50 rounded-xl">
              견적 데이터가 없습니다
            </div>
          ) : (
            <div className="space-y-2.5">
              {filtered.map(e => {
                const isActive = selected?.id === e.id;
                const meta = STATUS_META[e.status as EstimateStatus];
                const initial = getInitial(e.customer_name);
                return (
                  <div
                    key={e.id}
                    onClick={() => setSelected(e)}
                    className={`p-5 rounded-xl cursor-pointer transition-all flex items-center justify-between
                      ${isActive
                        ? 'bg-white shadow-sm border-l-4 border-primary'
                        : 'bg-gray-50 hover:bg-white hover:shadow-sm border-l-4 border-transparent'
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* 아바타 */}
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0
                        ${isActive ? 'bg-red-50 text-primary' : 'bg-gray-200 text-gray-500'}`}
                      >
                        {initial}
                      </div>
                      {/* 정보 */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900">{e.customer_name || '고객명 미입력'}</span>
                          {meta && (
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${meta.pill}`}>
                              {meta.label}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-3 text-xs text-gray-400">
                          <span>{e.customer_phone || '—'}</span>
                          <span>📅 {fmtDate(e.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    {/* 금액 */}
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="text-[10px] text-gray-400 mb-0.5">예상 금액</p>
                      <p className={`text-base font-black ${isActive ? 'text-primary' : 'text-gray-800'}`}>
                        {formatKRW(e.self_estimated_amount)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── 오른쪽: 상세 패널 ────────────────────────────────────────────── */}
        <section className="col-span-12 lg:col-span-5">
          <div className="sticky top-6">
            {selected ? (
              <DetailPanel
                estimate={selected}
                onViewDetail={() => router.push(`/admin/estimate/${selected.id}`)}
                onAssign={() => router.push(`/admin/customers`)}
              />
            ) : (
              <div className="rounded-2xl bg-gray-50 flex items-center justify-center h-64 text-gray-400 text-sm">
                고객을 선택하면 상세 정보가 표시됩니다
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}

// ─── 상세 패널 컴포넌트 ────────────────────────────────────────────────────────
function DetailPanel({
  estimate: e,
  onViewDetail,
  onAssign,
}: {
  estimate: Estimate;
  onViewDetail: () => void;
  onAssign: () => void;
}) {
  const meta = STATUS_META[e.status as EstimateStatus];

  return (
    <div className="rounded-2xl overflow-hidden shadow-xl bg-white">

      {/* 히어로 — 빨간 그라디언트 */}
      <div className="p-7 bg-gradient-to-br from-[#8a0000] to-primary text-white">
        <div className="flex justify-between items-start mb-5">
          <div>
            <span className="text-[10px] font-bold tracking-widest bg-white/20 px-2 py-1 rounded">
              DETAIL VIEW
            </span>
            <h2 className="text-2xl font-black mt-2">
              {e.customer_name || '고객명 미입력'} 고객님
            </h2>
            <p className="text-white/70 text-sm mt-1">{e.address || '주소 미입력'}</p>
          </div>
          <button
            onClick={onViewDetail}
            className="bg-white/10 p-2 rounded-full backdrop-blur-sm hover:bg-white/20 transition-colors"
          >
            <Edit size={16} className="text-white" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 p-3.5 rounded-xl backdrop-blur-sm">
            <p className="text-[10px] text-white/60 mb-1">연락처</p>
            <p className="font-bold text-sm">{e.customer_phone || '—'}</p>
          </div>
          <div className="bg-white/10 p-3.5 rounded-xl backdrop-blur-sm">
            <p className="text-[10px] text-white/60 mb-1">접수 경로</p>
            <p className="font-bold text-sm">{e.referral_code || '직접 접수'}</p>
          </div>
        </div>
      </div>

      {/* 바디 */}
      <div className="p-7 space-y-7">

        {/* 최근 견적 요약 */}
        <div>
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
            최근 견적 요약
          </h4>
          <div className="bg-gray-50 p-4 rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-700">
                {e.material_type === 'FABRIC' ? '패브릭씰러' : '일반모헤어'} · {e.housing_area_pyeong}평
              </span>
              <span className="font-bold text-primary">
                {formatKRW(e.self_estimated_amount)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-400">
              <span>
                {meta?.label || e.status}
              </span>
              <span>{fmtDate(e.created_at)} 접수</span>
            </div>
          </div>
        </div>

        {/* 시공 배정 상태 */}
        <div>
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
            시공 배정 상태
          </h4>
          <div className="flex gap-3">
            <div className="flex-1 flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
              <span className="text-xl">👷</span>
              <div>
                <p className="text-[10px] text-gray-400">팀장</p>
                <p className="text-sm font-bold text-gray-800">
                  {e.worker_id ? '배정 완료' : '미배정'}
                </p>
              </div>
            </div>
            <div className="flex-1 flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
              <span className="text-xl">📅</span>
              <div>
                <p className="text-[10px] text-gray-400">일정</p>
                <p className="text-sm font-bold text-gray-800">
                  {e.preferred_date ? fmtDate(e.preferred_date) : '미정'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 메모 영역 (extra_request) */}
        {e.extra_request && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                요청 메모
              </h4>
              <button className="text-[10px] font-bold text-primary flex items-center gap-1 hover:opacity-70">
                <PlusCircle size={12} /> 메모 추가
              </button>
            </div>
            <div className="border-l-2 border-red-100 pl-4">
              <p className="text-xs font-bold text-gray-600 mb-1">고객 요청사항</p>
              <p className="text-sm text-gray-500 leading-relaxed">{e.extra_request}</p>
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={onAssign}
            className="bg-gray-100 text-primary py-3.5 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all active:scale-95"
          >
            배정하기
          </button>
          <button
            onClick={onViewDetail}
            className="bg-primary text-white py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95"
          >
            상세 보기
          </button>
        </div>

      </div>
    </div>
  );
}
