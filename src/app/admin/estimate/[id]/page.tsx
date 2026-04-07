'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  Estimate, EstimateAdjustment, EstimateRevision,
  EstimateSurvey, EstimateWindowService, EstimateStatus,
  Window as EstimateWindow,
} from '@/types';
import { formatKRW } from '@/lib/estimateCalculator';
import { fetchEstimateDetail } from '@/lib/queries';

// ─── 상태 ─────────────────────────────────────────────────────────────────────
const STATUS_LABELS: Record<EstimateStatus, string> = {
  DRAFT: '초안', REQUESTED: '신규접수', ASSIGNED: '담당배정',
  VISIT_REQUESTED: '방문요청', VISIT_SCHEDULED: '방문예약', COMPLETED: '완료',
};

// ─── 설문 레이블 ───────────────────────────────────────────────────────────────
const SURVEY_FIELDS: { key: keyof EstimateSurvey; label: string }[] = [
  { key: 'noise_level',        label: '외부 소음' },
  { key: 'draft_level',        label: '외풍' },
  { key: 'heating_cost_level', label: '난방비' },
  { key: 'dust_level',         label: '먼지' },
  { key: 'bug_level',          label: '벌레' },
  { key: 'odor_level',         label: '냄새' },
];

const LEVEL_META: Record<number, { label: string; cls: string }> = {
  0: { label: '없음/보통', cls: 'bg-[#eceef0] text-[#434655]' },
  1: { label: '조금 있음', cls: 'bg-[#ffdbcd] text-[#360f00]' },
  2: { label: '심함',      cls: 'bg-[#ffdad6] text-[#843939]' },
  3: { label: '매우 심함', cls: 'bg-[#ffdad6] text-[#93000a]' },
};

// ─── 창문 정보 ─────────────────────────────────────────────────────────────────
const LAYOUT_LABELS: Record<string, string> = {
  '2_1_1': '2짝 1:1', '2_1_2': '2짝 1:2', '2_2_1': '2짝 2:1',
  '3_1_1_1': '3짝 1:1:1', '3_1_2_1': '3짝 1:2:1', '4_1_1_1_1': '4짝',
};
const WIN_TYPE_LABELS: Record<string, string> = {
  full_win: '큰창', half_win: '중간창', small_win: '작은창',
};

