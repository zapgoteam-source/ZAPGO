'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEstimateStore } from '@/store/estimateStore';
import PageTransition from '@/components/PageTransition';
import ConsultCTABar from '@/components/ConsultCTABar';

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
const SIDE_ONLY_UNIT = 15_000;
const MOHAIR_PER_PYEONG = 35_000;
const PREMIUM_PROTECTION_PRICE = 80_000;
const PEST_SCREEN_UNIT_PRICE = 23_000;
const VAT_RATE = 1.1;

type PlanKey = 'main' | 'alt1' | 'alt2';

const PLAN_BUTTONS: { key: PlanKey; label: string; subLabel: string }[] = [
  { key: 'main', label: '패브릭씰러 시공', subLabel: '창문 탈거 / 패브릭씰러 / 4면 시공' },
  { key: 'alt1', label: '일반 모헤어 시공', subLabel: '창문 탈거 / 일반 모헤어 / 4면 시공' },
  { key: 'alt2', label: '측면 시공', subLabel: '창문 미탈거 / 패브릭씰러 / 측면만 시공' },
];

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

export default function EstimatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <EstimatePageInner />
    </Suspense>
  );
}

function EstimatePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    housingAreaPyeong,
    windowSashCount,
    premiumProtection,
    pestSolution,
    pestScreenCount,
    setPremiumProtection,
    setPestSolution,
    setPestScreenCount,
    setSelectedPlan,
    setHousingArea,
    setWindowSashCount,
  } = useEstimateStore();

  // 결과 페이지 진입 시에는 항상 미선택 상태로 시작
  // 단, SMS 다시보기 링크(plan 쿼리)로 들어온 경우에만 선택 상태 복원
  const [selected, setSelected] = useState<PlanKey | null>(() => {
    const p = searchParams.get('plan');
    return p === 'main' || p === 'alt1' || p === 'alt2' ? p : null;
  });
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const intentionalNav = useRef(false);

  // 결과 페이지 첫 진입 시 추가옵션은 미선택 상태로 초기화
  // 단 SMS 다시보기 링크(pest/premium 쿼리)로 들어온 경우에만 해당 값 복원
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    const plan = searchParams.get('plan');
    const fromSmsLink = plan === 'main' || plan === 'alt1' || plan === 'alt2';

    if (fromSmsLink) {
      setSelectedPlan(plan);
      setPremiumProtection(searchParams.get('premium') === '1');
      const pest = searchParams.get('pest');
      const n = pest ? parseInt(pest, 10) : NaN;
      if (!isNaN(n) && n > 0) {
        setPestSolution(true);
        setPestScreenCount(n);
      } else {
        setPestSolution(false);
      }
      const pyeong = searchParams.get('pyeong');
      const sash = searchParams.get('sash');
      if (pyeong) setHousingArea(parseFloat(pyeong));
      if (sash) setWindowSashCount(parseInt(sash, 10));
    } else {
      // 일반 진입: 추가옵션은 미선택 상태로 시작
      setPremiumProtection(false);
      setPestSolution(false);
    }
  }, [searchParams, setSelectedPlan, setPremiumProtection, setPestSolution, setPestScreenCount, setHousingArea, setWindowSashCount]);

  const handleSelectPlan = (key: PlanKey) => {
    setSelected(key);
    setSelectedPlan(key);
  };

  const workerCount = housingAreaPyeong ? getWorkerCount(housingAreaPyeong) : 0;
  const laborCost = LABOR_PER_WORKER * workerCount;
  const optionCost =
    (premiumProtection ? PREMIUM_PROTECTION_PRICE : 0) +
    (pestSolution ? pestScreenCount * PEST_SCREEN_UNIT_PRICE : 0);
  const sash = windowSashCount ?? 0;
  const pyeong = housingAreaPyeong ?? 0;

  const totals: Record<PlanKey, number> = {
    main: withVAT(laborCost + sash * FABRIC_FOUR_UNIT + optionCost),
    alt1: pyeong * MOHAIR_PER_PYEONG + optionCost,
    alt2: withVAT(LABOR_PER_WORKER * 1 + sash * SIDE_ONLY_UNIT + optionCost),
  };

  const currentTotal = selected ? totals[selected] : 0;
  const animatedTotal = useCountUp(currentTotal);

  // ──────────────────────────────
  // 이탈 방지 팝업 (뒤로가기 1회 인터셉트)
  // ──────────────────────────────
  const goToSubmit = useCallback(() => {
    intentionalNav.current = true;
    router.push('/submit');
  }, [router]);

  useEffect(() => {
    if (!housingAreaPyeong || !windowSashCount) return;

    let popupShown = false;
    // 현재 페이지 위에 가상 state push → 뒤로가기 1회 가로채기
    // Strict Mode 이중 실행 방지: 이미 가드가 있으면 중복 push 스킵
    if (window.history.state?.estimateGuard !== true) {
      window.history.pushState({ estimateGuard: true }, '');
    }

    const onPopState = () => {
      if (popupShown || intentionalNav.current) return;
      popupShown = true;
      // 다시 state push 해서 페이지에 머무르게 함
      window.history.pushState({ estimateGuard: true }, '');
      setShowExitPopup(true);
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, [housingAreaPyeong, windowSashCount]);

  if (!housingAreaPyeong || !windowSashCount) {
    return (
      <PageTransition>
      <div className="flex flex-col min-h-screen items-center justify-center px-5 gap-4">
        <p className="text-gray-500 text-sm">주택 정보를 먼저 입력해주세요</p>
        <button
          onClick={() => router.push('/house-info')}
          className="px-6 py-3 bg-gray-900 text-white text-sm"
        >
          정보 입력하러 가기
        </button>
      </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
    <div className="flex flex-col min-h-screen">
      {/* 헤더 */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <button
            onClick={() => {
              intentionalNav.current = true;
              // 가드용 더미 히스토리 + /estimate 엔트리를 함께 건너뛰어 이전 페이지로 복귀
              window.history.go(-2);
            }}
            className="text-gray-400 text-sm flex items-center gap-1"
          >
            ← 뒤로
          </button>
          <img src="/LOGO_BK.webp" alt="에너지잡고" className="w-10 h-10 object-contain flex-shrink-0" />
        </div>
        <p className="text-xs text-gray-400 mb-1">STEP 3 / 3</p>
        <h1 className="text-xl font-bold text-gray-900">예상 견적</h1>
      </div>

      <div className="flex-1 px-5 space-y-5 pb-6">

        {/* 총 예상금액 영역 */}
        <div className={`p-5 min-h-[140px] flex flex-col justify-center ${selected ? 'bg-gray-900' : 'bg-[#b10000]'}`}>
          {selected ? (
            <>
              <p className="text-gray-400 text-sm mb-1">
                총 예상 금액 {selected !== 'alt1' && '(VAT포함)'}
              </p>
              <p className="text-4xl font-bold text-white tabular-nums">
                {animatedTotal.toLocaleString('ko-KR')}원
              </p>
              <p className="text-gray-400 text-xs mt-2">
                {PLAN_BUTTONS.find((p) => p.key === selected)?.label} · {housingAreaPyeong}평 · 창짝 {windowSashCount}개
              </p>
              {(premiumProtection || pestSolution) && (
                <p className="text-gray-400 text-xs mt-1">
                  {[
                    premiumProtection && '프리미엄보양 포함',
                    pestSolution && `방충솔루션 ${pestScreenCount}개 포함`,
                  ].filter(Boolean).join(' · ')}
                </p>
              )}
            </>
          ) : (
            <p className="text-white text-base leading-relaxed font-bold">
              시공 방식을 선택하시면<br />예상 견적을 확인하실 수 있어요
            </p>
          )}
        </div>

        {/* 시공 방식 선택 */}
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-3">어떤 시공을 원하시나요?</p>
          <div className="space-y-2">
            {PLAN_BUTTONS.map((p) => {
              const isSelected = selected === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => handleSelectPlan(p.key)}
                  className={`w-full text-left p-4 border-2 transition-all ${
                    isSelected
                      ? 'border-[#b10000] bg-white'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-semibold text-sm ${isSelected ? 'text-[#b10000]' : 'text-gray-900'}`}>
                        {p.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{p.subLabel}</p>
                    </div>
                    {isSelected && <span className="text-[#b10000] text-sm font-bold">선택됨 ✓</span>}
                  </div>
                </button>
              );
            })}
          </div>

        </div>

        {/* 추가 옵션 */}
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-3">추가 옵션</p>
          <div className="space-y-3">

            {/* 프리미엄 보양 */}
            <button
              type="button"
              onClick={() => setPremiumProtection(!premiumProtection)}
              className={`w-full text-left p-4 border-2 transition-all ${
                premiumProtection
                  ? 'border-[#b10000] bg-white text-gray-900'
                  : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">프리미엄 보양</p>
                  <p className="text-xs mt-0.5 text-gray-500">
                    보양 구역 내에서만 작업하여 먼지유출을 빈틈없이 차단하는 시공 방식
                  </p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className={`text-sm font-bold ${premiumProtection ? 'text-[#b10000]' : 'text-gray-700'}`}>
                    +{PREMIUM_PROTECTION_PRICE.toLocaleString()}원
                  </p>
                </div>
              </div>
            </button>

            {/* 방충솔루션 */}
            <div className={`border-2 transition-all ${pestSolution ? 'border-[#b10000]' : 'border-gray-200'}`}>
              <button
                type="button"
                onClick={() => setPestSolution(!pestSolution)}
                className="w-full text-left p-4 bg-white text-gray-800 hover:bg-gray-50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">방충솔루션</p>
                    <p className="text-xs mt-0.5 text-gray-500">
                      방충망 틈새 차단으로 벌레 유입 원천 방지
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className={`text-sm font-bold ${pestSolution ? 'text-[#b10000]' : 'text-gray-700'}`}>
                      +{PEST_SCREEN_UNIT_PRICE.toLocaleString()}원
                    </p>
                    <p className="text-xs mt-0.5 text-gray-400">방충망 1개당</p>
                  </div>
                </div>
              </button>

              {pestSolution && (
                <div className="px-4 pb-4 bg-gray-50 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2 pt-3">방충망 수량을 입력해주세요</p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPestScreenCount(Math.max(1, pestScreenCount - 1))}
                      className="w-10 h-10 border border-gray-300 text-gray-700 text-xl flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                      −
                    </button>
                    <span className="flex-1 text-center text-gray-900 font-bold text-lg">
                      {pestScreenCount}개
                    </span>
                    <button
                      type="button"
                      onClick={() => setPestScreenCount(pestScreenCount + 1)}
                      className="w-10 h-10 border border-gray-300 text-gray-700 text-xl flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center leading-relaxed">
          위 금액은 입력된 기초 정보에 따른 예상 견적입니다.<br />
          실제 시공 환경, 창틀 모헤어 유무, 창문 상태에 따라<br />
          최종 견적은 일부 조정될 수 있습니다.
        </p>
      </div>

      {/* 하단 버튼 */}
      <div className="px-5 pb-8 pt-3 space-y-2 border-t border-gray-100 bg-white">
        <button
          onClick={goToSubmit}
          disabled={!selected}
          className="w-full py-4 bg-[#b10000] text-white font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#8b0000] transition-colors animate-cta-pulse"
        >
          이 조건으로 상담 신청하기
        </button>
        <ConsultCTABar page3Colors />
      </div>

      {/* 이탈 방지 팝업 */}
      {showExitPopup && (
        <ExitPopup
          onRequest={() => {
            setShowExitPopup(false);
            goToSubmit();
          }}
          onLater={() => {
            setShowExitPopup(false);
            setShowSmsModal(true);
          }}
        />
      )}

      {/* SMS 링크 발송 모달 */}
      {showSmsModal && <SmsLinkModal onClose={() => setShowSmsModal(false)} />}
    </div>
    </PageTransition>
  );
}

function ExitPopup({ onRequest, onLater }: { onRequest: () => void; onLater: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5">
      <div className="w-full max-w-sm bg-white p-6">
        <p className="text-lg font-bold text-gray-900 text-center mb-6">
          상담을 신청하시겠어요?
        </p>
        <div className="space-y-2">
          <button
            onClick={onRequest}
            className="w-full py-3.5 bg-[#b10000] text-white font-semibold text-sm hover:bg-[#8b0000] transition-colors"
          >
            상담 신청하기
          </button>
          <button
            onClick={onLater}
            className="w-full py-3.5 border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
          >
            나중에 볼게요
          </button>
        </div>
      </div>
    </div>
  );
}

function SmsLinkModal({ onClose }: { onClose: () => void }) {
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const {
    selectedPlan,
    premiumProtection,
    pestSolution,
    pestScreenCount,
    housingAreaPyeong,
    windowSashCount,
  } = useEstimateStore();

  const digits = phone.replace(/\D/g, '');
  const isValid = digits.length >= 10;

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (selectedPlan) params.set('plan', selectedPlan);
      if (premiumProtection) params.set('premium', '1');
      if (pestSolution) params.set('pest', String(pestScreenCount));
      if (housingAreaPyeong) params.set('pyeong', String(housingAreaPyeong));
      if (windowSashCount) params.set('sash', String(windowSashCount));
      const resultLink =
        typeof window !== 'undefined'
          ? `${window.location.origin}/estimate?${params.toString()}`
          : '';

      const res = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, link: resultLink }),
      });

      if (!res.ok) throw new Error('발송 실패');
      setDone(true);
    } catch {
      setError('문자 발송에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5">
      <div className="w-full max-w-sm bg-white p-6">
        {done ? (
          <>
            <p className="text-lg font-bold text-gray-900 text-center mb-2">발송 완료</p>
            <p className="text-sm text-gray-500 text-center mb-6">
              문자 발송이 완료되었습니다.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 transition-colors"
            >
              닫기
            </button>
          </>
        ) : (
          <>
            <p className="text-base font-bold text-gray-900 mb-2">결과 다시보기 링크 받기</p>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              연락처를 남겨주시면 결과를 다시 볼 수 있는<br />링크를 문자로 보내드릴게요
            </p>
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => {
                const d = e.target.value.replace(/\D/g, '').slice(0, 11);
                const formatted =
                  d.length < 4 ? d :
                  d.length < 8 ? `${d.slice(0, 3)}-${d.slice(3)}` :
                  `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
                setPhone(formatted);
              }}
              placeholder="010-0000-0000"
              className="w-full py-3 px-4 border-2 border-gray-200 text-sm focus:outline-none focus:border-gray-900 mb-3"
            />
            {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
            <div className="space-y-2">
              <button
                onClick={handleSubmit}
                disabled={!isValid || submitting}
                className="w-full py-3.5 bg-gray-900 text-white font-semibold text-sm disabled:opacity-40 hover:bg-gray-800 transition-colors"
              >
                {submitting ? '발송 중...' : '링크 받기'}
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 text-gray-500 text-sm"
              >
                닫기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
