'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useEstimateStore } from '@/store/estimateStore';
import { supabase } from '@/lib/supabase';
import PageTransition from '@/components/PageTransition';
import ConsultCTABar from '@/components/ConsultCTABar';

// 견적 계산 (estimate 페이지와 동일한 로직)
const LABOR_PER_WORKER = 250_000;
const FABRIC_FOUR_UNIT = 30_000;
const SIDE_ONLY_UNIT = 15_000;
const MOHAIR_PER_PYEONG = 35_000;
const VAT_RATE = 1.1;

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

function calcEstimate(
  pyeong: number,
  sashCount: number,
  plan: 'main' | 'alt1' | 'alt2',
  premiumProtection: boolean,
  pestSolution: boolean,
  pestScreenCount: number
): number {
  const optionCost = (premiumProtection ? 80_000 : 0) + (pestSolution ? pestScreenCount * 23_000 : 0);

  // 일반 모헤어는 평형 기준 간편 계산 (VAT 미포함)
  if (plan === 'alt1') return pyeong * MOHAIR_PER_PYEONG + optionCost;

  const workerCount = plan === 'alt2' ? 1 : getWorkerCount(pyeong);
  const laborCost = LABOR_PER_WORKER * workerCount;
  const unitPrice = plan === 'alt2' ? SIDE_ONLY_UNIT : FABRIC_FOUR_UNIT;
  return withVAT(laborCost + sashCount * unitPrice + optionCost);
}

const SURVEY_LABELS: Record<string, string> = {
  dust: '먼지날림',
  draft: '외풍유입',
  bug: '벌레유입',
  heating_cost: '냉난방비',
  noise: '소음유입',
  odor: '악취유입',
};

function formatKRW(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원';
}

