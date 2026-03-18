/**
 * 메인 레이아웃 컴포넌트
 * 
 * 로그인된 사용자를 위한 메인 레이아웃입니다.
 * 탭바와 함께 페이지 콘텐츠를 감싸는 역할을 합니다.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TabBar } from '@/components/ui/TabBar';
import { usePathname } from 'next/navigation';

/**
 * 메인 레이아웃 Props
 */
interface MainLayoutProps {
  /** 자식 컴포넌트 */
  children: React.ReactNode;
}

/**
 * 탭바를 숨겨야 하는 페이지 경로들
 */
const HIDDEN_TAB_PATHS = [
  '/', // 로그인 페이지
  '/login',
  '/signup',
  '/auth',
];

/**
 * 메인 레이아웃 컴포넌트
 * 
 * @param children - 자식 컴포넌트
 */
export function MainLayout({ children }: MainLayoutProps) {
  const { user, userProfile, loading } = useAuth();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // 클라이언트 마운트 확인 (hydration mismatch 방지)
  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  // 탭바를 숨길지 여부 결정
  // 조건: 사용자가 없거나, 로딩 중이거나, 비활성 상태이거나, 특정 경로인 경우
  const shouldHideTabBar = 
    !mounted || // 마운트 전에는 탭바 숨김
    !user || 
    loading || 
    !userProfile?.is_active || // 승인 대기 중인 사용자는 탭바 숨김
    HIDDEN_TAB_PATHS.includes(pathname);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 메인 콘텐츠 */}
      <main className={`min-h-screen ${shouldHideTabBar ? '' : 'pb-16'}`}>
        {children}
      </main>

      {/* 탭바 */}
      <TabBar hidden={shouldHideTabBar} />
    </div>
  );
}

export default MainLayout;
