/**
 * 인증 화면 컴포넌트
 * 
 * 로그인과 회원가입 폼을 전환할 수 있는 통합 인증 화면입니다.
 * 사용자가 쉽게 로그인/회원가입을 전환할 수 있도록 구성되어 있습니다.
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { LoginForm } from './LoginForm';
import { SignUpForm } from './SignUpForm';

// 인증 모드 타입
type AuthMode = 'login' | 'signup';

/**
 * 인증 화면 컴포넌트
 */
export function AuthScreen() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  /**
   * 인증 성공 시 홈으로 리다이렉트
   */
  const handleAuthSuccess = () => {
    router.push('/home');
  };

  /**
   * 로그인 모드로 전환
   */
  const switchToLogin = () => {
    setAuthMode('login');
  };

  /**
   * 회원가입 모드로 전환
   */
  const switchToSignUp = () => {
    setAuthMode('signup');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-xs">
          {authMode === 'login' ? (
            <LoginForm
              onSuccess={handleAuthSuccess}
              onSwitchToSignUp={switchToSignUp}
            />
          ) : (
            <SignUpForm
              onSuccess={handleAuthSuccess}
              onSwitchToLogin={switchToLogin}
            />
          )}
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

