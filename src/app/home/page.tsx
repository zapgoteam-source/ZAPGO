/**
 * 홈 페이지
 * 
 * 로그인한 사용자를 위한 메인 대시보드 페이지입니다.
 * 사용자 정보와 주요 기능들을 표시합니다.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { UserRole } from '@/lib/permissions';
import { PageHeader } from '@/components/layout/PageHeader';
import { SubscriptionGuard } from '@/components/auth/PermissionGuard';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText, 
  BarChart3, 
  Clock,
  CheckCircle,
  AlertCircle,
  Activity,
  Home
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user, userProfile, signOut, loading } = useAuth();
  
  // 대시보드 데이터 상태
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 12,
    activeUsers: 8,
    totalQuotations: 45,
    pendingQuotations: 7,
    completedToday: 3,
    revenue: 2450000,
    revenueChange: 12.5,
    userGrowth: 8.3
  });

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

  /**
   * 숫자를 한국어 형식으로 포맷팅
   */
  const formatNumber = (num: number): string => {
    if (num >= 10000) {
      return `${(num / 10000).toFixed(1)}만`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}천`;
    }
    return num.toLocaleString();
  };


  // 리다이렉트 처리
  useEffect(() => {
    // 로그아웃 중이면 리다이렉션 중단
    if (typeof window !== 'undefined' && (window as any).__LOGOUT_IN_PROGRESS__) {
      return;
    }
    
    if (!loading && user && userProfile) {
      if (!userProfile.is_active) {
        // 비활성 사용자는 승인 대기 페이지로
        router.replace('/pending-approval');
      }
    } else if (!loading && !user) {
      // 로그인하지 않은 사용자는 루트로
      router.replace('/');
    }
  }, [user, userProfile, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // 브라우저 뒤로가기로 접근 시 인증 체크
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.onpageshow = (event) => {
        // 로그아웃 중이면 중단
        if ((window as any).__LOGOUT_IN_PROGRESS__) {
          return;
        }
        
        // bfcache에서 로드된 경우 (뒤로가기)
        if (event.persisted) {
          console.log('뒤로가기 감지 - 인증 상태 확인');
          // 로그인 상태가 아니면 로그인 페이지로
          if (!user) {
            window.location.replace('/login');
          }
        }
      };
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.onpageshow = null;
      }
    };
  }, [user]);

  // 로딩 중이거나 체크가 완료되지 않은 경우 로딩 화면 표시
  if (loading || !user || !userProfile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="relative">
          {/* 외곽 회전 원 */}
          <div className="w-20 h-20 border-4 border-primary/20 rounded-full"></div>
          {/* 회전 애니메이션 원 */}
          <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
          {/* 중앙 아이콘 */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Home className="w-8 h-8 text-primary animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // 비활성 사용자는 이미 리다이렉트됨
  if (!userProfile.is_active) {
    return null;
  }

  return (
    <div className="bg-gray-50">
      {/* 통일된 헤더 */}
      <PageHeader />

      {/* 메인 컨텐츠 */}
      <main className="px-4 sm:px-6 lg:px-8 py-6">
        <SubscriptionGuard>

        {/* 주요 지표 카드들 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* 총 사용자 */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="flex items-center text-green-600 text-xs">
                <TrendingUp className="w-3 h-3 mr-1" />
                {dashboardData.userGrowth}%
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {dashboardData.totalUsers}
            </div>
            <div className="text-sm text-gray-600 font-korean">
              총 사용자
            </div>
          </div>

          {/* 활성 사용자 */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div className="text-xs text-gray-500">
                {Math.round((dashboardData.activeUsers / dashboardData.totalUsers) * 100)}%
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {dashboardData.activeUsers}
            </div>
            <div className="text-sm text-gray-600 font-korean">
              활성 사용자
            </div>
          </div>

          {/* 총 견적서 */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="text-xs text-gray-500">
                이번 달
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {dashboardData.totalQuotations}
            </div>
            <div className="text-sm text-gray-600 font-korean">
              총 견적서
            </div>
          </div>

          {/* 대기중 견적서 */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div className="text-xs text-orange-600">
                처리 필요
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {dashboardData.pendingQuotations}
            </div>
            <div className="text-sm text-gray-600 font-korean">
              대기중
            </div>
          </div>
        </div>

        {/* 주요 기능 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* 견적서 관리 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-primary/10 rounded-lg mr-3">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 font-korean">
                  견적서 관리
                </h3>
                <p className="text-sm text-gray-600 font-korean">
                  견적서 작성 및 관리
                </p>
              </div>
            </div>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 font-korean">오늘 완료</span>
                <span className="text-lg font-bold text-green-600">
                  {dashboardData.completedToday}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 font-korean">처리 대기</span>
                <span className="text-lg font-bold text-orange-600">
                  {dashboardData.pendingQuotations}
                </span>
              </div>
            </div>
            <Button 
              variant="primary" 
              size="sm" 
              fullWidth
              onClick={() => router.push('/quotation')}
              className="font-korean"
            >
              견적서 작성
            </Button>
          </div>

          {/* 분석 대시보드 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-primary/10 rounded-lg mr-3">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 font-korean">
                  분석 대시보드
                </h3>
                <p className="text-sm text-gray-600 font-korean">
                  성과 분석 및 리포트
                </p>
              </div>
            </div>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 font-korean">이번 달 매출</span>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {formatNumber(dashboardData.revenue)}원
                  </div>
                  <div className="flex items-center text-green-600 text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {dashboardData.revenueChange}%
                  </div>
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              fullWidth
              onClick={() => router.push('/analytics')}
              className="font-korean"
            >
              상세 분석 보기
            </Button>
          </div>

          {/* 빠른 액션 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-primary/10 rounded-lg mr-3">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 font-korean">
                  빠른 액션
                </h3>
                <p className="text-sm text-gray-600 font-korean">
                  자주 사용하는 기능들
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Button 
                variant="ghost" 
                size="sm" 
                fullWidth
                className="justify-start font-korean"
                onClick={() => router.push('/quotation')}
              >
                <FileText className="w-4 h-4 mr-2" />
                새 견적서 작성
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                fullWidth
                className="justify-start font-korean"
                onClick={() => router.push('/profile')}
              >
                <Users className="w-4 h-4 mr-2" />
                프로필 관리
              </Button>
              {userProfile?.role === UserRole.HQ_ADMIN && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  fullWidth
                  className="justify-start font-korean"
                  onClick={() => router.push('/admin')}
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  권한 관리
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* 최근 활동 섹션 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 font-korean">
              최근 활동
            </h3>
          </div>
          <div className="p-6">
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <BarChart3 className="w-12 h-12 text-gray-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 font-korean mb-2">
                활동 기록이 없습니다
              </h4>
              <p className="text-sm text-gray-600 font-korean">
                견적서를 작성하거나 다른 작업을 수행하면 여기에 표시됩니다
              </p>
            </div>
          </div>
        </div>
        </SubscriptionGuard>
      </main>
    </div>
  );
}