export default function SubmitPage() {
  const router = useRouter();
  const {
    housingAreaPyeong,
    windowSashCount,
    premiumProtection,
    pestSolution,
    pestScreenCount,
    selectedPlan,
    surveyAnswers,
    refCode,
    reset,
  } = useEstimateStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [extraRequest, setExtraRequest] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const intentionalNav = useRef(false);

  // 이탈 방지 팝업 (뒤로가기 1회 인터셉트)
  useEffect(() => {
    let popupShown = false;
    if (window.history.state?.submitGuard !== true) {
      window.history.pushState({ submitGuard: true }, '');
    }

    const onPopState = () => {
      if (popupShown || intentionalNav.current) return;
      popupShown = true;
      window.history.pushState({ submitGuard: true }, '');
      setShowExitPopup(true);
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // 세 가지 견적 금액 (VAT 포함)
  const mainTotal =
    housingAreaPyeong && windowSashCount
      ? calcEstimate(housingAreaPyeong, windowSashCount, 'main', premiumProtection, pestSolution, pestScreenCount)
      : null;
  const alt1Total =
    housingAreaPyeong && windowSashCount
      ? calcEstimate(housingAreaPyeong, windowSashCount, 'alt1', premiumProtection, pestSolution, pestScreenCount)
      : null;
  const alt2Total =
    housingAreaPyeong && windowSashCount
      ? calcEstimate(housingAreaPyeong, windowSashCount, 'alt2', premiumProtection, pestSolution, pestScreenCount)
      : null;

  const selectedTotal = selectedPlan === 'alt1' ? alt1Total : selectedPlan === 'alt2' ? alt2Total : mainTotal;

  // 겪고있는 문제
  const issues = Object.entries(surveyAnswers)
    .filter(([, val]) => val !== null && (val as number) > 0)
    .map(([key]) => SURVEY_LABELS[key] || key)
    .join(', ');

  const handleSubmit = async () => {
    if (!name || !phone || !address) { setError('이름, 연락처, 주소는 필수 입력 항목입니다'); return; }
    if (!housingAreaPyeong || !windowSashCount || !mainTotal) { setError('견적 정보가 없습니다. 다시 시작해주세요'); return; }

    setSubmitting(true);
    setError('');

    try {
      const emailPayload = {
        name, phone, address, preferredDate, extraRequest,
        housingAreaPyeong, windowSashCount, selectedPlan,
        premiumProtection, pestSolution, pestScreenCount,
        issues,
        mainTotal,
        alt1Total,
        alt2Total,
        refCode,
      };

      // 1. 이메일 발송 (최우선 — DB 실패와 무관하게 수신)
      const emailRes = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload),
      });
      if (!emailRes.ok) {
        const emailErr = await emailRes.json();
        console.error('이메일 발송 실패:', emailErr);
      }

      // 2. DB 저장 (실패해도 이메일은 이미 발송됨)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

        const custRes = await fetch('/api/customers', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name,
            phone,
            address: address || '',
            status: 'NEW',
            issues: [],
            notes: [
              issues && `문제: ${issues}`,
              extraRequest,
              `시공방식: ${selectedPlan}`,
              `평형: ${housingAreaPyeong}평`,
              `창짝: ${windowSashCount}개`,
              premiumProtection ? '프리미엄보양' : '',
              pestSolution ? `방충솔루션 ${pestScreenCount}개` : '',
            ].filter(Boolean).join(' / '),
            desired_quote_date: preferredDate || null,
            ref_code: refCode || null,
            tenant_id: null,
            created_by: null,
          }),
        });
        if (!custRes.ok) {
          const dbErr = await custRes.json();
          console.error('DB 저장 실패:', JSON.stringify(dbErr));
        }
      } catch (dbErr) {
        console.error('DB 저장 오류:', dbErr);
      }

      setSubmitted(true);
      reset();
    } catch (err) {
      console.error('제출 오류:', err);
      setError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <PageTransition>
      <div className="flex flex-col min-h-screen items-center justify-center px-5 text-center">
        <div className="w-16 h-16 bg-green-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✓</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">상담 신청 완료!</h1>
        <p className="text-sm text-gray-500 mb-2">접수되었습니다. 담당자가 연락드릴 예정입니다.</p>
        {selectedTotal && (
          <p className="text-base font-semibold text-gray-800 mb-6">
            예상 금액: {formatKRW(selectedTotal)} (VAT포함)
          </p>
        )}
        <button
          onClick={() => router.push('/selfest')}
          className="w-full max-w-xs py-4 bg-gray-900 text-white font-semibold"
        >
          홈으로
        </button>
        <div className="mt-4">
          <a href="tel:16009195" className="text-sm text-gray-500 underline">
            📞 지금 바로 상담원 연결
          </a>
        </div>
      </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
    <div className="flex flex-col min-h-screen">
      <div className="px-5 pt-6 pb-4">
        <button
          onClick={() => { intentionalNav.current = true; router.back(); }}
          className="text-gray-400 text-sm mb-3"
        >
          ← 뒤로
        </button>
        <h1 className="text-xl font-bold text-gray-900">상담 신청</h1>
        <p className="text-sm text-gray-500 mt-1">아래 정보를 제출해 주세요</p>
      </div>

      <div className="flex-1 px-5 space-y-4">
        <FormField label="이름" required>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
            className="w-full py-3 px-4 border-2 border-gray-200 text-sm focus:outline-none focus:border-gray-900"
          />
        </FormField>

        <FormField label="연락처" required>
          <input
            type="tel"
            value={phone}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
              const formatted =
                digits.length < 4 ? digits :
                digits.length < 8 ? `${digits.slice(0, 3)}-${digits.slice(3)}` :
                `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
              setPhone(formatted);
            }}
            placeholder="010-0000-0000"
            className="w-full py-3 px-4 border-2 border-gray-200 text-sm focus:outline-none focus:border-gray-900"
          />
        </FormField>

        <FormField label="주소" required>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="시공 주소를 입력해주세요"
            className="w-full py-3 px-4 border-2 border-gray-200 text-sm focus:outline-none focus:border-gray-900"
          />
        </FormField>

        <FormField label="희망 시공일">
          <input
            type="date"
            value={preferredDate}
            onChange={(e) => setPreferredDate(e.target.value)}
            className="w-full py-3 px-4 border-2 border-gray-200 text-sm focus:outline-none focus:border-gray-900"
          />
        </FormField>

        <FormField label="추가 요청사항">
          <textarea
            value={extraRequest}
            onChange={(e) => setExtraRequest(e.target.value)}
            placeholder="특이사항이나 요청사항을 입력해주세요"
            rows={3}
            className="w-full py-3 px-4 border-2 border-gray-200 text-sm focus:outline-none focus:border-gray-900 resize-none"
          />
        </FormField>

        {error && (
          <div className="bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>

      <div className="px-5 pb-6 pt-3 space-y-3 border-t border-gray-100 bg-white">
        <button
          onClick={handleSubmit}
          disabled={submitting || !name || !phone || !address}
          className="w-full py-4 bg-[#b10000] text-white font-semibold text-base disabled:opacity-40 hover:bg-[#8b0000] transition-colors"
        >
          {submitting ? '제출 중...' : '상담 신청 제출하기'}
        </button>
        <ConsultCTABar page3Colors />
      </div>

      {/* 이탈 방지 팝업 */}
      {showExitPopup && (
        <ExitPopup
          onStay={() => setShowExitPopup(false)}
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

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-800 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

function ExitPopup({ onStay, onLater }: { onStay: () => void; onLater: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5">
      <div className="w-full max-w-sm bg-white p-6">
        <p className="text-lg font-bold text-gray-900 text-center mb-6">
          상담을 신청하시겠어요?
        </p>
        <div className="space-y-2">
          <button
            onClick={onStay}
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
