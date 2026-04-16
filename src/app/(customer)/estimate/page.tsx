'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useEstimateStore } from '@/store/estimateStore';

function useCountUp(target: number, duration = 400) {
  const [display, setDisplay] = useState(target);
  const prev = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = prev.current;
    const diff = target - start;
    if (diff === 0) return;

    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutQuart
      const ease = 1 - Math.pow(1 - progress, 4);
      setDisplay(Math.round(start + diff * ease));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        prev.current = target;
      }
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return display;
}

const LABOR_PER_WORKER = 250_000;
const FABRIC_FOUR_UNIT = 30_000;
const MOHAIR_FOUR_UNIT = 15_000;
const SIDE_ONLY_UNIT = 15_000;
const VAT_RATE = 1.1;

type PlanKey = 'main' | 'alt1' | 'alt2';

function getWorkerCount(pyeong: number): number {
  if (pyeong >= 71) return 6;
  if (pyeong >= 51) return 5;
  if (pyeong >= 38) return 4;
  if (pyeong >= 23) return 3;
  return 2;
}

function withVAT(amount: number): number {
  return Math.round(amount * VAT_RATE);
}

function formatKRW(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원';
}

export default function EstimatePage() {
  const router = useRouter();
  const {
    housingAreaPyeong,
    windowSashCount,
    premiumProtection,
    pestSolution,
    pestScreenCount,
    selectedPlan,
    setSelectedPlan,
  } = useEstimateStore();

  const [selected, setSelected] = useState<PlanKey>(selectedPlan);

  const handleSelect = (key: PlanKey) => {
    setSelected(key);
    setSelectedPlan(key);
  };

  const workerCount = housingAreaPyeong ? getWorkerCount(housingAreaPyeong) : 0;
  const laborCost = LABOR_PER_WORKER * workerCount;
  const optionCost =
    (premiumProtection ? 80_000 : 0) +
    (pestSolution ? pestScreenCount * 23_000 : 0);
  const sash = windowSashCount ?? 0;

  const plans: Record<PlanKey, { label: string; total: number; workerCount: number }> = {
    main: {
      label: '창짝 패브릭씰러 시공 (창문 탈거)',
      total: withVAT(laborCost + sash * FABRIC_FOUR_UNIT + optionCost),
      workerCount,
    },
    alt1: {
      label: '일반 모헤어 4면',
      total: withVAT(laborCost + sash * MOHAIR_FOUR_UNIT + optionCost),
      workerCount,
    },
    alt2: {
      label: '창짝 측면만 패브릭씰러 시공 (창문 미탈거)',
      total: withVAT(LABOR_PER_WORKER * 1 + sash * SIDE_ONLY_UNIT + optionCost),
      workerCount: 1,
    },
  };

  const current = plans[selected];
  const animatedTotal = useCountUp(current.total);

  if (!housingAreaPyeong || !windowSashCount) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center px-5 gap-4">
        <p className="text-gray-500 text-sm">주택 정보를 먼저 입력해주세요</p>
        <button
          onClick={() => router.push('/house-info')}
          className="px-6 py-3 bg-gray-900 text-white text-sm"
        >
          정보 입력하러 가기
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* 헤더 */}
      <div className="px-5 pt-6 pb-4">
        <button onClick={() => router.back()} className="text-gray-400 text-sm mb-3 flex items-center gap-1">
          ← 뒤로
        </button>
        <p className="text-xs text-gray-400 mb-1">STEP 3 / 3</p>
        <h1 className="text-xl font-bold text-gray-900">예상 견적</h1>
      </div>

      <div className="flex-1 px-5 space-y-5 pb-6">

        {/* 총 예상금액 */}
        <div className="bg-gray-900 p-5">
          <p className="text-gray-400 text-sm mb-1">총 예상 금액 (VAT포함)</p>
          <p className="text-4xl font-bold text-white tabular-nums">
            {animatedTotal.toLocaleString('ko-KR')}원
          </p>
          <p className="text-gray-400 text-xs mt-2">
            {current.label} · {housingAreaPyeong}평 · 창짝 {windowSashCount}개
          </p>
          {(premiumProtection || pestSolution) && (
            <p className="text-gray-400 text-xs mt-1">
              {[
                premiumProtection && '프리미엄보양 포함',
                pestSolution && `방충솔루션 ${pestScreenCount}개 포함`,
              ].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        {/* 대안 1 */}
        <button
          onClick={() => handleSelect(selected === 'alt1' ? 'main' : 'alt1')}
          className={`w-full text-left p-4 border-2 transition-all ${
            selected === 'alt1' ? 'border-[#b10000]' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <p className="text-xs font-semibold text-gray-500 mb-1">
            💡 대안 1 — 비용이 부담되신다면
            {selected === 'alt1' && <span className="ml-2 text-[#b10000]">선택됨 ✓</span>}
          </p>
          <p className="text-sm text-gray-700">
            자재를 일반 모헤어로 변경하면{' '}
            <span className="font-bold text-[#b10000] text-base">{formatKRW(plans.alt1.total)}</span>
            {' '}에 해드릴 수 있습니다.
          </p>
          <p className="text-xs text-gray-400 mt-1">시간이 지나면 털이 날리겠지만 경제적인 선택입니다.</p>
        </button>

        {/* 대안 2 */}
        <button
          onClick={() => handleSelect(selected === 'alt2' ? 'main' : 'alt2')}
          className={`w-full text-left p-4 border-2 transition-all ${
            selected === 'alt2' ? 'border-[#b10000]' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <p className="text-xs font-semibold text-gray-500 mb-1">
            💡 대안 2 — 최소 비용으로 시작하려면
            {selected === 'alt2' && <span className="ml-2 text-[#b10000]">선택됨 ✓</span>}
          </p>
          <p className="text-sm text-gray-700">
            탈거 없이 창짝의 측면만 하면{' '}
            <span className="font-bold text-[#b10000] text-base">{formatKRW(plans.alt2.total)}</span>
            {' '}에 교체하실 수 있습니다.
          </p>
          <p className="text-xs text-gray-400 mt-1">창문 측면 털날림은 완전히 해결됩니다.</p>
        </button>

        <p className="text-xs text-gray-400 text-center leading-relaxed">
          위 금액은 입력된 기초 정보에 따른 예상 견적입니다.<br />
          실제 시공 환경, 창틀 모헤어 유무, 창문 상태에 따라<br />
          최종 견적은 일부 조정될 수 있습니다.
        </p>
      </div>

      {/* 하단 버튼 */}
      <div className="px-5 pb-8 pt-3 space-y-2 border-t border-gray-100 bg-white">
        <button
          onClick={() => router.push('/submit')}
          className="w-full py-4 bg-gray-900 text-white font-semibold text-base hover:bg-gray-800 transition-colors"
        >
          시공 요청하기
        </button>
        <div className="flex gap-2">
          <a
            href="tel:16009195"
            className="flex-1 py-3 border border-gray-200 text-sm font-medium text-gray-600 text-center hover:bg-gray-50"
          >
            📞 상담원 연결
          </a>
          <a
            href="/visit-request"
            className="flex-1 py-3 border border-gray-200 text-sm font-medium text-gray-600 text-center hover:bg-gray-50"
          >
            방문 견적 요청
          </a>
        </div>
      </div>
    </div>
  );
}
