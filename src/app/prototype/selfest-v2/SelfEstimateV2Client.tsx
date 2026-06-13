'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { calculatePestOnlyEstimate, calculateSelfEstimateTotals, formatKRW, type EstimateMode, type IssueKey, type PlanKey, type ProtectionKey } from '@/lib/selfEstimate';
type AddressResult = {
  roadAddr: string;
  roadAddrPart1: string;
  roadAddrPart2: string;
  jibunAddr: string;
  zipNo: string;
  buildingName: string;
};

const ISSUES: { key: IssueKey; label: string; icon: string }[] = [
  { key: 'dust', label: '먼지날림', icon: '🌫️' },
  { key: 'draft', label: '외풍유입', icon: '💨' },
  { key: 'bug', label: '벌레유입', icon: '🐛' },
  { key: 'heating', label: '냉난방비', icon: '🌡️' },
  { key: 'noise', label: '소음유입', icon: '🔊' },
  { key: 'odor', label: '악취유입', icon: '🌀' },
];

const PLANS: { key: PlanKey; label: string; desc: string }[] = [
  { key: 'fabric', label: '패브릭씰러로 교체', desc: '털날림이 없는 최고급 소재로 외풍·소음 문제 개선에 탁월합니다' },
  { key: 'mohair', label: '일반 모헤어로 교체', desc: '가성비 있게 문제를 개선할 수 있습니다' },
  { key: 'side', label: '샤시 측면만 패브릭씰러로 시공', desc: '창문을 탈거하지 않고 샤시 측면만 시공하여 가장 경제적입니다' },
];

const FAQS = [
  {
    question: '패브릭씰러와 일반 모헤어는 어떻게 다른가요?',
    answer:
      '패브릭씰러는 프리미엄 소재로 먼지날림이 없으며, 외풍·소음 개선에 더 유리합니다. 일반 모헤어는 시간이 지나면 먼지날릴 우려가 있지만 비용 부담을 낮출 수 있는 선택지입니다. 일반적으로 반려동물 또는 어린 아이가 있는 가정에서는 패브릭씰러 시공을 더 선호하십니다.',
  },
  {
    question: '창틀 레일 모헤어는 어떤 건가요?',
    answer:
      '일부 샤시는 창문의 기밀성을 높이기 위해 창틀에도 모헤어를 삽입합니다. 이 부분의 모헤어가 정상적이라면 기밀성을 높이는 데 도움이 되지만, 환경상 쉽게 마모되어 심각한 먼지날림의 원인이 되기도 합니다. 참고로 탈거하여 작업할 수 있는 유리창보다 고정되어 있는 창틀의 모헤어를 교체하는 작업이 훨씬 더 까다롭고 위험합니다.',
  },
  {
    question: '방충솔루션은 어떤 건가요?',
    answer:
      '방충망을 교체해도, 물구멍을 막아도 벌레가 들어오는 건 유입 통로가 다양하기 때문입니다. 방충솔루션은 에너지잡고에서 직접 개발하고 생산한 제품들을 사용하여 벌레의 유입 통로를 최대한 막아드리는 작업입니다. 방충망 교체까지 원하시면 상담 신청할 때 함께 남겨주세요.',
  },
  {
    question: '다른 것도 요청할 수 있나요?',
    answer:
      '창문손잡이 교체, 샤시롤러 교체, 외부유리창 청소도 가능합니다. 상담 신청할 때 원하시는 작업을 남겨주시면 가능한 범위와 비용을 먼저 안내드리고, 확인 후 진행하실 수 있도록 도와드리겠습니다.',
  },
];


const PEST_FAQS = [
  {
    question: '어떻게 벌레를 막아주는 건가요?',
    answer: '에너지잡고의 전용 풍지판, 틈새막이 등을 사용하여 확인된 벌레유입통로를 차단해 드립니다.',
  },
  {
    question: '방충솔루션 후에 벌레가 나오면 어떻게 하죠?',
    answer:
      '현장에서 벌레유입통로를 설명해 드리고 막힌 부분까지 확인시켜드릴 것입니다. 벌레는 생물이기 때문에 예상치 못한 곳으로 들어올 수 있고, 실내에서 밖으로 나가는 벌레가 창틀에서 죽는 경우도 있습니다. 방충솔루션으로 100% 차단된다고 말하기는 어렵지만 95% 이상의 창문 벌레 문제는 해결된다고 보시면 됩니다.',
  },
  {
    question: '방충망 교체도 가능한가요?',
    answer:
      '원하신다면 방충망 교체도 가능합니다. 방충망은 종류와 크기에 따라 견적금액에 차이가 커서 상담할 때 물어보시면 자세히 안내해 드리겠습니다.',
  },
];

function getEstimateMode(issues: Set<IssueKey>): EstimateMode | 'idle' {
  if (issues.size === 0) return 'idle';
  if (issues.size === 1 && issues.has('bug')) return 'pest_only';
  return 'window_seal';
}

function getRecommendation(issues: Set<IssueKey>) {
  if (
    issues.has('draft') ||
    issues.has('heating') ||
    issues.has('noise') ||
    issues.has('odor')
  ) {
    return {
      label: '패브릭씰러 또는 일반 모헤어로 교체',
      reason: '창문의 기밀 성능을 개선하여 외부 유입을 막아줍니다',
    };
  }
  if (issues.has('dust')) {
    return {
      label: '샤시 측면만 패브릭씰러 시공',
      reason: '모헤어 먼지 날림을 가성비 있게 해결합니다',
    };
  }
  return {
    label: '패브릭씰러 또는 일반 모헤어로 교체',
    reason: '집 상태와 생활 환경에 따라 가장 적합한 방법 안내',
  };
}

function getRecommendedPlanKeys(issues: Set<IssueKey>) {
  if (
    issues.has('draft') ||
    issues.has('heating') ||
    issues.has('noise') ||
    issues.has('odor')
  ) {
    return new Set<PlanKey>(['fabric', 'mohair']);
  }
  if (issues.has('dust')) return new Set<PlanKey>(['side']);
  return new Set<PlanKey>(['fabric', 'mohair']);
}

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
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return display;
}

type SelfEstimateV2ClientProps = {
  initialRestoreToken?: string;
  initialDealerCode?: string;
  initialReferralCode?: string;
  initialAdCode?: string;
};