function fmtDate(d?: string | null) {
  if (!d) return '-';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '-';
  return `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, '0')}.${String(dt.getDate()).padStart(2, '0')} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
}

interface WindowWithServices extends EstimateWindow {
  services: EstimateWindowService[];
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────
export default function AdminEstimateDetailPage() {
  const { role, user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  // 조정 폼
  const [adjType, setAdjType] = useState<'ADD' | 'DISCOUNT'>('ADD');
  const [adjAmount, setAdjAmount] = useState('');
  const [adjReason, setAdjReason] = useState('');
  const [savingAdj, setSavingAdj] = useState(false);

  // 상태 변경
  const [savingStatus, setSavingStatus] = useState(false);

  const queryClient = useQueryClient();

  const { data: detail, isLoading: dataLoading } = useQuery({
    queryKey: ['estimate-detail', id],
    queryFn: () => fetchEstimateDetail(id),
    enabled: role === 'ADMIN' && !!id,
    staleTime: 5 * 60 * 1000,
  });

  const estimate = detail?.estimate ?? null;
  const adjustments = detail?.adjustments ?? [];
  const revisions = detail?.revisions ?? [];
  const survey = detail?.survey ?? null;
  const windows = (detail?.windows ?? []) as WindowWithServices[];

  const handleStatusChange = async (status: EstimateStatus) => {
    if (!estimate) return;
    setSavingStatus(true);
    try {
      const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
      if (status === 'ASSIGNED') update.assigned_at = new Date().toISOString();
      if (status === 'COMPLETED') {
        update.completed_at = new Date().toISOString();
        update.locked_at = new Date().toISOString();
      }
      await supabase.from('estimates').update(update).eq('id', id);
      // 캐시 직접 업데이트 (리패치 없이 즉시 반영)
      queryClient.setQueryData(['estimate-detail', id], (old: typeof detail) =>
        old ? { ...old, estimate: { ...old.estimate!, status } } : old
      );
      // 목록 캐시도 무효화
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
    } finally {
      setSavingStatus(false);
    }
  };

  const handleAddAdjustment = async () => {
    if (!estimate || !user || !adjReason || !adjAmount) return;
    setSavingAdj(true);
    try {
      const { data } = await supabase
        .from('estimate_adjustments')
        .insert({
          estimate_id: estimate.id,
          actor_user_id: user.id,
          adjustment_type: adjType,
          amount: Number(adjAmount.replace(/,/g, '')),
          reason: adjReason,
        })
        .select()
        .single();
      if (data) {
        // 캐시에 새 조정 항목 추가
        queryClient.setQueryData(['estimate-detail', id], (old: typeof detail) =>
          old ? { ...old, adjustments: [data as EstimateAdjustment, ...old.adjustments] } : old
        );
        setAdjAmount('');
        setAdjReason('');
      }
    } finally {
      setSavingAdj(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-b-2 border-[#B10000]" />
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="text-center py-12 text-[#434655]">
        견적을 찾을 수 없습니다.{' '}
        <button onClick={() => router.back()} className="text-[#B10000] font-bold underline">
          뒤로
        </button>
      </div>
    );
  }

  const adjTotal = adjustments.reduce(
    (sum, a) => (a.adjustment_type === 'ADD' ? sum + a.amount : sum - a.amount),
    0,
  );
  const finalAmount = estimate.final_confirmed_amount || (estimate.self_estimated_amount + adjTotal);

  const estCode = `EST-${estimate.id.slice(0, 8).toUpperCase()}`;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <nav className="flex items-center gap-2 text-[#737686] text-sm mb-2 font-medium">
            <button onClick={() => router.push('/admin/dashboard')} className="hover:text-[#B10000] transition-colors">
              견적 관리
            </button>
            <span className="text-xs">›</span>
            <span className="text-[#434655]">견적 상세 확인</span>
          </nav>
          <div className="flex items-center gap-4">
            <h1
              className="text-3xl font-black tracking-tight text-[#191c1e]"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              {estCode}
            </h1>
            <span className="px-3 py-1 bg-[#ffdad6] text-[#3b0000] text-xs font-bold">
              {STATUS_LABELS[estimate.status]}
            </span>
            {estimate.locked_at && (
              <span className="px-3 py-1 bg-[#ffdad6] text-[#93000a] text-xs font-bold">잠김</span>
            )}
          </div>
          <p className="mt-2 text-[#434655] font-medium">
            고객명: <span className="text-[#191c1e] font-bold">{estimate.customer_name || '-'}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(STATUS_LABELS) as EstimateStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={savingStatus || estimate.status === s || !!estimate.locked_at}
                className={`px-3 py-1.5 text-xs font-bold border transition-colors disabled:cursor-not-allowed ${
                  estimate.status === s
                    ? 'bg-[#191c1e] text-white border-[#191c1e]'
                    : 'bg-white text-[#434655] border-[#c3c6d7]/50 hover:border-[#737686] disabled:opacity-40'
                }`}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-4 space-y-8">
          {/* 고객 정보 */}
          <section className="bg-white p-6 shadow-sm border border-[#c3c6d7]/10">
            <h3 className="text-lg font-extrabold mb-6 flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <span className="w-1.5 h-6 bg-[#B10000]" />
              고객 정보
            </h3>
            <div className="space-y-5">
              <InfoRow label="이름" value={estimate.customer_name || '-'} />
              <InfoRow label="연락처" value={estimate.customer_phone || '-'} />
              <div className="flex flex-col gap-1">
                <span className="text-[#434655] text-sm font-medium">주소</span>
                <span className="text-[#191c1e] font-bold leading-tight">{estimate.address || '-'}</span>
              </div>
              <InfoRow label="평형" value={`${estimate.housing_area_pyeong}평`} />
              <InfoRow
                label="자재"
                value={estimate.material_type === 'FABRIC' ? '패브릭씰러' : estimate.material_type === 'MOHAIR' ? '일반모헤어' : '-'}
              />
              {estimate.referral_code && (
                <InfoRow label="대리점 코드" value={estimate.referral_code} highlight />
              )}
              {estimate.preferred_date && (
                <InfoRow label="희망 시공일" value={estimate.preferred_date} />
              )}
              {estimate.extra_request && (
                <div className="flex flex-col gap-1">
                  <span className="text-[#434655] text-sm font-medium">요청사항</span>
                  <span className="text-[#191c1e] font-bold leading-tight text-sm">{estimate.extra_request}</span>
                </div>
              )}
              {estimate.warning_unknown_frame && (
                <div className="bg-amber-50 border border-amber-200 p-3">
                  <p className="text-xs text-amber-700 font-medium">⚠️ 창틀 미확인 창문 있음 — 실측 후 금액 변동 가능</p>
                </div>
              )}
            </div>
          </section>

          {/* 설문 결과 */}
          {survey && (
            <section className="bg-white p-6 shadow-sm border border-[#c3c6d7]/10">
              <h3 className="text-lg font-extrabold mb-6 flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                <span className="w-1.5 h-6 bg-[#954949]" />
                설문 결과
              </h3>
              <div className="space-y-3">
                {SURVEY_FIELDS.map(({ key, label }) => {
                  const level = (survey[key] as number) ?? 0;
                  const meta = LEVEL_META[level] || LEVEL_META[0];
                  return (
                    <div key={key} className="p-4 bg-[#f2f4f6] flex flex-col gap-1">
                      <span className="text-xs text-[#434655] font-bold uppercase tracking-wider">{label}</span>
                      <span className={`self-start px-2.5 py-1 text-xs font-black ${meta.cls}`}>
                        {meta.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 수정 이력 타임라인 */}
          {revisions.length > 0 && (
            <section className="bg-[#f7f9fb] p-2">
              <h3 className="text-sm font-black text-[#737686] mb-4 px-2 uppercase tracking-tighter">수정 이력 타임라인</h3>
              <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#c3c6d7]/30">
                {revisions.map((rev, i) => (
                  <div key={rev.id} className="relative pl-8">
                    <div
                      className={`absolute left-0 top-1.5 w-6 h-6 z-10 flex items-center justify-center border-2 ${
                        i === 0 ? 'bg-white border-[#B10000]' : 'bg-white border-[#c3c6d7]'
                      }`}
                    >
                      {i === 0 && <div className="w-2 h-2 bg-[#B10000]" />}
                    </div>
                    <p className="text-xs text-[#434655] font-medium">{fmtDate(rev.created_at)}</p>
                    <p className="text-sm font-bold text-[#191c1e] mt-0.5">{rev.revision_type}</p>
                    {rev.memo && <p className="text-xs text-[#434655]">{rev.memo}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column */}
        <div className="lg:col-span-8 space-y-8">
          {/* 창문 목록 */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-extrabold flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                <span className="w-1.5 h-6 bg-[#B10000]" />
                창문 목록{' '}
                <span className="text-[#B10000] text-sm font-medium ml-1">총 {windows.length}개소</span>
              </h3>
            </div>
            {windows.length === 0 ? (
              <div className="bg-white p-8 text-center text-[#434655] text-sm border border-[#c3c6d7]/10">
                창문 데이터가 없습니다
              </div>
            ) : (
              <div className="space-y-4">
                {windows.map((win) => (
                  <div
                    key={win.id}
                    className="bg-white p-6 border border-[#c3c6d7]/10 hover:border-[#B10000]/20 transition-all"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-[#434655] uppercase tracking-wider mb-1 block">위치 / 유형</label>
                        <p className="text-sm font-bold text-[#191c1e]">
                          {win.location_label} · {WIN_TYPE_LABELS[win.window_type_code] || win.window_type_code}
                        </p>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#434655] uppercase tracking-wider mb-1 block">구조</label>
                        <p className="text-sm font-bold text-[#191c1e]">
                          {LAYOUT_LABELS[win.layout_code] || win.layout_code}
                        </p>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#434655] uppercase tracking-wider mb-1 block">단창/이중창</label>
                        <p className="text-sm font-bold text-[#191c1e]">
                          {win.is_double_window ? '이중창' : '단창'}
                        </p>
                      </div>
                      {win.services.length > 0 && (
                        <div className="col-span-2">
                          <label className="text-[10px] font-bold text-[#434655] uppercase tracking-wider mb-1 block">서비스</label>
                          <div className="flex flex-wrap gap-2">
                            {win.services.map((s) => (
                              <span
                                key={s.id}
                                className="px-2 py-1 bg-[#B10000]/10 text-[#B10000] text-[11px] font-bold"
                              >
                                {s.service_family} · {formatKRW(s.total_price)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 하단 2열 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 추가 / 할인 조정 */}
            <section className="bg-white p-6 border border-[#c3c6d7]/10 shadow-sm self-start">
              <h3 className="text-lg font-extrabold mb-6 flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                <span className="w-1.5 h-6 bg-[#943700]" />
                추가 / 할인 조정
              </h3>
              <div className="space-y-4">
                {/* 추가/할인 토글 */}
                <div className="flex gap-4">
                  {(['ADD', 'DISCOUNT'] as const).map((t) => (
                    <label key={t} className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="adjType"
                        checked={adjType === t}
                        onChange={() => setAdjType(t)}
                        className="hidden"
                      />
                      <div
                        className={`text-center py-2 border-2 font-bold text-sm transition-colors ${
                          adjType === t
                            ? 'border-[#B10000] bg-[#B10000]/5 text-[#B10000]'
                            : 'border-[#c3c6d7]/30 text-[#434655]'
                        }`}
                      >
                        {t === 'ADD' ? '추가 (+)' : '할인 (-)'}
                      </div>
                    </label>
                  ))}
                </div>

                {/* 금액 */}
                <div>
                  <label className="text-xs font-bold text-[#434655] mb-1 block">조정 금액</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={adjAmount}
                      onChange={(e) => setAdjAmount(e.target.value)}
                      placeholder="금액 입력"
                      disabled={!!estimate.locked_at}
                      className="w-full bg-[#f2f4f6] border-none py-3 px-4 font-bold text-right pr-12 text-sm focus:ring-1 focus:ring-[#B10000]/30 outline-none disabled:opacity-50"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-sm text-[#434655]">원</span>
                  </div>
                </div>

                {/* 사유 */}
                <div>
                  <label className="text-xs font-bold text-[#434655] mb-1 block">조정 사유</label>
                  <textarea
                    value={adjReason}
                    onChange={(e) => setAdjReason(e.target.value)}
                    placeholder="조정 사유를 입력하세요."
                    disabled={!!estimate.locked_at}
                    className="w-full bg-[#f2f4f6] border-none py-3 px-4 text-sm min-h-[80px] resize-none focus:ring-1 focus:ring-[#B10000]/30 outline-none disabled:opacity-50"
                  />
                </div>

                <button
                  onClick={handleAddAdjustment}
                  disabled={!adjReason || !adjAmount || savingAdj || !!estimate.locked_at}
                  className="w-full py-3 bg-[#B10000] text-white font-bold text-sm disabled:opacity-40 active:scale-[0.98] transition-all"
                >
                  {savingAdj ? '적용 중...' : '조정 적용'}
                </button>

                {/* 조정 이력 */}
                {adjustments.length > 0 && (
                  <div className="border-t border-[#c3c6d7]/20 pt-4 space-y-3">
                    {adjustments.map((a) => (
                      <div key={a.id} className="flex justify-between items-start">
                        <div>
                          <span
                            className={`text-xs font-bold ${
                              a.adjustment_type === 'ADD' ? 'text-[#B10000]' : 'text-green-600'
                            }`}
                          >
                            {a.adjustment_type === 'ADD' ? '+' : '-'}{formatKRW(a.amount)}
                          </span>
                          <p className="text-xs text-[#434655] mt-0.5">{a.reason}</p>
                        </div>
                        <p className="text-xs text-[#737686] whitespace-nowrap ml-4">{fmtDate(a.created_at).split(' ')[0]}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* 최종 견적 요약 */}
            <section className="bg-gradient-to-br from-[#2d3133] to-[#1a1f22] text-white p-8 shadow-2xl">
              <h3 className="text-lg font-extrabold mb-8 flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                <span className="w-1.5 h-6 bg-[#ffdad6]" />
                최종 견적 요약
              </h3>
              <div className="space-y-6">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-sm">셀프견적 금액</span>
                  <span className="font-medium" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    {formatKRW(estimate.self_estimated_amount)}
                  </span>
                </div>
                {adjustments.length > 0 && (
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-sm">관리자 조정</span>
                    <span
                      className={`font-medium ${adjTotal >= 0 ? 'text-red-300' : 'text-green-300'}`}
                      style={{ fontFamily: 'Manrope, sans-serif' }}
                    >
                      {adjTotal >= 0 ? '+' : ''}{formatKRW(adjTotal)}
                    </span>
                  </div>
                )}
                <div className="h-px bg-white/10" />
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-slate-300">최종 예상 견적가</span>
                  <span className="text-4xl font-black tracking-tighter text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    {(finalAmount / 10000).toFixed(0)}만
                    <span className="text-lg ml-1">원</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 text-right uppercase tracking-widest font-bold">
                  {formatKRW(finalAmount)} · Inc. VAT
                </p>
                <div className="pt-2">
                  <div className="bg-white/5 border border-white/10 p-4">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      상기 금액은 실측 데이터 기반으로 산정되었으며, 현장 상황에 따라 시공 시 일부 변경될 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[#434655] text-sm font-medium">{label}</span>
      <span className={`font-bold text-sm ${highlight ? 'text-[#B10000]' : 'text-[#191c1e]'}`}>{value}</span>
    </div>
  );
}
