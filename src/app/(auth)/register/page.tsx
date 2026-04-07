'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const { user, loading, userProfile, refreshUserProfile, role } = useAuth();
  const router = useRouter();
  const [agreedAll, setAgreedAll] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/login'); return; }
    // 이미 프로필이 있는 유저는 역할에 맞는 페이지로
    if (userProfile) {
      switch (role) {
        case 'ADMIN': router.replace('/admin/dashboard'); break;
        case 'WORKER': router.replace('/worker/list'); break;
        case 'AGENCY': router.replace('/agency/dashboard'); break;
        default: router.replace('/survey'); break;
      }
    }
  }, [user, loading, userProfile, role, router]);

  const handleToggleAll = (checked: boolean) => {
    setAgreedAll(checked);
    setAgreedTerms(checked);
    setAgreedPrivacy(checked);
  };

  const handleTerms = (checked: boolean) => {
    setAgreedTerms(checked);
    setAgreedAll(checked && agreedPrivacy);
  };

  const handlePrivacy = (checked: boolean) => {
    setAgreedPrivacy(checked);
    setAgreedAll(agreedTerms && checked);
  };

  const handleSubmit = async () => {
    if (!agreedTerms || !agreedPrivacy) return;
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
        name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        phone:
          user.user_metadata?.phone_number ||
          user.user_metadata?.kakao_account?.phone_number ||
          null,
        role: 'CUSTOMER',
        agreed_terms_at: new Date().toISOString(),
        agreed_privacy_at: new Date().toISOString(),
      });

      if (upsertError) throw upsertError;

      await refreshUserProfile();
      router.replace('/survey');
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

  const userName = user.user_metadata?.full_name || user.user_metadata?.name || '고객';

  return (
    <div className="h-dvh flex flex-col bg-white max-w-md mx-auto px-6">
      {/* 헤더 */}
      <div className="flex flex-col items-center justify-center pt-14 pb-8">
        <img src="/LOGO_BK.webp" alt="에너지잡고" className="h-12 w-auto" draggable={false} />
        <h1 className="text-xl font-bold text-gray-900 mt-6">에너지잡고 회원가입</h1>
        <p className="text-sm text-gray-500 mt-1">
          안녕하세요, <span className="font-medium text-gray-800">{userName}</span>님!
        </p>
        <p className="text-sm text-gray-500">서비스 이용을 위해 약관에 동의해 주세요.</p>
      </div>

      {/* 약관 동의 */}
      <div className="flex-1">
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
              onChange={(e) => handleTerms(e.target.checked)}
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

          {/* 개인정보 처리방침 */}
          <label className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={agreedPrivacy}
              onChange={(e) => handlePrivacy(e.target.checked)}
              className="w-5 h-5 accent-yellow-400"
            />
            <div className="flex-1">
              <span className="text-sm text-gray-700">
                <span className="text-yellow-500 font-semibold">[필수]</span> 개인정보 처리방침 동의
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
        </div>

        {error && (
          <p className="text-sm text-red-500 mt-3 text-center">{error}</p>
        )}
      </div>

      {/* 가입 버튼 */}
      <div className="pb-10 pt-4">
        <button
          onClick={handleSubmit}
          disabled={!agreedTerms || !agreedPrivacy || submitting}
          className="w-full py-4 font-bold text-base bg-[#FEE500] text-[#191919] disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {submitting ? '가입 처리 중...' : '동의하고 시작하기'}
        </button>
      </div>
    </div>
  );
}
