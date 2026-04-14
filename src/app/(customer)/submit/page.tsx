'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEstimateStore } from '@/store/estimateStore';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

// 견적 계산 (estimate 페이지와 동일한 로직)
const UNIT = {
  fabric_four: { medium: 30_000, large: 40_000, xlarge: 50_000 },
  mohair_four: { medium: 15_000, large: 20_000, xlarge: 25_000 },
  fabric_side: { medium: 15_000, large: 20_000, xlarge: 25_000 },
} as const;

type SizeKey = 'medium' | 'large' | 'xlarge';

function getSizeKey(pyeong: number): SizeKey {
  if (pyeong < 23) return 'medium';
  if (pyeong < 38) return 'large';
  return 'xlarge';
}

function getWorkerCount(pyeong: number): number {
  if (pyeong >= 60) return 5;
  if (pyeong >= 38) return 4;
  if (pyeong >= 23) return 3;
  return 2;
}

function calcTotal(
  pyeong: number,
  sashCount: number,
  plan: 'main' | 'alt1' | 'alt2',
  premiumProtection: boolean,
  pestSolution: boolean,
  pestScreenCount: number
): number {
  const sizeKey = getSizeKey(pyeong);
  const laborCost = 300_000 * (plan === 'alt2' ? 1 : getWorkerCount(pyeong));
  const optionCost = (premiumProtection ? 80_000 : 0) + (pestSolution ? pestScreenCount * 23_000 : 0);
  const serviceMap = { main: UNIT.fabric_four, alt1: UNIT.mohair_four, alt2: UNIT.fabric_side };
  return laborCost + sashCount * serviceMap[plan][sizeKey] + optionCost;
}


function formatKRW(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원';
}

function formatKakaoPhone(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/\s/g, '').replace(/^\+82/, '0');
  if (/^0\d{10}$/.test(cleaned)) {
    cleaned = cleaned.replace(/^(\d{3})(\d{4})(\d{4})$/, '$1-$2-$3');
  }
  return cleaned;
}

export default function SubmitPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    housingAreaPyeong,
    windowSashCount,
    premiumProtection,
    pestSolution,
    pestScreenCount,
    selectedPlan,
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

  useEffect(() => {
    if (!user) return;
    const meta = user.user_metadata;
    if (!meta) return;
    setName((prev) => prev || meta.name || meta.full_name || '');
    setPhone((prev) => prev || formatKakaoPhone(meta.phone_number || meta.phone || ''));
  }, [user]);

  const total =
    housingAreaPyeong && windowSashCount
      ? calcTotal(housingAreaPyeong, windowSashCount, selectedPlan, premiumProtection, pestSolution, pestScreenCount)
      : null;

  const handleSubmit = async () => {
    if (!name || !phone) { setError('이름과 연락처는 필수 입력 항목입니다'); return; }
    if (!housingAreaPyeong || !windowSashCount || !total) { setError('견적 정보가 없습니다. 다시 시작해주세요'); return; }

    setSubmitting(true);
    setError('');

    try {
      const emailPayload = {
        name, phone, address, preferredDate, extraRequest,
        housingAreaPyeong, windowSashCount, selectedPlan,
        premiumProtection, pestSolution, pestScreenCount,
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
              extraRequest,
              `시공방식: ${selectedPlan}`,
              `평형: ${housingAreaPyeong}평`,
              `창짝: ${windowSashCount}짝`,
              premiumProtection ? '프리미엄보양' : '',
              pestSolution ? `방충솔루션 ${pestScreenCount}개` : '',
            ].filter(Boolean).join(' / '),
            desired_quote_date: preferredDate || null,
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
      <div className="flex flex-col min-h-screen items-center justify-center px-5 text-center">
        <div className="w-16 h-16 bg-green-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✓</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">시공 요청 완료!</h1>
        <p className="text-sm text-gray-500 mb-2">접수되었습니다. 담당자가 연락드릴 예정입니다.</p>
        {total && (
          <p className="text-base font-semibold text-gray-800 mb-6">
            예상 금액: {formatKRW(total)} (부가세 별도)
          </p>
        )}
        <button
          onClick={() => router.push('/login')}
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
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-5 pt-6 pb-4">
        <button onClick={() => router.back()} className="text-gray-400 text-sm mb-3">← 뒤로</button>
        <h1 className="text-xl font-bold text-gray-900">시공 요청</h1>
        <p className="text-sm text-gray-500 mt-1">고객 정보를 입력해주세요</p>
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
            onChange={(e) => setPhone(e.target.value)}
            placeholder="010-0000-0000"
            className="w-full py-3 px-4 border-2 border-gray-200 text-sm focus:outline-none focus:border-gray-900"
          />
        </FormField>

        <FormField label="주소">
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
          disabled={submitting || !name || !phone}
          className="w-full py-4 bg-gray-900 text-white font-semibold text-base disabled:opacity-40 hover:bg-gray-800 transition-colors"
        >
          {submitting ? '제출 중...' : '시공 요청 제출'}
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
