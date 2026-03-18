/**
 * 회원가입 페이지
 * 
 * 신규 사용자 회원가입을 위한 전용 페이지입니다.
 * URL: /signup
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { UserPlus } from 'lucide-react';

export default function SignUpPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  // 이미 로그인된 사용자는 적절한 페이지로 리다이렉트
  useEffect(() => {
    if (user && !loading && userProfile) {
      if (userProfile.is_active) {
        // 활성 사용자는 홈으로
        router.replace('/home');
      } else {
        // 비활성 사용자는 승인 대기 페이지로
        router.replace('/pending-approval');
      }
    }
  }, [user, userProfile, loading, router]);

  /**
   * 회원가입 성공 시 로그인 페이지로 이동
   */
  const handleSignUpSuccess = () => {
    router.push('/login');
  };

  /**
   * 로그인 페이지로 이동
   */
  const handleSwitchToLogin = () => {
    router.push('/login');
  };

  // 로딩 중이거나 이미 로그인된 사용자 (리다이렉트 대기 중)
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
            <UserPlus className="w-8 h-8 text-primary animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // 회원가입 폼 표시
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-xs">
          <SignUpForm
            onSuccess={handleSignUpSuccess}
            onSwitchToLogin={handleSwitchToLogin}
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

