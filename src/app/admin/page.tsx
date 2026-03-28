/**
 * 관리자 대시보드 페이지
 * 
 * 관리자 기능의 메인 페이지로, 각 관리 메뉴로 이동할 수 있습니다.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminGuard, usePermissions } from '@/components/guards/PermissionGuard';
import { PageHeader } from '@/components/layout/PageHeader';
import { Building2, FileText, Users, CreditCard, ArrowRight, Settings, Receipt, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { UNASSIGNED_TENANT } from '@/lib/constants';
import { useNetworkReconnect } from '@/hooks/useNetworkReconnect';
import { useAuth } from '@/contexts/AuthContext';

/**
 * 관리 메뉴 카드 데이터
 */
const adminMenus = [
  {
    id: 'branch',
    title: '지점',
    description: '지점을 등록, 수정, 삭제할 수 있습니다',
    icon: Building2,
    path: '/admin/branch'
  },
  {
    id: 'quotation',
    title: '견적',
    description: '견적 기준 항목과 가격을 설정할 수 있습니다',
    icon: Receipt,
    path: '/admin/quotation'
  },
  {
    id: 'users',
    title: '사용자',
    description: '사용자 승인 및 권한을 관리할 수 있습니다',
    icon: Users,
    path: '/admin/users'
  },
  {
    id: 'subscription',
    title: '구독',
    description: '대리점별 구독 갱신일을 관리할 수 있습니다',
    icon: CreditCard,
    path: '/admin/subscription'
  }
];

/**
 * 관리자 대시보드 컴포넌트
 */
