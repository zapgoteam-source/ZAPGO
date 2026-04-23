'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const ISSUES = [
  { id: '난방비', label: '난방비' },
  { id: '찬바람', label: '찬바람' },
  { id: '모헤어 날림', label: '모헤어 날림' },
  { id: '벌레 유입', label: '벌레 유입' },
  { id: '소음', label: '소음' },
  { id: '악취', label: '악취' },
  { id: '미세먼지', label: '미세먼지' },
];

export default function VisitRequestPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <VisitRequestPageInner />
    </Suspense>
  );
}

function VisitRequestPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref');

  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [etcChecked, setEtcChecked] = useState(false);
  const [etcText, setEtcText] = useState('');
  const [notes, setNotes] = useState('');
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const allIssues = [
    ...selectedIssues,
    ...(etcChecked && etcText.trim() ? [`기타: ${etcText.trim()}`] : []),
  ];

  const isValid =
    phone.replace(/\D/g, '').length >= 10 &&
    address.trim() &&
    allIssues.length > 0 &&
    privacyAgreed;

  const toggleIssue = (id: string) => {
    setSelectedIssues((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError('');

    try {
      // 1. 이메일 알림 (최우선)
      const emailRes = await fetch('/api/send-email/visit-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, address: address.trim(), issues: allIssues, notes: notes.trim() || null, refCode }),
      });
      if (!emailRes.ok) throw new Error('이메일 발송 실패');

      // 2. DB 저장 (실패해도 접수 성공으로 처리)
      fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '',
          phone,
          address: address.trim(),
          status: 'NEW',
          issues: allIssues,
          notes: notes.trim() || null,
          desired_quote_date: null,
          ref_code: refCode || null,
          tenant_id: null,
          created_by: null,
        }),
      }).catch(() => {});

      setSubmitted(true);
    } catch {
      setError('요청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center px-6 max-w-md mx-auto text-center">
        <div className="text-5xl mb-6">✅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">방문 견적 요청 완료!</h2>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          담당자가 확인 후 연락드리겠습니다.<br />빠른 시일 내에 연락드릴게요.
        </p>
        <button
          onClick={() => router.push('/selfest')}
          className="w-full py-4 bg-gray-900 text-white font-semibold text-base"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col max-w-md mx-auto bg-white">
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-4 border-b border-gray-100">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-800 p-1 -ml-1">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">방문 견적 요청</h1>
      </div>

      <div className="flex-1 px-5 py-6 space-y-7">

        {/* 연락처 */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            연락처 <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
              let formatted = digits;
              if (digits.length > 3 && digits.length <= 7) {
                formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
              } else if (digits.length > 7) {
                formatted = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
              }
              setPhone(formatted);
            }}
            placeholder="010-0000-0000"
            className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-gray-700"
          />
        </div>

        {/* 주소 */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            주소(상세주소 포함) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="예) 서울시 강남구 테헤란로 123, 101호"
            className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-gray-700"
          />
        </div>

        {/* 문제 선택 */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-3">
            해결하고 싶은 문제를 선택해주세요. <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2.5">
            {ISSUES.map((issue) => (
              <label key={issue.id} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIssues.includes(issue.id)}
                  onChange={() => toggleIssue(issue.id)}
                  className="w-4 h-4 border-gray-300 accent-gray-900"
                />
                <span className="text-sm text-gray-700">{issue.label}</span>
              </label>
            ))}

            {/* 기타 */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={etcChecked}
                onChange={(e) => setEtcChecked(e.target.checked)}
                className="w-4 h-4 border-gray-300 accent-gray-900"
              />
              <span className="text-sm text-gray-700 shrink-0">기타:</span>
              <input
                type="text"
                value={etcText}
                disabled={!etcChecked}
                onChange={(e) => setEtcText(e.target.value)}
                placeholder="직접입력"
                className="flex-1 border-b border-gray-300 py-0.5 text-sm focus:outline-none focus:border-gray-700 disabled:opacity-40 bg-transparent"
              />
            </div>
          </div>
        </div>

        {/* 자유 메모 */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            미리 전달하고 싶은 내용을 자유롭게 적어주세요.
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="예) 창문이 3개이고 베란다 확장 공사가 되어 있어요."
            className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-gray-700 resize-none"
          />
        </div>

        {/* 개인정보 동의 */}
        <div className="bg-gray-50 p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-800">
            개인정보 수집 및 이용 동의 <span className="text-red-500">*</span>
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-xs text-gray-500 pl-1">
            <li>수집 목적: 제품 또는 시공 서비스 상담 및 방문 견적 안내</li>
            <li>수집 항목: 연락처, 주소, 상담을 원하는 내용</li>
            <li>보유 및 이용 기간: 상담 완료 후 1년까지 (이후 지체 없이 파기)</li>
            <li>동의를 거부하실 수 있지만, 거부 시 상담 서비스 이용이 제한될 수 있습니다.</li>
          </ol>
          <label className="flex items-center gap-3 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={privacyAgreed}
              onChange={(e) => setPrivacyAgreed(e.target.checked)}
              className="w-4 h-4 border-gray-300 accent-gray-900"
            />
            <span className="text-sm text-gray-700">개인정보 수집 및 이용에 동의합니다.</span>
          </label>
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}
      </div>

      {/* 제출 버튼 */}
      <div className="px-5 pb-8 pt-3 border-t border-gray-100 bg-white">
        <button
          onClick={handleSubmit}
          disabled={!isValid || submitting}
          className="w-full py-4 bg-gray-900 text-white font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
        >
          {submitting ? '제출 중...' : '방문 견적 요청하기'}
        </button>
      </div>
    </div>
  );
}
