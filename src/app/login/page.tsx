/**
 * 로그인 페이지
 * 
 * 사용자 로그인을 위한 전용 페이지입니다.
 * URL: /login
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // 이미 로그인된 사용자는 홈으로 리다이렉트
  useEffect(() => {
    if (user && !loading) {
      router.replace('/home');
    }
  }, [user, loading, router]);

  // 브라우저 뒤로가기로 로그인 페이지 접근 시 캐시 방지
  useEffect(() => {
    // 페이지 로드 시 캐시 사용 안함
    if (typeof window !== 'undefined') {
      window.onpageshow = (event) => {
        // bfcache에서 로드된 경우 (뒤로가기)
        if (event.persisted) {
          console.log('뒤로가기 감지 - 페이지 강제 새로고침');
          window.location.reload();
        }
      };
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.onpageshow = null;
      }
    };
  }, []);

  /**
   * 로그인 성공 시 홈으로 이동
   */
  const handleLoginSuccess = () => {
    router.push('/home');
  };

  /**
   * 회원가입 페이지로 이동
   */
  const handleSwitchToSignUp = () => {
    router.push('/signup');
  };

  // 로딩 중 또는 이미 로그인된 경우
  if (loading || user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="relative">
          {/* 외곽 회전 원 */}
          <div className="w-20 h-20 border-4 border-primary/20 rounded-full"></div>
          {/* 회전 애니메이션 원 */}
          <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
          {/* 중앙 아이콘 */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <LogIn className="w-8 h-8 text-primary animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // 로그인 폼 표시
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-xs">
          <LoginForm
            onSuccess={handleLoginSuccess}
            onSwitchToSignUp={handleSwitchToSignUp}
          />
        </div>
      </div>

      {/* 하단 정보 */}
      <div className="flex-shrink-0 text-center py-6">
        <p className="text-gray-400 text-sm font-korean">
          © 2025 ZAPGO. All rights reserved.
        </p>
      </div>
    </div>
  );
}

