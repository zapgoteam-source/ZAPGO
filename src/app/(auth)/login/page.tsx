'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { signInWithKakao, user, loading, profileReady, role, userProfile } = useAuth();
  const router = useRouter();
  const redirecting = useRef(false);

  useEffect(() => {
    if (loading || !profileReady || !user || redirecting.current) return;
    redirecting.current = true;
    if (!userProfile) { router.replace('/register'); return; }
    switch (role) {
      case 'ADMIN': router.replace('/admin/dashboard'); break;
      case 'WORKER': router.replace('/worker/list'); break;
      case 'AGENCY': router.replace('/agency/dashboard'); break;
      default: router.replace('/survey');
    }
  }, [user, loading, profileReady, role, userProfile, router]);

  // 로그인된 상태에서 프로필 확인 중일 때 로그인 UI 노출 방지
  if (loading || (user && !profileReady)) {
    return (
      <div className="h-dvh flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="h-dvh flex flex-col bg-white max-w-md mx-auto px-6">
      {/* 상단 로고 */}
      <div className="flex flex-col items-center justify-center pt-12 pb-6">
        <img
          src="/LOGO_BK.webp"
          alt="에너지잡고"
          className="h-16 w-auto"
          draggable={false}
        />
        <p className="text-sm text-gray-400 mt-3">창문 단열 셀프견적</p>
      </div>

      {/* 혜택 카드 */}
      <div className="bg-gray-50 rounded-2xl px-5 py-4 mb-6">
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-center gap-2">
            <span className="text-yellow-500 font-bold">✓</span>
            3분만에 창문별 맞춤 견적 확인
          </li>
          <li className="flex items-center gap-2">
            <span className="text-yellow-500 font-bold">✓</span>
            단열 효과별 시공 방법 추천
          </li>
          <li className="flex items-center gap-2">
            <span className="text-yellow-500 font-bold">✓</span>
            참고 견적 무료 제공 (부가세 별도)
          </li>
        </ul>
      </div>

      {/* 카카오 버튼 */}
      <button
        onClick={signInWithKakao}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2.5 bg-[#FEE500] hover:bg-[#F5D800] active:bg-[#EDD000] text-[#191919] font-bold py-4 rounded-xl text-base transition-colors disabled:opacity-50"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path fillRule="evenodd" clipRule="evenodd"
            d="M10 2C5.58 2 2 4.97 2 8.63c0 2.33 1.44 4.37 3.6 5.57l-.92 3.35a.3.3 0 00.46.32L9.4 15.2c.2.02.4.03.6.03 4.42 0 8-2.97 8-6.63S14.42 2 10 2z"
            fill="#191919" />
        </svg>
        {loading ? '잠시만요...' : '카카오로 1초만에 시작하기'}
      </button>

      <p className="text-center text-xs text-gray-400 mt-3">
        로그인 시{' '}
        <a href="/terms" className="underline underline-offset-2 hover:text-gray-600">이용약관</a>
        {' '}및{' '}
        <a href="/privacy" className="underline underline-offset-2 hover:text-gray-600">개인정보 처리방침</a>
        에 동의합니다
      </p>

      {/* 하단 CTA */}
      <div className="mt-auto pb-8 space-y-2.5">
        <a
          href="tel:0000000000"
          className="block w-full text-center py-3.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          📞 상담원 연결
        </a>
        <a
          href="/visit-request"
          className="block w-full text-center py-3.5 bg-gray-900 rounded-xl text-sm font-medium text-white hover:bg-gray-800 transition-colors"
        >
          방문 견적 요청
        </a>
        <div className="text-center pt-1">
          <a href="/admin/login" className="text-xs text-gray-300 hover:text-gray-500 underline underline-offset-2">
            직원/관리자 로그인
          </a>
        </div>
      </div>
    </div>
  );
}