export default function SelfEstimateV2Client({
  initialRestoreToken = '',
  initialDealerCode = '',
  initialReferralCode = '',
  initialAdCode = '',
}: SelfEstimateV2ClientProps) {
  const pathname = usePathname();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [issues, setIssues] = useState<Set<IssueKey>>(new Set());
  const [pyeong, setPyeong] = useState('25');
  const [sashCount, setSashCount] = useState('10');
  const [phone, setPhone] = useState('');
  const [roadAddress, setRoadAddress] = useState('');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressResults, setAddressResults] = useState<AddressResult[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<PlanKey | null>(null);
  const [protectionOption, setProtectionOption] = useState<ProtectionKey>('none');
  const [includeRailMohair, setIncludeRailMohair] = useState(false);
  const [pestSolution, setPestSolution] = useState(false);
  const [pestScreenCount, setPestScreenCount] = useState(1);
  const [memo, setMemo] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [showCountGuide, setShowCountGuide] = useState(false);
  const [showServiceGuide, setShowServiceGuide] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [messageSending, setMessageSending] = useState(false);
  const [messageError, setMessageError] = useState('');
  const [sentChannel, setSentChannel] = useState<'kakao' | 'sms' | 'unknown'>('unknown');
  const [restoreError, setRestoreError] = useState('');
  const [restoreToken, setRestoreToken] = useState(initialRestoreToken);
  const [isRestoring, setIsRestoring] = useState(Boolean(initialRestoreToken));
  const [pendingScrollTarget, setPendingScrollTarget] = useState<'rail' | 'pest' | 'estimate' | 'consult' | null>(null);
  const [isConsultVisible, setIsConsultVisible] = useState(false);
  const [isInlineEstimateVisible, setIsInlineEstimateVisible] = useState(false);
  const [hasReachedEstimateSection, setHasReachedEstimateSection] = useState(false);
  const [consultSubmitting, setConsultSubmitting] = useState(false);
  const [consultSubmitted, setConsultSubmitted] = useState(false);
  const [consultError, setConsultError] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const railRef = useRef<HTMLDivElement | null>(null);
  const pestRef = useRef<HTMLDivElement | null>(null);
  const estimateRef = useRef<HTMLDivElement | null>(null);
  const consultRef = useRef<HTMLDivElement | null>(null);

  const pyeongNum = Number(pyeong) || 0;
  const sashNum = Number(sashCount) || 0;
  const recommendation = useMemo(() => getRecommendation(issues), [issues]);
  const recommendedPlanKeys = useMemo(() => getRecommendedPlanKeys(issues), [issues]);
  const estimateMode = useMemo(() => getEstimateMode(issues), [issues]);

  const totals = useMemo(
    () =>
      calculateSelfEstimateTotals({
        pyeong: pyeongNum,
        sash: sashNum,
        protectionOption,
        pestSolution,
        pestScreenCount,
        includeRailMohair,
      }),
    [pyeongNum, sashNum, protectionOption, pestSolution, pestScreenCount, includeRailMohair],
  );

  const baseTotals = useMemo(
    () => calculateSelfEstimateTotals({ pyeong: pyeongNum, sash: sashNum }),
    [pyeongNum, sashNum],
  );
  const pestOnlyEstimate = useMemo(() => calculatePestOnlyEstimate(pestScreenCount), [pestScreenCount]);

  const selectedTotal = selectedPlan ? totals[selectedPlan] : 0;
  const teaserMin = Math.max(Math.floor(baseTotals.mohair / 10000) * 10000, 100000);
  const teaserMax = Math.ceil(baseTotals.fabric * 1.08 / 10000) * 10000;
  const animatedSelectedTotal = useCountUp(selectedTotal ?? 0);
  const canContinueStep1 =
    estimateMode === 'pest_only'
      ? pestScreenCount > 0
      : estimateMode === 'window_seal'
        ? pyeongNum > 0 && sashNum > 0
        : false;
  const canContinueStep2 =
    canContinueStep1 &&
    phone.replace(/\D/g, '').length >= 10 &&
    selectedAddress.trim().length > 0 &&
    privacyAgreed;
  const canSubmitConsult =
    estimateMode === 'pest_only'
      ? selectedAddress.trim().length > 0
      : !!selectedPlan && selectedAddress.trim().length > 0;

  const toggleIssue = (key: IssueKey) => {
    setMessageSent(false);
    setMessageError('');
    const next = new Set(issues);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setIssues(next);
  };

  useEffect(() => {
    const token = initialRestoreToken;
    if (!token) return;
    setRestoreToken(token);
    setIsRestoring(true);

    const restoreSession = async () => {
      try {
        const response = await fetch(`/api/self-estimate-session?token=${encodeURIComponent(token)}`);
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || '저장된 견적을 불러오지 못했습니다.');
        }

        const restoredIssues = new Set<IssueKey>(
          payload.data.issues.filter((value: string): value is IssueKey =>
            ISSUES.some((issue) => issue.key === value),
          ),
        );

        setIssues(restoredIssues);
        setPyeong(String(payload.data.pyeong ?? '25'));
        setSashCount(String(payload.data.sash ?? '10'));
        setPestScreenCount(Number(payload.data.pestScreenCount) || 1);
        setPhone(payload.data.phone);
        setSelectedAddress(payload.data.selectedAddress);
        setDetailAddress(payload.data.detailAddress ?? '');
        setPrivacyAgreed(true);
        setStep(3);
      } catch (error) {
        setRestoreError(error instanceof Error ? error.message : '저장된 견적을 불러오지 못했습니다.');
      } finally {
        setIsRestoring(false);
      }
    };

    restoreSession();
  }, [initialRestoreToken]);

  useEffect(() => {
    if (!pendingScrollTarget) return;

    const targetMap = {
      rail: railRef,
      pest: pestRef,
      estimate: estimateRef,
      consult: consultRef,
    };
    const target = targetMap[pendingScrollTarget].current;
    if (!target) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const raf = requestAnimationFrame(() => {
      target.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
      setPendingScrollTarget(null);
    });

    return () => cancelAnimationFrame(raf);
  }, [pendingScrollTarget, selectedPlan, protectionOption, includeRailMohair, pestSolution]);

  useEffect(() => {
    setHasReachedEstimateSection(false);
  }, [selectedPlan, protectionOption, includeRailMohair, pestSolution, pestScreenCount]);

  useEffect(() => {
    const target = consultRef.current;
    if (!target) {
      setIsConsultVisible(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsConsultVisible(entry.isIntersecting),
      { threshold: 0.08 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [selectedPlan, protectionOption]);

  useEffect(() => {
    const target = estimateRef.current;
    if (!target) {
      setIsInlineEstimateVisible(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInlineEstimateVisible(entry.isIntersecting);
        if (entry.isIntersecting) setHasReachedEstimateSection(true);
      },
      { threshold: 0.16 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [selectedPlan, protectionOption]);

  const sendEstimateLink = async () => {
    if (!canContinueStep2 || messageSending) return;

    setMessageSending(true);
    setMessageError('');

    try {
      const sessionResponse = await fetch('/api/self-estimate-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estimateMode: estimateMode === 'pest_only' ? 'pest_only' : 'window_seal',
          issues: Array.from(issues),
          pyeong: estimateMode === 'pest_only' ? null : pyeongNum,
          sash: estimateMode === 'pest_only' ? null : sashNum,
          pestScreenCount: estimateMode === 'pest_only' ? pestScreenCount : undefined,
          phone,
          selectedAddress,
          detailAddress: detailAddress.trim(),
          baseQuotes: estimateMode === 'pest_only' ? undefined : baseTotals,
          pestBaseQuote: estimateMode === 'pest_only' ? pestOnlyEstimate : undefined,
          dealerCode: initialDealerCode.trim(),
          referralCode: initialReferralCode.trim(),
          adCode: initialAdCode.trim(),
        }),
      });
      const sessionPayload = await sessionResponse.json();
      if (!sessionResponse.ok) {
        throw new Error(sessionPayload.error || '견적 저장에 실패했습니다.');
      }

      const resultLink =
        typeof window !== 'undefined'
          ? `${window.location.origin}/zapgoself?r=${encodeURIComponent(sessionPayload.token)}`
          : '';
      setRestoreToken(sessionPayload.token);

      const response = await fetch('/api/send-estimate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          link: resultLink,
          refCode: 'zapgoself',
          skipLeadSave: true,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || '견적 링크 발송에 실패했습니다.');
      }

      setSentChannel(payload?.channel || 'unknown');
      setMessageSent(true);
    } catch (error) {
      setMessageError(error instanceof Error ? error.message : '견적 링크 발송에 실패했습니다.');
    } finally {
      setMessageSending(false);
    }
  };

  const submitConsult = async () => {
    if (!canSubmitConsult || !restoreToken || consultSubmitting) return;

    setConsultSubmitting(true);
    setConsultError('');

    try {
      const response = await fetch('/api/self-estimate-consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: restoreToken,
          selectedAddress: selectedAddress.trim(),
          detailAddress: detailAddress.trim(),
          memo: memo.trim(),
          selectedPlan,
          protectionOption,
          includeRailMohair,
          pestSolution,
          pestScreenCount,
          dealerCode: initialDealerCode.trim(),
          referralCode: initialReferralCode.trim(),
          adCode: initialAdCode.trim(),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || '상담 신청에 실패했습니다.');
      setConsultSubmitted(true);
    } catch (error) {
      setConsultError(error instanceof Error ? error.message : '상담 신청에 실패했습니다.');
    } finally {
      setConsultSubmitting(false);
    }
  };

  const goToFirstScreen = () => {
    setStep(1);
    setMessageSent(false);
    setSelectedPlan(null);
    setProtectionOption('none');
    setIncludeRailMohair(false);
    setPestSolution(false);
    setConsultError('');
    setConsultSubmitted(false);
    setHasReachedEstimateSection(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const searchAddress = async () => {
    if (roadAddress.trim().length < 2) {
      setAddressError('도로명 주소를 두 글자 이상 입력해주세요.');
      setAddressResults([]);
      return;
    }

    setAddressLoading(true);
    setAddressError('');

    try {
      const response = await fetch(`/api/juso-search?keyword=${encodeURIComponent(roadAddress.trim())}`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || '주소 검색에 실패했습니다.');
      }
      setAddressResults(payload.data ?? []);
    } catch (error) {
      setAddressResults([]);
      setAddressError(error instanceof Error ? error.message : '주소 검색에 실패했습니다.');
    } finally {
      setAddressLoading(false);
    }
  };

  return (
    <div className="selfest-v2 min-h-screen bg-white text-[#222222]">
      <div className="mx-auto min-h-screen max-w-md bg-white">
        <header className="flex items-center justify-between px-6 pt-6">
          <img src="/LOGO_BK.webp" alt="에너지잡고" className="h-20 w-20 object-contain" />
          {pathname.startsWith('/prototype') && (
            <span className="text-xs font-medium text-[#6a6a6a]">프로토타입 v2</span>
          )}
        </header>

        <main className={`px-6 pt-6 ${step === 3 && !isConsultVisible && !isInlineEstimateVisible && !hasReachedEstimateSection ? 'pb-36' : 'pb-8'}`}>
          {isRestoring && (
            <section className="flex min-h-[55vh] flex-col items-center justify-center text-center">
              <p className="text-xs font-semibold tracking-[0.18em] text-[#b10000]">맞춤 예상 견적</p>
              <h1 className="mt-3 text-2xl font-bold">견적을 불러오고 있어요</h1>
              <p className="mt-3 text-sm leading-6 text-[#6a6a6a]">잠시만 기다려주세요.</p>
            </section>
          )}
          {!isRestoring && restoreError && (
            <div className="mb-5 rounded-[14px] border border-[#f1c7c7] bg-[#fff5f5] p-4 text-sm text-[#b10000]">
              {restoreError}
            </div>
          )}
          {!isRestoring && step === 1 && (
            <section className="space-y-6">
              <div>
                <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-[#b10000]">STEP 1</p>
                <h1 className="text-[28px] font-bold leading-tight">
                  30초면 충분해요
                </h1>
                <p className="mt-3 text-sm leading-6 text-[#6a6a6a]">
                  우리 집 시공 예상 비용을 간편하게 확인하세요.
                </p>
              </div>

              <div>
                <h2 className="mb-3 text-sm font-bold">어떤 점이 불편한가요?</h2>
                <div className="grid grid-cols-2 gap-2.5">
                  {ISSUES.map((issue) => {
                    const active = issues.has(issue.key);
                    return (
                      <button
                        key={issue.key}
                        onClick={() => toggleIssue(issue.key)}
                        className={`flex items-center gap-2 border px-3 py-3 text-sm font-medium transition ${
                          active
                            ? 'border-[#b10000] bg-[#b10000] text-white'
                            : 'border-[#dddddd] bg-white text-[#463c36]'
                        }`}
                      >
                        <span>{issue.icon}</span>
                        {issue.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {estimateMode === 'idle' && (
                <div className="rounded-[18px] border border-dashed border-[#dddddd] bg-[#fafafa] p-5 text-sm leading-6 text-[#6a6a6a]">
                  불편한 문제를 선택하면 견적 계산에 필요한 정보가 이어서 나타납니다.
                </div>
              )}

              {estimateMode === 'pest_only' && (
                <div className="space-y-4 rounded-[18px] border border-[#eeeeee] bg-[#fafafa] p-4">
                  <h2 className="text-sm font-bold">견적 계산에 필요한 정보예요</h2>
                  <div className="rounded-[14px] border border-[#dddddd] bg-white p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-bold">방충망 수량</p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setPestScreenCount((v) => Math.max(1, v - 1))}
                          className="h-9 w-9 border border-[#dddddd] text-lg"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-lg font-bold">{pestScreenCount}</span>
                        <button
                          onClick={() => setPestScreenCount((v) => v + 1)}
                          className="h-9 w-9 border border-[#dddddd] text-lg"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {estimateMode === 'window_seal' && (
                <div className="space-y-3">
                  <h2 className="text-sm font-bold">견적 계산에 필요한 정보예요</h2>
                  <label className="block">
                    <span className="mb-1.5 block text-xs text-[#6a6a6a]">평형</span>
                    <div className="flex items-center rounded-[14px] border border-[#dddddd] bg-white">
                      <input
                        value={pyeong}
                        onChange={(e) => setPyeong(e.target.value)}
                        inputMode="numeric"
                        className="w-full bg-transparent px-4 py-4 text-lg outline-none"
                      />
                      <span className="pr-4 text-sm text-[#6a6a6a]">평</span>
                    </div>
                  </label>
                  <label className="block">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="block text-xs text-[#6a6a6a]">유리창 개수</span>
                      <button
                        onClick={() => setShowCountGuide(true)}
                        className="text-xs font-semibold text-[#b10000]"
                      >
                        유리창 개수 세는 법 보기
                      </button>
                    </div>
                    <div className="flex items-center rounded-[14px] border border-[#dddddd] bg-white">
                      <input
                        value={sashCount}
                        onChange={(e) => setSashCount(e.target.value)}
                        inputMode="numeric"
                        className="w-full bg-transparent px-4 py-4 text-lg outline-none"
                      />
                      <span className="pr-4 text-sm text-[#6a6a6a]">개</span>
                    </div>
                    <p className="mt-1.5 text-xs leading-5 text-[#6a6a6a]">
                      유리창 한 판씩 세어서 총개수를 입력해 주세요
                    </p>
                  </label>
                </div>
              )}

              {estimateMode === 'window_seal' && (
                <a
                  href="https://www.youtube.com/watch?v=_tq8gXHrhe4"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[14px] border border-[#dddddd] bg-[#f7f7f7] px-4 py-3.5 text-sm font-semibold text-[#463c36] transition hover:border-[#b10000] hover:text-[#b10000]"
                >
                  <span aria-hidden>▶</span>
                  실제 시공 사례 영상 보기
                </a>
              )}

              {estimateMode !== 'idle' && !messageSent && (
                <section className="space-y-3 rounded-[18px] border border-[#eeeeee] p-4">
                  <div>
                    <h2 className="text-lg font-bold leading-7">
                      {estimateMode === 'pest_only' ? '방충솔루션 맞춤 견적 링크를 보내 드릴게요' : '출장비를 포함한 맞춤 견적 링크를 보내 드릴게요'}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[#6a6a6a]">
                      {estimateMode === 'pest_only'
                        ? '방충망 수량을 조정하며 예상 금액을 확인할 수 있어요.'
                        : '직접 시공 방식과 옵션을 바꿔가며 금액을 조정해 보세요.'}
                    </p>
                  </div>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="견적 링크를 받을 휴대폰 번호"
                    className="w-full rounded-[14px] border border-[#dddddd] bg-white px-4 py-4 outline-none"
                  />
                  <button
                    onClick={() => setShowAddressModal(true)}
                    className="w-full border border-[#b10000] px-4 py-4 text-left text-sm font-bold text-[#b10000]"
                  >
                    {selectedAddress ? selectedAddress : '도로명 주소 검색'}
                  </button>
                  {selectedAddress && (
                    <div className="space-y-2 rounded-[14px] border border-[#dddddd] bg-[#f7f7f7] p-3 text-sm">
                      <p>선택한 주소: <span className="font-bold">{selectedAddress}</span></p>
                      <input
                        value={detailAddress}
                        onChange={(e) => setDetailAddress(e.target.value)}
                        placeholder="상세주소 (선택) · 동·호수는 나중에 입력해도 괜찮아요"
                        className="w-full rounded-[10px] border border-[#dddddd] bg-white px-3 py-3 text-sm outline-none"
                      />
                    </div>
                  )}
                  <label className="flex items-start gap-2 text-sm leading-6 text-[#6a6a6a]">
                    <input
                      type="checkbox"
                      checked={privacyAgreed}
                      onChange={(e) => setPrivacyAgreed(e.target.checked)}
                      className="mt-1"
                    />
                    <span>
                      견적 안내 및 상담을 위해 개인정보 수집·이용에 동의합니다
                      <span className="block text-xs text-[#8d8178]">
                        수집 항목: 연락처, 도로명 주소, 상세주소 / 이용 목적: 견적 링크 발송 및 상담 응대
                      </span>
                    </span>
                  </label>
                  <button
                    disabled={!canContinueStep2 || messageSending}
                    onClick={sendEstimateLink}
                    className="w-full bg-[#b10000] py-4 text-base font-medium text-white disabled:opacity-40"
                  >
                    {messageSending ? '견적 링크 보내는 중...' : estimateMode === 'pest_only' ? '방충솔루션 맞춤 견적 링크 받기' : '맞춤 견적 링크 받기'}
                  </button>
                  {messageError && <p className="text-sm text-[#b10000]">{messageError}</p>}
                </section>
              )}

              {estimateMode !== 'idle' && messageSent && (
                <section className="space-y-4 rounded-[14px] border border-[#dddddd] bg-white p-5">
                  <p className="text-xs font-semibold tracking-[0.18em] text-[#b10000]">견적 링크 발송 완료</p>
                  <h2 className="text-2xl font-bold leading-tight">
                    맞춤 견적 링크를<br />{sentChannel === 'kakao' ? '카카오톡으로 보내드렸어요' : '문자로 보내드렸어요'}
                  </h2>
                  <p className="text-sm leading-6 text-[#6a6a6a]">
                    받은 링크를 눌러 예상 금액을 확인하고, 필요한 경우 상담을 신청해 주세요.
                  </p>
                  <button
                    onClick={sendEstimateLink}
                    disabled={messageSending}
                    className="w-full bg-[#b10000] py-4 text-base font-medium text-white disabled:opacity-40"
                  >
                    {messageSending ? '견적 링크 보내는 중...' : '견적 링크 다시 보내기'}
                  </button>
                  <SupportActions />
                </section>
              )}
            </section>
          )}

          {!isRestoring && step === 2 && !messageSent && (
            <section className="space-y-6">
              <button onClick={() => setStep(1)} className="text-sm text-[#6a6a6a]">
                ← 뒤로
              </button>

              <div>
                <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-[#b10000]">STEP 2</p>
                <h1 className="text-[26px] font-bold leading-tight">
                  거의 다 됐어요
                </h1>
              </div>

              {estimateMode === 'window_seal' && (
                <a
                  href="https://www.youtube.com/watch?v=_tq8gXHrhe4"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 border border-[#dddddd] bg-[#f7f7f7] px-4 py-3 text-sm font-semibold text-[#463c36] transition hover:border-[#b10000] hover:text-[#b10000]"
                >
                  <span aria-hidden>▶</span>
                  실제 시공 사례 영상 보기
                </a>
              )}

              <div>
                <h2 className="text-lg font-bold leading-7">
                  {estimateMode === 'pest_only' ? '방충솔루션 맞춤 견적 링크를 보내 드릴게요' : '출장비를 포함한 맞춤 견적 링크를 보내 드릴게요'}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#6a6a6a]">
                  {estimateMode === 'pest_only'
                    ? '방충망 수량을 조정하며 예상 금액을 확인할 수 있어요.'
                    : '직접 시공 방식과 옵션을 바꿔가며 금액을 조정해 보세요.'}
                </p>
              </div>

              <div className="space-y-3">
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="견적 링크를 받을 휴대폰 번호"
                  className="w-full rounded-[14px] border border-[#dddddd] bg-white px-4 py-4 outline-none"
                />
                <button
                  onClick={() => setShowAddressModal(true)}
                  className="w-full border border-[#b10000] px-4 py-4 text-left text-sm font-bold text-[#b10000]"
                >
                  도로명 주소 검색
                </button>
                {selectedAddress && (
                  <div className="space-y-2 rounded-[14px] border border-[#dddddd] bg-[#f7f7f7] p-3 text-sm">
                    <p>선택한 주소: <span className="font-bold">{selectedAddress}</span></p>
                    <input
                      value={detailAddress}
                      onChange={(e) => setDetailAddress(e.target.value)}
                      placeholder="상세주소 (선택) · 동·호수는 나중에 입력해도 괜찮아요"
                      className="w-full rounded-[10px] border border-[#dddddd] bg-white px-3 py-3 text-sm outline-none"
                    />
                  </div>
                )}
                <label className="flex items-start gap-2 text-sm leading-6 text-[#6a6a6a]">
                  <input
                    type="checkbox"
                    checked={privacyAgreed}
                    onChange={(e) => setPrivacyAgreed(e.target.checked)}
                    className="mt-1"
                  />
                  <span>
                    견적 안내 및 상담을 위해 개인정보 수집·이용에 동의합니다
                    <span className="block text-xs text-[#8d8178]">
                      수집 항목: 연락처, 도로명 주소, 상세주소 / 이용 목적: 견적 안내 및 상담 응대
                    </span>
                  </span>
                </label>
              </div>

              <button
                disabled={!canContinueStep2 || messageSending}
                onClick={sendEstimateLink}
                className="w-full bg-[#b10000] py-4 text-base font-medium text-white disabled:opacity-40"
              >
                {messageSending ? '견적 링크 보내는 중...' : estimateMode === 'pest_only' ? '방충솔루션 맞춤 견적 링크 받기' : '맞춤 견적 링크 받기'}
              </button>
              {messageError && <p className="text-sm text-[#b10000]">{messageError}</p>}
              <p className="text-center text-sm text-[#6a6a6a]">
                궁금한 점이 있나요?{' '}
                <a href="http://pf.kakao.com/_PjwDxj/chat" target="_blank" rel="noreferrer" className="font-semibold text-[#b10000]">💬 카톡문의</a> ·{' '}
                <a href="tel:1600-9195" className="font-semibold text-[#b10000]">📞 전화문의</a>
              </p>
            </section>
          )}

          {!isRestoring && step === 2 && messageSent && (
            <section className="space-y-6">
              <button onClick={() => setMessageSent(false)} className="text-sm text-[#6a6a6a]">
                ← 뒤로
              </button>
              <div className="rounded-[14px] border border-[#dddddd] bg-white p-5">
                <p className="text-xs font-semibold tracking-[0.18em] text-[#b10000]">견적 링크 발송 완료</p>
                <h1 className="mt-3 text-2xl font-bold leading-tight">
                  맞춤 견적 링크를
                  <br />
                  {sentChannel === 'kakao' ? '카카오톡으로 보내드렸어요' : '문자로 보내드렸어요'}
                </h1>
                <p className="mt-3 text-sm leading-6 text-[#6a6a6a]">
                  받은 링크를 눌러, 직접 옵션을 조정해 보세요.
                </p>
              </div>
              <button
                onClick={sendEstimateLink}
                disabled={messageSending}
                className="w-full bg-[#b10000] py-4 text-base font-medium text-white disabled:opacity-40"
              >
                {messageSending ? '견적 링크 보내는 중...' : '견적 링크 다시 보내기'}
              </button>
              {messageError && <p className="text-sm text-[#b10000]">{messageError}</p>}
              <SupportActions />
            </section>
          )}

          {!isRestoring && step === 3 && estimateMode === 'pest_only' && (
            <section className="space-y-6">
              <button onClick={goToFirstScreen} className="text-sm text-[#6a6a6a]">
                ← 첫 화면으로
              </button>

              <section>
                <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-[#b10000]">맞춤 예상 견적</p>
                <h1 className="text-[28px] font-bold leading-tight">방충솔루션 예상 견적</h1>
                <p className="mt-3 text-sm leading-6 text-[#6a6a6a]">
                  입력하신 방충망 수량 기준으로 예상 금액을 계산했어요.
                </p>
              </section>

              <section className="rounded-[20px] border border-[#f0d6d1] bg-[#fff8f6] p-5">
                <p className="text-sm text-[#6a6a6a]">현재 선택 기준 예상 견적</p>
                <p className="mt-2 text-4xl font-black text-[#b10000]">{formatKRW(pestOnlyEstimate.total)}</p>
                <p className="mt-3 text-xs leading-5 text-[#8d8178]">
                  창호 구조와 현장 상태에 따라 최종 금액은 달라질 수 있습니다.
                </p>
              </section>

              <section className="space-y-3 rounded-[18px] border border-[#eeeeee] p-4">
                <h2 className="text-lg font-bold">방충망 수량을 조정해보세요</h2>
                <div className="flex items-center justify-between rounded-[14px] border border-[#dddddd] bg-white p-4">
                  <button onClick={() => setPestScreenCount((v) => Math.max(1, v - 1))} className="h-10 w-10 border border-[#dddddd] text-xl">−</button>
                  <p className="text-3xl font-bold">{pestScreenCount}</p>
                  <button onClick={() => setPestScreenCount((v) => v + 1)} className="h-10 w-10 border border-[#dddddd] text-xl">+</button>
                </div>
              </section>

              <section className="space-y-3 rounded-[18px] border border-[#eeeeee] bg-[#fafafa] p-4">
                <h2 className="text-lg font-bold">견적 계산 내역</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-[#6a6a6a]">출장비</span><span className="font-bold">{formatKRW(pestOnlyEstimate.visitFee)}</span></div>
                  <div className="flex justify-between"><span className="text-[#6a6a6a]">방충솔루션</span><span className="font-bold">{formatKRW(pestOnlyEstimate.unitPrice)} × {pestOnlyEstimate.screenCount}개</span></div>
                  <div className="flex justify-between border-t border-[#dddddd] pt-3 text-base"><span className="font-bold">예상 견적</span><span className="font-black text-[#b10000]">{formatKRW(pestOnlyEstimate.total)}</span></div>
                </div>
              </section>

              <section ref={consultRef} className="space-y-3 rounded-[18px] border border-[#eeeeee] p-4">
                <h2 className="text-lg font-bold">이 조건으로 상담받기</h2>
                <div className="rounded-[14px] bg-[#f7f7f7] p-3 text-sm">연락처 <span className="ml-2 font-bold">{phone || '입력됨'}</span></div>
                <div className="space-y-3 rounded-[14px] bg-[#f7f7f7] p-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <p>주소 <span className="ml-2 font-bold">{`${selectedAddress} ${detailAddress}`.trim() || '주소를 선택해주세요'}</span></p>
                    <button onClick={() => setShowAddressModal(true)} className="shrink-0 rounded-full border border-[#b10000] px-3 py-1.5 text-xs font-bold text-[#b10000]">주소 변경</button>
                  </div>
                </div>
                <label className="block">
                  <span className="mb-1.5 block text-xs text-[#6a6a6a]">상세주소 (선택)</span>
                  <input
                    value={detailAddress}
                    onChange={(e) => setDetailAddress(e.target.value)}
                    placeholder="동·호수 등 상세주소"
                    className="w-full rounded-[14px] border border-[#dddddd] bg-white px-4 py-4 outline-none"
                  />
                </label>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="벌레가 주로 들어오는 위치나 요청사항을 남겨주세요."
                  rows={4}
                  className="w-full rounded-[14px] border border-[#dddddd] px-4 py-4 outline-none"
                />
                <button
                  disabled={!canSubmitConsult || consultSubmitting || consultSubmitted}
                  onClick={submitConsult}
                  className="w-full bg-[#b10000] py-4 text-base font-medium text-white disabled:opacity-40"
                >
                  {consultSubmitted ? '상담 신청 완료' : consultSubmitting ? '상담 신청 중...' : '이 조건으로 상담 신청하기'}
                </button>
                {consultError && <p className="text-sm text-[#b10000]">{consultError}</p>}
                {consultSubmitted && (
                  <p className="text-sm font-semibold text-[#145c4c]">상담 신청이 접수되었습니다. 담당자가 확인 후 연락드릴게요.</p>
                )}
              </section>

              <section className="space-y-2">
                <h2 className="text-lg font-bold">자주 묻는 질문</h2>
                {PEST_FAQS.map((faq) => (
                  <div key={faq.question} className="border border-[#dddddd] bg-white p-4">
                    <p className="font-bold">{faq.question}</p>
                    <p className="mt-2 text-sm leading-6 text-[#6a6a6a]">{faq.answer}</p>
                  </div>
                ))}
              </section>

              <button onClick={goToFirstScreen} className="w-full border border-[#dddddd] py-3 text-sm font-bold text-[#6a6a6a]">
                첫 화면으로 돌아가기
              </button>
              <SupportActions />
            </section>
          )}

          {!isRestoring && step === 3 && estimateMode !== 'pest_only' && (
            <section className="space-y-5">
              <button onClick={goToFirstScreen} className="text-sm text-[#6a6a6a]">
                ← 첫 화면으로
              </button>

              <div className="space-y-3">
                <p className="text-xs font-semibold tracking-[0.18em] text-[#b10000]">맞춤 예상 견적</p>
                <h2 className="text-lg font-bold">원하는 방식으로 견적을 조정해보세요</h2>
                <p className="text-sm leading-6 text-[#6a6a6a]">
                  시공 방식과 옵션을 바꾸면 예상 금액에 바로 반영됩니다.
                </p>
                {PLANS.map((plan) => {
                  const active = selectedPlan === plan.key;
                  return (
                    <button
                      key={plan.key}
                      onClick={() => { setSelectedPlan(plan.key); setProtectionOption('none'); setPendingScrollTarget('rail'); }}
                      className={`w-full border p-4 text-left transition ${
                        active
                          ? 'border-[#b10000] bg-[#fff1ee]'
                          : 'border-[#dddddd] bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{plan.label}</span>
                          {recommendedPlanKeys.has(plan.key) && (
                            <span className="bg-[#b10000] px-2 py-0.5 text-[11px] font-medium text-white">추천</span>
                          )}
                        </div>
                        {active && <span className="text-xs font-bold text-[#b10000]">선택됨</span>}
                      </div>
                      <p className="mt-1 text-sm text-[#6a6a6a]">{plan.desc}</p>
                    </button>
                  );
                })}
              </div>

              {selectedPlan && protectionOption && (
              <div ref={railRef} className="scroll-mt-6 space-y-3">
                <div>
                  <h2 className="text-sm font-bold">창틀 레일 모헤어도 교체할까요?</h2>
                  <p className="mt-1 text-sm leading-6 text-[#6a6a6a]">
                    창틀 레일 쪽 모헤어 여부 확인이 어려우시면 현장에서 추가하실 수 있습니다.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setIncludeRailMohair(false); setPendingScrollTarget(issues.has('bug') ? 'pest' : 'estimate'); }}
                    className={`border p-4 text-left ${
                      !includeRailMohair
                        ? 'border-[#b10000] bg-[#fff1ee]'
                        : 'border-[#dddddd] bg-white'
                    }`}
                  >
                    <p className="font-bold">추가하지 않기</p>
                    <p className="mt-1 text-sm text-[#6a6a6a]">유리창 모헤어만 교체</p>
                  </button>
                  <button
                    onClick={() => { setIncludeRailMohair(true); setPendingScrollTarget(issues.has('bug') ? 'pest' : 'estimate'); }}
                    className={`border p-4 text-left ${
                      includeRailMohair
                        ? 'border-[#b10000] bg-[#fff1ee]'
                        : 'border-[#dddddd] bg-white'
                    }`}
                  >
                    <p className="font-bold">창틀 모헤어 교체</p>
                    <p className="mt-1 text-sm text-[#6a6a6a]">레일 쪽 모헤어까지 함께 시공</p>
                  </button>
                </div>
              </div>
              )}

              {selectedPlan && protectionOption && issues.has('bug') && (
                <div ref={pestRef} className="scroll-mt-6 space-y-3">
                  <div>
                    <h2 className="text-sm font-bold">벌레 유입이 걱정되면 방충솔루션도 추가할 수 있어요</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => { setPestSolution(false); setPendingScrollTarget('estimate'); }}
                      className={`border p-4 text-left ${
                        !pestSolution
                          ? 'border-[#b10000] bg-[#fff1ee]'
                          : 'border-[#dddddd] bg-white'
                      }`}
                    >
                      <p className="font-bold">추가하지 않기</p>
                      <p className="mt-1 text-sm text-[#6a6a6a]">기본 시공만</p>
                    </button>
                    <button
                      onClick={() => { setPestSolution(true); }}
                      className={`border p-4 text-left ${
                        pestSolution
                          ? 'border-[#b10000] bg-[#fff1ee]'
                          : 'border-[#dddddd] bg-white'
                      }`}
                    >
                      <p className="font-bold">방충솔루션 추가</p>
                      <p className="mt-1 text-sm text-[#6a6a6a]">수량 선택 가능</p>
                    </button>
                  </div>
                  {pestSolution && (
                    <div className="border border-[#dddddd] bg-white p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold">방충망 수량</p>
                          <p className="mt-1 text-sm text-[#6a6a6a]">개당 23,000원</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setPestScreenCount((v) => Math.max(1, v - 1))}
                            className="h-9 w-9 border border-[#dddddd] text-lg"
                          >
                            −
                          </button>
                          <span className="w-5 text-center font-bold">{pestScreenCount}</span>
                          <button
                            onClick={() => setPestScreenCount((v) => v + 1)}
                            className="h-9 w-9 border border-[#dddddd] text-lg"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedPlan && (
              <div ref={estimateRef} className="scroll-mt-6 border border-[#ebebeb] bg-[#f7f7f7] p-4">
                <p className="text-sm text-[#6a6a6a]">현재 선택 기준 예상 견적</p>
                {selectedTotal > 0 ? (
                  <p className="mt-1 text-3xl font-bold">{formatKRW(animatedSelectedTotal)}</p>
                ) : (
                  <p className="mt-1 text-lg font-bold text-[#6a6a6a]">
                    시공 방식을 선택하면 예상 금액이 계산돼요
                  </p>
                )}
                <p className="mt-3 text-sm leading-6 text-[#6a6a6a]">
                  기본 보양 작업이 포함된 예상 금액입니다. 창호 구조와 현장 상태에 따라 최종 금액은 달라질 수 있습니다. 상담을 통해 시공대상이나 방법을 조율하여 원하시는 예산에 맞춰드릴 수 있습니다.
                </p>
              </div>
              )}

              {selectedPlan && protectionOption && (
              <div ref={consultRef} className="scroll-mt-6 space-y-3 border-t border-[#dddddd] pt-5">
                <h2 className="text-lg font-bold">이 조건으로 상담받기</h2>
                <div className="rounded-[14px] border border-[#dddddd] bg-[#f7f7f7] px-4 py-4 text-sm">
                  연락처 <span className="ml-2 font-bold">{phone || '입력됨'}</span>
                </div>
                <div className="space-y-3 rounded-[14px] border border-[#dddddd] bg-[#f7f7f7] p-4 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-[#6a6a6a]">상담받을 주소</p>
                      <p className="mt-1 font-bold leading-6">{selectedAddress || '주소를 선택해주세요'}</p>
                    </div>
                    <button
                      onClick={() => setShowAddressModal(true)}
                      className="shrink-0 rounded-full border border-[#b10000] px-3 py-1.5 text-xs font-bold text-[#b10000]"
                    >
                      주소 변경
                    </button>
                  </div>
                  <p className="text-xs leading-5 text-[#8d8178]">STEP2에서 입력한 주소를 불러왔어요. 필요하면 수정할 수 있습니다.</p>
                </div>
                <label className="block">
                  <span className="mb-1.5 block text-xs text-[#6a6a6a]">상세주소 (선택)</span>
                  <input
                    value={detailAddress}
                    onChange={(e) => setDetailAddress(e.target.value)}
                    placeholder="동·호수 등 상세주소"
                    className="w-full rounded-[14px] border border-[#dddddd] bg-white px-4 py-4 outline-none"
                  />
                </label>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="미리 전달하실 내용이 있다면 편하게 남겨주세요."
                  rows={4}
                  className="w-full rounded-[14px] border border-[#dddddd] bg-white px-4 py-4 outline-none"
                />
                <button
                  disabled={!canSubmitConsult || consultSubmitting || consultSubmitted}
                  onClick={submitConsult}
                  className="w-full bg-[#b10000] py-4 text-base font-medium text-white disabled:opacity-40"
                >
                  {consultSubmitted
                    ? '상담 신청 완료'
                    : consultSubmitting
                      ? '상담 신청 중...'
                      : '이 조건으로 상담 신청하기'}
                </button>
                {consultError && <p className="text-sm text-[#b10000]">{consultError}</p>}
                {consultSubmitted && (
                  <p className="text-sm font-semibold text-[#145c4c]">
                    상담 신청이 접수되었습니다. 담당자가 확인 후 연락드릴게요.
                  </p>
                )}
              </div>
              )}

              {selectedPlan && protectionOption && (
              <div className="space-y-3">
                <div>
                  <h2 className="text-lg font-bold">자주 묻는 질문</h2>
                </div>
                <div className="space-y-2">
                  {FAQS.map((faq, index) => {
                    const isOpen = openFaqIndex === index;
                    return (
                      <div key={faq.question} className="border border-[#dddddd] bg-white">
                        <button
                          onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                          className="flex w-full items-center justify-between gap-4 p-4 text-left"
                        >
                          <span className="font-bold">{faq.question}</span>
                          <span className="text-lg text-[#6a6a6a]">{isOpen ? '−' : '+'}</span>
                        </button>
                        {isOpen && (
                          <p className="border-t border-[#ebebeb] px-4 py-4 text-sm leading-6 text-[#6a6a6a]">
                            {faq.answer}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              )}
              <SupportActions />
            </section>
          )}
        </main>
      </div>

      {!isRestoring && step === 3 && estimateMode !== 'pest_only' && !isConsultVisible && !isInlineEstimateVisible && !hasReachedEstimateSection && (
        <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)]">
          <div className="mx-auto max-w-md rounded-[14px] border border-[#ebebeb] bg-white/95 p-4 shadow-[0_-8px_24px_rgba(0,0,0,0.12)] backdrop-blur">
            <p className="text-xs text-[#6a6a6a]">현재 선택 기준 예상 견적</p>
            <p className="mt-1 text-2xl font-bold text-[#222222]">{formatKRW(animatedSelectedTotal)}</p>
            {selectedTotal === 0 && (
              <p className="mt-1 text-xs leading-5 text-[#8d8178]">시공 방식을 선택하면 기본 견적이 바로 계산돼요.</p>
            )}
          </div>
        </div>
      )}

      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4">
          <div className="w-full max-w-md bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold">주소 선택</h2>
              <button onClick={() => setShowAddressModal(false)} className="text-sm text-[#6a6a6a]">
                닫기
              </button>
            </div>
            <p className="mb-3 text-sm text-[#6a6a6a]">
              도로명 주소를 입력하고 가장 가까운 결과를 선택해주세요.
            </p>
            <input
              value={roadAddress}
              onChange={(e) => setRoadAddress(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') searchAddress();
              }}
              placeholder="도로명 주소를 입력해주세요"
              className="mb-3 w-full border border-[#dddddd] bg-white px-4 py-4 outline-none"
            />
            <button
              onClick={searchAddress}
              className="mb-3 w-full border border-[#b10000] bg-[#b10000] px-4 py-3 text-sm font-bold text-white"
            >
              주소 검색
            </button>
            {addressError && <p className="mb-3 text-sm text-[#b10000]">{addressError}</p>}
            {addressLoading && <p className="mb-3 text-sm text-[#6a6a6a]">검색 중입니다...</p>}
            <div className="space-y-2">
              {addressResults.map((item) => (
                <button
                  key={`${item.roadAddr}-${item.zipNo}`}
                  onClick={() => {
                    setSelectedAddress(item.roadAddr);
                    setShowAddressModal(false);
                  }}
                  className="w-full border border-[#dddddd] p-3 text-left text-sm hover:border-[#b10000]"
                >
                  <span className="block font-medium">{item.roadAddr}</span>
                  {item.jibunAddr && (
                    <span className="mt-1 block text-xs text-[#6a6a6a]">{item.jibunAddr}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showCountGuide && <CountGuideModal onClose={() => setShowCountGuide(false)} />}

      {showServiceGuide && (
        <SimpleModal
          title="시공 방식 차이"
          body="패브릭씰러는 외풍·소음 개선에 강하고, 일반 모헤어는 더 낮은 비용으로 교체할 수 있습니다. 측면 시공은 창문을 떼지 않고 빠르게 진행하는 방식입니다."
          onClose={() => setShowServiceGuide(false)}
        />
      )}

    </div>
  );
}

function SupportActions() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <a
        href="http://pf.kakao.com/_PjwDxj/chat"
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-2 border border-[#f4d900] bg-[#fee500] py-3.5 text-sm font-bold text-[#3c1e1e] shadow-[0_1px_0_rgba(0,0,0,0.08)] transition hover:-translate-y-0.5"
      >
        <span aria-hidden>💬</span>
        카톡문의
      </a>
      <a
        href="tel:1600-9195"
        className="flex items-center justify-center gap-2 border border-[#b9e6db] bg-[#e8f8f4] py-3.5 text-sm font-bold text-[#145c4c] shadow-[0_1px_0_rgba(0,0,0,0.08)] transition hover:-translate-y-0.5"
      >
        <span aria-hidden>📞</span>
        전화문의
      </a>
    </div>
  );
}

function CountGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">유리창 개수 세는 법 보기</h2>
          <button onClick={onClose} className="text-sm text-[#6a6a6a]">
            닫기
          </button>
        </div>
        <div className="mt-4 aspect-video bg-black">
          <iframe
            className="h-full w-full"
            src="https://www.youtube.com/embed/mxnY3c9pPrc"
            title="유리창 개수 세는 방법"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}

function SimpleModal({
  title,
  body,
  onClose,
}: {
  title: string;
  body: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">{title}</h2>
          <button onClick={onClose} className="text-sm text-[#6a6a6a]">
            닫기
          </button>
        </div>
        <p className="mt-4 text-sm leading-6 text-[#6a6a6a]">{body}</p>
      </div>
    </div>
  );
}
