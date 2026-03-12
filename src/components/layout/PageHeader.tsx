/**
 * 페이지 헤더 컴포넌트
 * 
 * 모든 페이지에서 일관된 헤더 디자인을 제공합니다.
 * 통일된 헤더 레이아웃을 사용하여 로고와 사용자 정보를 표시합니다.
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';

/**
 * 페이지 헤더 Props
 */
interface PageHeaderProps {
  /** 페이지 제목 (사용되지 않음 - 통일된 헤더 사용) */
  title?: string;
  /** 서브타이틀 또는 설명 (사용되지 않음 - 통일된 헤더 사용) */
  subtitle?: string;
  /** 로그아웃 버튼 표시 여부 */
  showLogout?: boolean;
  /** 사용자 정보 표시 여부 */
  showUserInfo?: boolean;
  /** 사용자 정의 오른쪽 컨텐츠 */
  rightContent?: React.ReactNode;
  /** 헤더 배경색 */
  variant?: 'default' | 'gradient';
}

/**
 * 페이지 헤더 컴포넌트
 * 모든 탭에서 통일된 헤더를 표시합니다.
 */
export function PageHeader({
  showLogout = false,
  showUserInfo = true,
  rightContent,
  variant = 'default'
}: PageHeaderProps) {
  const router = useRouter();
  const { user, userProfile, signOut } = useAuth();

  /**
   * 로그아웃 핸들러
   * signOut() 함수가 자동으로 로그인 페이지로 리다이렉션합니다.
   */
  const handleSignOut = async () => {
    try {
      await signOut();
      // AuthContext의 signOut 함수가 자동으로 /login으로 리다이렉션
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  // 사용자 이름 결정 (여러 fallback 옵션)
  const getUserName = (): string => {
    // 1순위: userProfile.name
    if (userProfile?.name && userProfile.name.trim()) {
      return userProfile.name;
    }
    // 2순위: user.user_metadata.name
    if (user?.user_metadata?.name && user.user_metadata.name.trim()) {
      return user.user_metadata.name;
    }
    // 3순위: 이메일에서 추출 (@ 앞부분)
    if (user?.email) {
      const emailName = user.email.split('@')[0];
      if (emailName && emailName !== 'zapgo.local') {
        return emailName;
      }
    }
    // 4순위: userProfile.email에서 추출
    if (userProfile?.email) {
      const emailName = userProfile.email.split('@')[0];
      if (emailName && emailName !== 'zapgo.local') {
        return emailName;
      }
    }
    // 최종 fallback
    return '사용자';
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* 왼쪽: 로고 */}
          <div className="flex items-center">
            <Logo size="md" />
          </div>

          {/* 오른쪽: 사용자 정보 + 액션 */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* 사용자 정보 표시 (유저 이름이 소속 위에 표시) */}
            {showUserInfo && (user || userProfile) && (
              <div className="text-base font-korean">
                <div className="text-right">
                  <div className="text-gray-900 font-semibold text-sm sm:text-base">
                    {getUserName()}
                  </div>
                  <div className="text-gray-600 text-xs sm:text-sm">
                    {userProfile?.tenant?.name || '소속 없음'}
                  </div>
                </div>
              </div>
            )}

            {/* 사용자 정의 컨텐츠 */}
            {rightContent}

            {/* 로그아웃 버튼 */}
            {showLogout && (
              <Button
                onClick={handleSignOut}
                variant="secondary"
                size="sm"
                className="text-xs sm:text-sm font-korean"
              >
                로그아웃
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default PageHeader;
