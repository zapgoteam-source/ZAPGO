/**
 * 활성 사용자 가드 컴포넌트
 * 
 * 비활성(승인 대기) 사용자의 페이지 접근을 제한합니다.
 * is_active = false인 사용자는 승인 대기 화면으로 리다이렉트됩니다.
 */

'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * ActiveUserGuard Props
 */
interface ActiveUserGuardProps {
  /** 자식 컴포넌트 */
  children: React.ReactNode;
}

/**
 * 비활성 사용자도 접근 가능한 경로들
 */
const ALLOWED_PATHS_FOR_INACTIVE_USERS = [
  '/pending-approval',  // 승인 대기 전용 페이지
  '/login',
  '/signup',
  '/',
];

/**
 * 활성 사용자 가드 컴포넌트
 * 
 * 비활성 사용자가 제한된 페이지에 접근하려고 하면 홈으로 리다이렉트합니다.
 * 
 * @param children - 자식 컴포넌트
 */
export function ActiveUserGuard({ children }: ActiveUserGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userProfile, loading } = useAuth();

  useEffect(() => {
    // 로딩 중이거나 사용자가 없으면 체크하지 않음
    if (loading || !user) {
      return;
    }

    // 프로필이 아직 로드되지 않았으면 기다림
    if (!userProfile) {
      return;
    }

    // 비활성 사용자인 경우
    if (!userProfile.is_active) {
      // 현재 경로가 허용된 경로인지 확인
      const isAllowedPath = ALLOWED_PATHS_FOR_INACTIVE_USERS.some(
        allowedPath => pathname === allowedPath || pathname.startsWith(allowedPath)
      );

      // 허용되지 않은 경로에 접근하려고 하면 승인 대기 페이지로 리다이렉트
      if (!isAllowedPath) {
        console.warn('비활성 사용자가 제한된 페이지 접근 시도:', pathname);
        router.replace('/pending-approval');
      }
    }
  }, [user, userProfile, loading, pathname, router]);

  return <>{children}</>;
}

export default ActiveUserGuard;

