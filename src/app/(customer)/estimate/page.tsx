'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEstimateStore } from '@/store/estimateStore';
import { useAuth } from '@/contexts/AuthContext';
import {
  formatKRW,
  windowTypeLabel,
  layoutCodeLabel,
  sizeCategoryLabel,
} from '@/lib/estimateCalculator';
import { EstimateResult, MaterialType, WindowServiceType } from '@/types';

export default function EstimatePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { windows, housingAreaPyeong, materialType, getEstimateResult, getAlternativeResult } =
    useEstimateStore();

  const [showAlternative, setShowAlternative] = useState(false);
  const [saving, setSaving] = useState(false);

  const result = getEstimateResult();
  const altSide = getAlternativeResult(materialType, 'SIDE_ONLY');
  const altMohair = getAlternativeResult('MOHAIR', 'FOUR_SIDE');

  if (!result || windows.length === 0) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center px-5">
        <p className="text-gray-500 text-sm">창문 정보를 먼저 입력해주세요</p>
        <button
          onClick={() => router.push('/windows')}
          className="mt-4 px-6 py-3 bg-gray-900 text-white rounded-xl text-sm"
        >
          창문 입력하러 가기
        </button>
      </div>
    );
  }

  const handleSaveEstimate = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setSaving(true);
    try {
      // TODO: Supabase에 견적 저장 (submit 페이지에서 처리)
      router.push('/submit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 헤더 */}
      <div className="px-5 pt-6 pb-4 border-b border-gray-100">
        <button onClick={() => router.back()} className="text-gray-400 text-sm mb-3">
          ← 뒤로
        </button>
        <p className="text-xs text-gray-400 mb-1">STEP 4 / 4</p>
        <h1 className="text-xl font-bold text-gray-900">견적 결과</h1>

        {/* 총액 강조 */}
        <div className="mt-3 bg-gray-900 rounded-2xl p-4">
          <p className="text-gray-300 text-sm mb-1">총 예상 금액 (부가세 별도)</p>
          <p className="text-3xl font-bold text-white">{formatKRW(result.total)}</p>
          <p className="text-gray-400 text-xs mt-1">
            작업 인원 {result.worker_count}명 · {housingAreaPyeong}평 · {materialType === 'FABRIC' ? '패브릭씰러' : '일반모헤어'}
          </p>
        </div>

        {/* 창틀 미확인 경고 */}
        {result.has_unknown_frame && (
          <div className="mt-3 bg-yellow-50 border border-yellow-300 rounded-xl p-3">
            <p className="text-sm font-semibold text-yellow-800">⚠️ 실측 후 금액이 변동될 수 있습니다</p>
            <p className="text-xs text-yellow-600 mt-0.5">
              창틀 모헤어를 모르겠음으로 선택한 창문이 있습니다. 실측 시 추가 비용이 발생할 수 있습니다.
            </p>
          </div>
        )}
        <p className="text-xs text-gray-400 mt-2 text-center">
          본 견적은 참고용 예상 금액이며, 지역·현장상황·창문상태에 따라 변동 가능성이 있습니다.
        </p>
      </div>

      <div className="flex-1 px-5 py-4 space-y-4">
        {/* 인건비 */}
        <Section title="인건비">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">작업 인원 {result.worker_count}명</span>
            <span className="text-sm font-semibold">{formatKRW(result.labor_cost)}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">300,000원 × {result.worker_count}명</p>
        </Section>

        {/* 메인 시공비 */}
        {result.service_lines.length > 0 && (
          <Section title={`메인 시공비 (${materialType === 'FABRIC' ? '패브릭씰러' : '일반모헤어'})`}>
            <div className="space-y-2">
              {result.service_lines.map((line, i) => (
                <div key={i} className="flex justify-between items-start py-1.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm text-gray-700">{line.location_label}</p>
                    <p className="text-xs text-gray-400">
                      {sizeCategoryLabel(line.size_category)} ·{' '}
                      {line.service_type === 'FOUR_SIDE' ? '탈거 4면' : '측면'} ×{line.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-gray-800">{formatKRW(line.total_price)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
              <span className="text-sm font-semibold text-gray-700">소계</span>
              <span className="text-sm font-bold">{formatKRW(result.subtotal_service)}</span>
            </div>
          </Section>
        )}

        {/* 창틀 시공비 */}
        {result.frame_lines.length > 0 && (
          <Section title="창틀 시공비">
            <div className="space-y-2">
              {result.frame_lines.map((line, i) => (
                <div key={i} className="flex justify-between items-start py-1.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm text-gray-700">{line.location_label}</p>
                    <p className="text-xs text-gray-400">
                      {sizeCategoryLabel(line.size_category)} · {line.frame_mohair_state.includes('LINE_3') || line.frame_mohair_state.includes('LINE_4') ? '단가 2배' : '일반'} ×{line.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-gray-800">{formatKRW(line.total_price)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
              <span className="text-sm font-semibold text-gray-700">소계</span>
              <span className="text-sm font-bold">{formatKRW(result.subtotal_frame)}</span>
            </div>
          </Section>
        )}

        {/* 방충망 및 방충솔루션 */}
        {result.screen_lines.length > 0 && (
          <Section title="방충망 및 방충솔루션">
            {result.screen_lines.map((line, i) => (
              <div key={i} className="space-y-1.5 mb-3">
                <p className="text-sm font-medium text-gray-700">{line.location_label}</p>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>방충망 교체 ({line.screen_count}개 × {formatKRW(line.replacement_unit_price)})</span>
                  <span>{formatKRW(line.replacement_total)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>방충솔루션 ({line.screen_count}개 × 23,000원)</span>
                  <span>{formatKRW(line.bug_solution_total)}</span>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center mt-1 pt-2 border-t border-gray-200">
              <span className="text-sm font-semibold text-gray-700">소계</span>
              <span className="text-sm font-bold">
                {formatKRW(result.subtotal_screen_replacement + result.subtotal_bug_solution)}
              </span>
            </div>
          </Section>
        )}

        {/* 대안 견적 */}
        <div>
          <button
            onClick={() => setShowAlternative(!showAlternative)}
            className="w-full py-3 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium hover:bg-gray-50"
          >
            {showAlternative ? '▲ 대안 견적 숨기기' : '▼ 비용 부담 시 대안 견적 보기'}
          </button>

          {showAlternative && (
            <div className="mt-3 space-y-3">
              {altSide && materialType !== 'MOHAIR' && (
                <AlternativeCard
                  title="패브릭씰러 측면 시공"
                  amount={altSide.total}
                  saving={result.total - altSide.total}
                  desc="4면 탈거 대신 측면만 시공 (단열 효과 일부 감소)"
                />
              )}
              {altMohair && materialType === 'FABRIC' && (
                <AlternativeCard
                  title="일반모헤어 전체 시공"
                  amount={altMohair.total}
                  saving={result.total - altMohair.total}
                  desc="패브릭씰러 대신 일반모헤어 사용 (경제적 선택)"
                />
              )}
            </div>
          )}
        </div>

        {/* 금액 합산 */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="space-y-2 text-sm">
            <Row label="인건비" value={formatKRW(result.labor_cost)} />
            <Row label="메인 시공비" value={formatKRW(result.subtotal_service)} />
            {result.subtotal_frame > 0 && (
              <Row label="창틀 시공비" value={formatKRW(result.subtotal_frame)} />
            )}
            {result.subtotal_screen_replacement > 0 && (
              <Row label="방충망 교체" value={formatKRW(result.subtotal_screen_replacement)} />
            )}
            {result.subtotal_bug_solution > 0 && (
              <Row label="방충솔루션" value={formatKRW(result.subtotal_bug_solution)} />
            )}
          </div>
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
            <span className="font-bold text-gray-900">합계 (부가세 별도)</span>
            <span className="font-bold text-xl text-gray-900">{formatKRW(result.total)}</span>
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="px-5 pb-6 pt-3 space-y-2 border-t border-gray-100 bg-white">
        <button
          onClick={() => router.push('/submit')}
          className="w-full py-4 bg-gray-900 text-white font-semibold rounded-xl text-base hover:bg-gray-800 transition-colors"
        >
          시공 요청하기
        </button>
        <button
          onClick={handleSaveEstimate}
          disabled={saving}
          className="w-full py-3 border-2 border-gray-900 text-gray-900 font-medium rounded-xl text-sm hover:bg-gray-50 disabled:opacity-40"
        >
          {saving ? '저장 중...' : '견적 저장'}
        </button>
        <div className="flex gap-2">
          <a
            href="tel:0000000000"
            className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 text-center hover:bg-gray-50"
          >
            📞 상담원 연결
          </a>
          <a
            href="/visit-request"
            className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 text-center hover:bg-gray-50"
          >
            방문 견적 요청
          </a>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <p className="text-sm font-bold text-gray-800 mb-3">{title}</p>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-gray-600">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function AlternativeCard({
  title,
  amount,
  saving,
  desc,
}: {
  title: string;
  amount: number;
  saving: number;
  desc: string;
}) {
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-semibold text-blue-900">{title}</p>
          <p className="text-xs text-blue-600 mt-0.5">{desc}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-blue-900">{formatKRW(amount)}</p>
          {saving > 0 && (
            <p className="text-xs text-green-600 font-medium">{formatKRW(saving)} 절약</p>
          )}
        </div>
      </div>
    </div>
  );
}
