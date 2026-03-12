/**
 * ZAPGO 메인 페이지
 * 
 * 이 페이지는 ZAPGO 애플리케이션의 시작점입니다.
 * 사용자 인증 상태에 따라 로그인 페이지 또는 홈으로 리다이렉트합니다.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // 로그인된 사용자는 홈으로 리다이렉트
        router.replace('/home');
      } else {
        // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  // 로딩 또는 리다이렉트 중 표시
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg text-gray-600 font-korean">로딩 중...</p>
      </div>
    </div>
  );
}