function AdminDashboard() {
  const router = useRouter();
  const { userProfile: authUserProfile } = usePermissions();
  const { validateAndRefreshSession } = useAuth();
  const [stats, setStats] = useState({
    totalBranches: 0,
    totalMaterials: 0,
    totalUsers: 0,
    pendingUsers: 0,
    activeSubscriptions: 0
  });
  const [loading, setLoading] = useState(true);

  /**
   * 통계 데이터 로드
   * useCallback으로 메모이제이션하여 재사용
   */
  const loadStats = useCallback(async () => {
      try {
        setLoading(true);

        // 5개 쿼리 병렬 실행
        const [
          { count: branchCount },
          { count: policyCount },
          { count: userCount },
          { count: pendingCount },
          { data: subscriptions },
        ] = await Promise.all([
          supabase
            .from('tenants')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true)
            .neq('id', UNASSIGNED_TENANT.ID),
          supabase
            .from('price_policies')
            .select('*', { count: 'exact', head: true }),
          supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true),
          supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', false),
          supabase
            .from('subscriptions')
            .select('subscription_end_date, tenant_id')
            .eq('is_active', true)
            .neq('tenant_id', UNASSIGNED_TENANT.ID),
        ]);

        // 만료되지 않은 구독만 계산
            const currentDate = new Date().toISOString();
        const activeSubscriptions = subscriptions?.filter(sub => 
          sub.subscription_end_date && sub.subscription_end_date > currentDate
        ) || [];
        
        const tenantSubscriptions = new Set(activeSubscriptions.map(sub => sub.tenant_id));

        setStats({
          totalBranches: branchCount || 0,
          totalMaterials: policyCount || 0,
          totalUsers: userCount || 0,
          pendingUsers: pendingCount || 0,
          activeSubscriptions: tenantSubscriptions.size
        });
      } catch (error) {
        console.error('통계 데이터 로드 오류:', error);
      } finally {
        setLoading(false);
      }
  }, []);

  // 네트워크 재연결 시 세션 검증 및 데이터 재로드
  useNetworkReconnect({
    onReconnect: async () => {
      console.log('🔄 [관리자 대시보드] 재연결 감지 - 세션 검증 및 데이터 재로드');
      
      // 1. 세션 검증 및 복구
      const isValid = await validateAndRefreshSession();
      
      // 2. 세션이 유효하면 데이터 재로드
      if (isValid && authUserProfile) {
        await loadStats();
      }
    },
    debounceMs: 2000, // 2초 디바운스 (중복 호출 방지)
  });

  // 인증 체크 및 리다이렉션
  useEffect(() => {
    // 로그아웃 중이면 리다이렉션 중단
    if (typeof window !== 'undefined' && (window as any).__LOGOUT_IN_PROGRESS__) {
      return;
    }
    
    if (!loading && !authUserProfile) {
      // 로그인하지 않은 사용자는 로그인 페이지로
      router.replace('/login');
    }
  }, [authUserProfile, loading, router]);

  // 초기 데이터 로드
  useEffect(() => {
    if (authUserProfile) {
      loadStats();
    }
  }, [authUserProfile, loadStats]);

  if (!authUserProfile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="relative">
          {/* 외곽 회전 원 */}
          <div className="w-20 h-20 border-4 border-primary/20 rounded-full"></div>
          {/* 회전 애니메이션 원 */}
          <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
          {/* 중앙 아이콘 */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Shield className="w-8 h-8 text-primary animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  /**
   * 메뉴 카드 클릭 핸들러
   */
  const handleMenuClick = (path: string) => {
    router.push(path);
  };

  /**
   * 메뉴별 통계 데이터 매핑
   */
  const getMenuStats = (menuId: string) => {
    switch (menuId) {
      case 'branch':
        return { value: stats.totalBranches, label: '개' };
      case 'quotation':
        return { value: stats.totalMaterials, label: '개' };
      case 'users':
        return { 
          value: stats.totalUsers, 
          label: '명',
          badge: stats.pendingUsers > 0 ? stats.pendingUsers : null
        };
      case 'subscription':
        return { value: stats.activeSubscriptions, label: '개 활성' };
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* 관리자 권한 체크 */}
      <AdminGuard 
        fallback={
          <div className="bg-white rounded-2xl p-6 text-center">
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-gray-100 rounded-full">
                <Settings className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <h3 className="text-base font-bold text-gray-900 font-korean mb-1">
              관리자 권한 필요
            </h3>
            <p className="text-sm text-gray-500 font-korean">
              이 기능은 본사 관리자만 사용할 수 있습니다
            </p>
          </div>
        }
      >
        {/* 관리 메뉴 그리드 */}
        <div className="grid grid-cols-2 gap-3">
          {adminMenus.map((menu) => {
            const Icon = menu.icon;
            const menuStats = getMenuStats(menu.id);

            return (
              <div
                key={menu.id}
                onClick={() => handleMenuClick(menu.path)}
                className="relative bg-white rounded-2xl p-4 cursor-pointer transition-all duration-200 active:scale-95 select-none border-2 border-gray-200"
              >
                {/* 배지 (승인 대기 사용자 수) */}
                {menuStats?.badge && (
                  <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                    {menuStats.badge}
                  </div>
                )}

                <div className="flex flex-col items-center text-center gap-3">
                  {/* 아이콘 */}
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>

                  {/* 제목 */}
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-gray-900 font-korean">
                      {menu.title}
                    </h3>
                    
                    {/* 통계 */}
                    {menuStats && (
                      <div className="flex items-baseline justify-center gap-1">
                        {loading ? (
                          <div className="w-8 h-5 bg-gray-100 rounded animate-pulse" />
                        ) : (
                          <>
                            <span className="text-2xl font-bold text-primary">
                              {menuStats.value}
                            </span>
                            <span className="text-xs text-gray-400 font-korean">
                              {menuStats.label}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 설명 */}
                  <p className="text-xs text-gray-500 font-korean leading-relaxed line-clamp-2 min-h-[2.5rem]">
                    {menu.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </AdminGuard>
    </div>
  );
}

/**
 * 관리자 페이지 메인 컴포넌트
 */
export default function AdminPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* 통일된 헤더 */}
      <PageHeader />

      {/* 메인 컨텐츠 */}
      <main className="px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* 대시보드 컨텐츠 */}
          <AdminDashboard />
        </div>
      </main>
    </div>
  );
}
