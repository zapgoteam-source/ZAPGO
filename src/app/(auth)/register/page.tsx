'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const { user, loading, userProfile, refreshUserProfile, role } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [agreedAll, setAgreedAll] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacyName, setAgreedPrivacyName] = useState(false);
  const [agreedPrivacyPhone, setAgreedPrivacyPhone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/login'); return; }
    if (userProfile) {
      switch (role) {
        case 'ADMIN': router.replace('/admin/dashboard'); break;
        case 'WORKER': router.replace('/worker/list'); break;
        case 'AGENCY': router.replace('/agency/dashboard'); break;
        default: router.replace('/selfest'); break;
      }
    }
    // 카카오에서 받은 값으로 초기화
    const kakaoName = user.user_metadata?.full_name || user.user_metadata?.name || '';
    const kakaoPhone =
      user.user_metadata?.phone_number ||
      user.user_metadata?.kakao_account?.phone_number ||
      '';
    setName(kakaoName);
    setPhone(kakaoPhone);
  }, [user, loading, userProfile, role, router]);

  const allRequired = agreedTerms && agreedPrivacyName;

  const handleToggleAll = (checked: boolean) => {
    setAgreedAll(checked);
    setAgreedTerms(checked);
    setAgreedPrivacyName(checked);
    setAgreedPrivacyPhone(checked);
  };

  const syncAll = (terms: boolean, privName: boolean, privPhone: boolean) => {
    setAgreedAll(terms && privName && privPhone);
  };

  const handleSubmit = async () => {
    if (!allRequired) return;
    if (!user) return;
    setSubmitting(true);
    setError(null);

    try {
      const kakaoId =
        user.user_metadata?.provider_id ||
        user.user_metadata?.sub ||
        user.id;

      const { error: upsertError } = await supabase.from('users').upsert({
        id: user.id,
        kakao_id: kakaoId,
        name: name.trim() || null,
        phone: agreedPrivacyPhone ? (phone.trim() || null) : null,
        role: 'CUSTOMER',
        agreed_terms_at: new Date().toISOString(),
        agreed_privacy_at: new Date().toISOString(),
      });

      if (upsertError) throw upsertError;

      await refreshUserProfile();
      router.replace('/selfest');
    } catch (err) {
      console.error('[Register] 프로필 생성 오류:', err);
      setError('가입 처리 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="h-dvh flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-white max-w-md mx-auto px-6">
      {/* 헤더 */}
      <div className="flex flex-col items-center justify-center pt-14 pb-8">
        <img src="/LOGO_BK.webp" alt="에너지잡고" className="h-12 w-auto" draggable={false} />
        <h1 className="text-xl font-bold text-gray-900 mt-6">에너지잡고 회원가입</h1>
        <p className="text-sm text-gray-500 mt-1">서비스 이용을 위해 정보를 확인해 주세요.</p>
      </div>

      <div className="flex-1 space-y-6">

        {/* 수집 항목 입력 */}
        <div className="space-y-4">
          {/* 이름 */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              이름 <span className="text-red-500 text-xs font-normal">필수</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력해 주세요"
              className="w-full px-4 py-3 border border-gray-200 text-sm outline-none focus:border-gray-700 transition"
            />
            <p className="text-xs text-gray-400 mt-1">수집 목적: 서비스 제공 및 회원 식별</p>
          </div>

          {/* 연락처 */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              연락처 <span className="text-gray-400 text-xs font-normal">선택</span>
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
              className="w-full px-4 py-3 border border-gray-200 text-sm outline-none focus:border-gray-700 transition"
            />
            <p className="text-xs text-gray-400 mt-1">수집 목적: 견적 안내 및 서비스 연락 (미동의 시에도 가입 가능)</p>
          </div>
        </div>

        {/* 약관 동의 */}
        <div>
          {/* 전체 동의 */}
          <label className="flex items-center gap-3 p-4 bg-gray-50 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={agreedAll}
              onChange={(e) => handleToggleAll(e.target.checked)}
              className="w-5 h-5 accent-yellow-400"
            />
            <span className="font-semibold text-gray-900">전체 동의</span>
          </label>

          <div className="border border-gray-100 overflow-hidden divide-y divide-gray-100">
            {/* 이용약관 */}
            <label className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => {
                  setAgreedTerms(e.target.checked);
                  syncAll(e.target.checked, agreedPrivacyName, agreedPrivacyPhone);
                }}
                className="w-5 h-5 accent-yellow-400"
              />
              <div className="flex-1">
                <span className="text-sm text-gray-700">
                  <span className="text-yellow-500 font-semibold">[필수]</span> 서비스 이용약관 동의
                </span>
              </div>
              <a
                href="/terms"
                target="_blank"
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600 shrink-0"
              >
                보기
              </a>
            </label>

            {/* 개인정보 — 이름 (필수) */}
            <div className="px-4 py-3.5">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedPrivacyName}
                  onChange={(e) => {
                    setAgreedPrivacyName(e.target.checked);
                    syncAll(agreedTerms, e.target.checked, agreedPrivacyPhone);
                  }}
                  className="w-5 h-5 accent-yellow-400"
                />
                <div className="flex-1">
                  <span className="text-sm text-gray-700">
                    <span className="text-yellow-500 font-semibold">[필수]</span> 개인정보 수집·이용 동의 — 이름
                  </span>
                </div>
                <a
                  href="/privacy"
                  target="_blank"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600 shrink-0"
                >
                  보기
                </a>
              </label>
              <div className="mt-2 ml-8 text-xs text-gray-400 space-y-0.5">
                <p>· 수집 항목: 이름</p>
                <p>· 수집 조건: 필수 (미동의 시 서비스 이용 불가)</p>
                <p>· 보유 기간: 회원 탈퇴 시까지</p>
              </div>
            </div>

            {/* 개인정보 — 연락처 (선택) */}
            <div className="px-4 py-3.5">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedPrivacyPhone}
                  onChange={(e) => {
                    setAgreedPrivacyPhone(e.target.checked);
                    syncAll(agreedTerms, agreedPrivacyName, e.target.checked);
                  }}
                  className="w-5 h-5 accent-yellow-400"
                />
                <div className="flex-1">
                  <span className="text-sm text-gray-700">
                    <span className="text-gray-400 font-semibold">[선택]</span> 개인정보 수집·이용 동의 — 연락처
                  </span>
                </div>
                <a
                  href="/privacy"
                  target="_blank"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600 shrink-0"
                >
                  보기
                </a>
              </label>
              <div className="mt-2 ml-8 text-xs text-gray-400 space-y-0.5">
                <p>· 수집 항목: 연락처(전화번호)</p>
                <p>· 수집 조건: 선택 (미동의 시에도 서비스 이용 가능)</p>
                <p>· 보유 기간: 회원 탈퇴 시까지</p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}
      </div>

      {/* 가입 버튼 */}
      <div className="pb-10 pt-6">
        <button
          onClick={handleSubmit}
          disabled={!allRequired || submitting}
          className="w-full py-4 font-bold text-base bg-[#FEE500] text-[#191919] disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {submitting ? '가입 처리 중...' : '동의하고 시작하기'}
        </button>
      </div>
    </div>
  );
}
