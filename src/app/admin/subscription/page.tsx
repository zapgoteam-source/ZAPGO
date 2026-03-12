/**
 * 구독 관리 페이지 (모바일 최적화)
 * 
 * 대리점별 구독 갱신일을 관리하는 기능을 제공합니다.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminGuard, usePermissions } from '@/components/auth/PermissionGuard';
import { PageHeader } from '@/components/layout/PageHeader';
import { UserProfile, Tenant } from '@/lib/permissions';
import { Building2, CreditCard, AlertCircle, Users as UsersIcon, Clock, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { UNASSIGNED_TENANT } from '@/lib/constants';
import { useNetworkReconnect } from '@/hooks/useNetworkReconnect';
import { useAuth } from '@/contexts/AuthContext';

/**
 * 빠른 갱신 옵션
 */
const QUICK_EXTEND_OPTIONS = [
  { label: '1개월', months: 1 },
  { label: '3개월', months: 3 },
  { label: '6개월', months: 6 },
  { label: '1년', months: 12 }
];

/**
 * 구독 관리 페이지 컴포넌트
 */
// 구독 정보 타입 정의
interface Subscription {
  id: string;
  tenant_id: string;
  subscription_start_date: string;
  subscription_end_date: string | null;
  is_active: boolean;
  plan_type: string;
  max_users: number | null;
  notes: string | null;
}

export default function SubscriptionManagementPage() {
  const router = useRouter();
  const { userProfile: authUserProfile } = usePermissions();
  const { validateAndRefreshSession } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]); // 구독 정보 추가
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expiring' | 'expired'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenants, setSelectedTenants] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  /**
   * 사용자 목록 로드
   * useCallback으로 메모이제이션하여 재사용
   */
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          tenant:tenants(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('사용자 목록 로드 오류:', error.message);
        return;
      }

      if (data) {
        setUsers(data as UserProfile[]);
      }
    } catch (error) {
      console.error('사용자 목록 로드 처리 오류:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 테넌트 목록 로드
   * useCallback으로 메모이제이션하여 재사용
   */
  const loadTenants = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('테넌트 목록 로드 오류:', error.message);
        return;
      }

      if (data) {
        setTenants(data as Tenant[]);
      }
    } catch (error) {
      console.error('테넌트 목록 로드 처리 오류:', error);
    }
  }, []);

  /**
   * 구독 정보 목록 로드
   * useCallback으로 메모이제이션하여 재사용
   */
  const loadSubscriptions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('구독 정보 로드 오류:', error.message);
        return;
      }

      if (data) {
        setSubscriptions(data as Subscription[]);
      }
    } catch (error) {
      console.error('구독 정보 로드 처리 오류:', error);
    }
  }, []);

  /**
   * 모든 데이터를 한 번에 로드하는 함수
   */
  const loadAllData = useCallback(async () => {
    await Promise.all([
      loadUsers(),
      loadTenants(),
      loadSubscriptions()
    ]);
  }, [loadUsers, loadTenants, loadSubscriptions]);

  // 네트워크 재연결 시 세션 검증 및 데이터 재로드
  useNetworkReconnect({
    onReconnect: async () => {
      console.log('🔄 [구독 관리] 재연결 감지 - 세션 검증 및 데이터 재로드');
      
      // 1. 세션 검증 및 복구
      const isValid = await validateAndRefreshSession();
      
      // 2. 세션이 유효하면 데이터 재로드
      if (isValid && authUserProfile) {
        await loadAllData();
      }
    },
    debounceMs: 2000, // 2초 디바운스
  });

  // 인증 체크 및 리다이렉션
  useEffect(() => {
    // 로그아웃 중이면 리다이렉션 중단
    if (typeof window !== 'undefined' && (window as any).__LOGOUT_IN_PROGRESS__) {
      return;
    }
    
    if (!authUserProfile) {
      // 로그인하지 않은 사용자는 로그인 페이지로
      router.replace('/login');
    }
  }, [authUserProfile, router]);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (authUserProfile) {
      loadAllData();
    }
  }, [authUserProfile, loadAllData]);

  /**
   * 모달 열릴 때 body 스크롤 비활성화
   */
  useEffect(() => {
    if (selectedTenant) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedTenant]);

  /**
   * 빠른 갱신 처리 (subscriptions 테이블 사용)
   */
  const handleQuickExtend = async (tenant: Tenant, months: number) => {
    try {
      setUpdating(tenant.id);

      // 기존 구독 정보 가져오기
      const existingSubscription = subscriptions.find(s => s.tenant_id === tenant.id);
      const currentDate = existingSubscription?.subscription_end_date;

      // 현재 날짜 또는 만료일 중 더 늦은 날짜를 기준으로 연장
      const baseDate = currentDate && new Date(currentDate) > new Date() 
        ? new Date(currentDate) 
        : new Date();
      
      const newDate = new Date(baseDate);
      newDate.setMonth(newDate.getMonth() + months);
      const newDateISO = newDate.toISOString();

      if (existingSubscription) {
        // 기존 구독 업데이트
        const { error } = await supabase
          .from('subscriptions')
          .update({
            subscription_end_date: newDateISO,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSubscription.id);

        if (error) {
          console.error('구독 갱신 오류:', error);
          alert('구독 갱신에 실패했습니다.');
          return;
        }
      } else {
        // 새 구독 생성
        const { error } = await supabase
          .from('subscriptions')
          .insert({
            tenant_id: tenant.id,
            subscription_start_date: new Date().toISOString(),
            subscription_end_date: newDateISO,
            is_active: true,
            plan_type: 'standard',
            max_users: 5
          });

        if (error) {
          console.error('구독 생성 오류:', error);
          alert('구독 생성에 실패했습니다.');
          return;
        }
      }

      await loadSubscriptions();
      alert(`${months}개월 연장되었습니다.`);
    } catch (error) {
      console.error('빠른 갱신 오류:', error);
      alert('구독 갱신 중 오류가 발생했습니다.');
    } finally {
      setUpdating(null);
    }
  };

  /**
   * 일괄 갱신 처리 (subscriptions 테이블 사용)
   */
  const handleBulkExtend = async (months: number) => {
    if (selectedTenants.size === 0) {
      alert('선택된 지점이 없습니다.');
      return;
    }

    if (!confirm(`선택한 ${selectedTenants.size}개 지점을 ${months}개월 연장하시겠습니까?`)) {
      return;
    }

    try {
      setUpdating('bulk');

      for (const tenantId of Array.from(selectedTenants)) {
        const tenant = tenants.find(t => t.id === tenantId);
        if (!tenant) continue;

        const existingSubscription = subscriptions.find(s => s.tenant_id === tenant.id);
        const currentDate = existingSubscription?.subscription_end_date;

        const baseDate = currentDate && new Date(currentDate) > new Date() 
          ? new Date(currentDate) 
          : new Date();
        
        const newDate = new Date(baseDate);
        newDate.setMonth(newDate.getMonth() + months);
        const newDateISO = newDate.toISOString();

        if (existingSubscription) {
          await supabase
            .from('subscriptions')
            .update({
              subscription_end_date: newDateISO,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingSubscription.id);
        } else {
          await supabase
            .from('subscriptions')
            .insert({
              tenant_id: tenant.id,
              subscription_start_date: new Date().toISOString(),
              subscription_end_date: newDateISO,
              is_active: true,
              plan_type: 'standard',
              max_users: 5
            });
        }
      }

      await loadSubscriptions();
      setSelectedTenants(new Set());
      setShowBulkActions(false);
      alert(`${selectedTenants.size}개 지점이 ${months}개월 연장되었습니다.`);
    } catch (error) {
      console.error('일괄 갱신 오류:', error);
      alert('일괄 갱신 중 오류가 발생했습니다.');
    } finally {
      setUpdating(null);
    }
  };

  /**
   * 지점 선택/해제
   */
  const toggleTenantSelection = (tenantId: string) => {
    const newSelected = new Set(selectedTenants);
    if (newSelected.has(tenantId)) {
      newSelected.delete(tenantId);
    } else {
      newSelected.add(tenantId);
    }
    setSelectedTenants(newSelected);
  };

  /**
   * 전체 선택/해제
   */
  const toggleSelectAll = () => {
    if (selectedTenants.size === sortedTenants.length) {
      setSelectedTenants(new Set());
    } else {
      setSelectedTenants(new Set(sortedTenants.map(t => t.tenant.id)));
    }
  };

  /**
   * 구독 갱신일 저장 (subscriptions 테이블 사용)
   */
  const handleSaveSubscription = async (tenant: Tenant, newDate: string) => {
    try {
      setUpdating(tenant.id);

      // 기존 구독 정보 확인
      const existingSubscription = subscriptions.find(s => s.tenant_id === tenant.id);

      if (existingSubscription) {
        // 기존 구독 정보 업데이트
        const { error } = await supabase
          .from('subscriptions')
          .update({
            subscription_end_date: newDate || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSubscription.id);

        if (error) {
          console.error('구독 갱신일 업데이트 오류:', error);
          alert('구독 갱신일 변경에 실패했습니다.');
          return;
        }
      } else {
        // 새 구독 정보 생성
        const { error } = await supabase
          .from('subscriptions')
          .insert({
            tenant_id: tenant.id,
            subscription_start_date: new Date().toISOString(),
            subscription_end_date: newDate || null,
            is_active: true,
            plan_type: 'standard',
            max_users: 5
          });

        if (error) {
          console.error('구독 정보 생성 오류:', error);
          alert('구독 정보 생성에 실패했습니다.');
          return;
        }
      }

      // 데이터 새로고침
      await loadSubscriptions();
      alert('구독 갱신일이 성공적으로 변경되었습니다.');
    } catch (error) {
      console.error('구독 갱신일 변경 오류:', error);
      alert('구독 갱신일 변경 중 오류가 발생했습니다.');
    } finally {
      setUpdating(null);
    }
  };

  /**
   * 지점별 구독 상태 계산 (subscriptions 테이블 사용)
   */
  const getTenantSubscriptionStatus = (tenant: Tenant) => {
    // subscriptions 테이블에서 해당 tenant의 구독 정보 찾기
    const subscription = subscriptions.find(s => s.tenant_id === tenant.id);
    
    if (!subscription || !subscription.subscription_end_date) {
      return { status: 'none', daysLeft: null, color: 'gray', subscriptionDate: null };
    }

    const subscriptionDate = subscription.subscription_end_date;
    const daysLeft = Math.ceil((new Date(subscriptionDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      return { status: 'expired', daysLeft, color: 'red', subscriptionDate };
    } else if (daysLeft <= 7) {
      return { status: 'expiring', daysLeft, color: 'orange', subscriptionDate };
    } else if (daysLeft <= 30) {
      return { status: 'warning', daysLeft, color: 'yellow', subscriptionDate };
    } else {
      return { status: 'active', daysLeft, color: 'green', subscriptionDate };
    }
  };

  // 테넌트별로 그룹화 (본사 제외)
  const tenantUsers = tenants
    .filter(tenant => tenant.id !== UNASSIGNED_TENANT.ID && tenant.type === 'DEALER')
    .map(tenant => {
      const tenantUserList = users.filter(u => u.tenant_id === tenant.id);
      const subscriptionStatus = getTenantSubscriptionStatus(tenant);
      
      return {
        tenant,
        userCount: tenantUserList.length,
        ...subscriptionStatus
      };
    });

  // 필터링 및 검색
  const filteredTenants = tenantUsers.filter(item => {
    // 상태 필터
    if (filterStatus === 'active' && item.status !== 'active' && item.status !== 'warning') return false;
    if (filterStatus === 'expiring' && item.status !== 'expiring') return false;
    if (filterStatus === 'expired' && item.status !== 'expired') return false;

    // 검색
    if (searchTerm && !item.tenant.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    return true;
  });

  // 정렬 (만료일 임박 순)
  const sortedTenants = [...filteredTenants].sort((a, b) => {
    if (a.daysLeft === null) return 1;
    if (b.daysLeft === null) return -1;
    return a.daysLeft - b.daysLeft;
  });

  // 통계
  const stats = {
    total: tenantUsers.length,
    active: tenantUsers.filter(t => t.status === 'active' || t.status === 'warning').length,
    expiring: tenantUsers.filter(t => t.status === 'expiring').length,
    expired: tenantUsers.filter(t => t.status === 'expired').length
  };

  /**
   * 상태별 색상 및 텍스트
   */
  const getStatusDisplay = (status: string, daysLeft: number | null) => {
    switch (status) {
      case 'expired':
        return {
          bg: 'bg-red-50',
          text: 'text-red-600',
          badge: 'bg-red-100 text-red-800',
          label: '만료'
        };
      case 'expiring':
        return {
          bg: 'bg-orange-50',
          text: 'text-orange-600',
          badge: 'bg-orange-100 text-orange-800',
          label: `${daysLeft}일 남음`
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          text: 'text-yellow-600',
          badge: 'bg-yellow-100 text-yellow-800',
          label: `${daysLeft}일 남음`
        };
      case 'active':
        return {
          bg: 'bg-green-50',
          text: 'text-green-600',
          badge: 'bg-green-100 text-green-800',
          label: '활성'
        };
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-600',
          badge: 'bg-gray-100 text-gray-800',
          label: '미설정'
        };
    }
  };

  // 모달용 임시 날짜 상태
  const [tempDate, setTempDate] = useState('');

  // 모달이 열릴 때 날짜 초기화
  useEffect(() => {
    if (selectedTenant) {
      const subscriptionStatus = getTenantSubscriptionStatus(selectedTenant);
      setTempDate(subscriptionStatus.subscriptionDate ? subscriptionStatus.subscriptionDate.split('T')[0] : '');
    }
  }, [selectedTenant]);

  /**
   * 상세 모달 렌더링
   */
  const renderDetailModal = () => {
    if (!selectedTenant) return null;

    const tenantUserList = users.filter(u => u.tenant_id === selectedTenant.id);
    const subscriptionStatus = getTenantSubscriptionStatus(selectedTenant);
    const statusDisplay = getStatusDisplay(subscriptionStatus.status, subscriptionStatus.daysLeft);

    // 프로그레스 바 계산 (30일 기준)
    const getProgressPercentage = () => {
      if (!subscriptionStatus.daysLeft) return 0;
      if (subscriptionStatus.daysLeft < 0) return 0;
      return Math.min((subscriptionStatus.daysLeft / 30) * 100, 100);
    };

    const progressPercentage = getProgressPercentage();

    return (
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={() => setSelectedTenant(null)}
      >
        <div
          className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 모달 헤더 */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between rounded-t-xl">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-md">
                <Building2 className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 font-korean">
                구독 관리 - {selectedTenant.name}
              </h3>
            </div>
            <button
              onClick={() => setSelectedTenant(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 모달 본문 */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
            {/* 현재 상태 섹션 */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 font-korean flex items-center gap-2 pb-2 border-b border-gray-200">
                현재 상태
              </h4>
              
              <div className={`${statusDisplay.bg} rounded-md p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-900 font-korean">구독 상태</span>
                  <span className={`px-3 py-1 text-xs font-semibold rounded ${statusDisplay.badge}`}>
                    {statusDisplay.label}
                  </span>
                </div>
                {subscriptionStatus.subscriptionDate && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 font-korean">만료일</span>
                        <span className="font-semibold text-gray-900 font-korean">
                          {new Date(subscriptionStatus.subscriptionDate).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      
                      {/* 프로그레스 바 */}
                      <div className="w-full bg-gray-200 rounded h-3 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 rounded ${
                            subscriptionStatus.status === 'expired' ? 'bg-red-500' :
                            subscriptionStatus.status === 'expiring' ? 'bg-orange-500' :
                            subscriptionStatus.status === 'warning' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 빠른 갱신 섹션 */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 font-korean flex items-center gap-2 pb-2 border-b border-gray-200">
                빠른 갱신
              </h4>
              
              <div className="grid grid-cols-4 gap-2">
                {QUICK_EXTEND_OPTIONS.map(option => (
                  <button
                    key={option.months}
                    onClick={() => handleQuickExtend(selectedTenant, option.months)}
                    disabled={updating === selectedTenant.id}
                    className="py-2.5 bg-primary/10 text-primary rounded-md text-sm font-semibold hover:bg-primary/20 transition-all disabled:opacity-50 font-korean"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 날짜 직접 설정 섹션 */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 font-korean flex items-center gap-2 pb-2 border-b border-gray-200">
                갱신일 직접 설정
              </h4>
              
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={tempDate}
                  onChange={(e) => setTempDate(e.target.value)}
                  disabled={updating === selectedTenant.id}
                  className="flex-shrink-0 w-48 text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-50 font-korean"
                />
                {tempDate && subscriptionStatus.subscriptionDate && (() => {
                  const newDate = new Date(tempDate);
                  const currentEndDate = new Date(subscriptionStatus.subscriptionDate);
                  const daysDiff = Math.ceil((newDate.getTime() - currentEndDate.getTime()) / (1000 * 60 * 60 * 24));
                  
                  if (daysDiff > 0) {
                    return (
                      <span className="text-sm text-green-600 font-semibold font-korean">
                        +{daysDiff}일 연장
                      </span>
                    );
                  } else if (daysDiff < 0) {
                    return (
                      <span className="text-sm text-red-600 font-semibold font-korean">
                        {daysDiff}일 단축
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>

            {/* 적용될 사용자 섹션 */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 font-korean flex items-center gap-2 pb-2 border-b border-gray-200">
                적용될 사용자 ({tenantUserList.length}명)
              </h4>
              
              <div className="inline-block bg-gray-50 rounded-md p-3 space-y-2 max-h-32 overflow-y-auto">
                {tenantUserList.length > 0 ? (
                  tenantUserList.map(user => (
                    <div key={user.id} className="flex items-center gap-2 text-sm text-gray-900 font-korean whitespace-nowrap">
                      <UsersIcon className="w-4 h-4 text-gray-400" />
                      {user.name}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 font-korean text-center">
                    이 지점에 사용자가 없습니다
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 모달 푸터 */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 py-3 flex items-center justify-end gap-2 rounded-b-xl">
            <button
              onClick={() => setSelectedTenant(null)}
              disabled={updating === selectedTenant.id}
              className="px-4 py-2 bg-white text-gray-700 rounded-md text-sm font-medium hover:bg-gray-100 transition-all font-korean border border-gray-200 disabled:opacity-50"
            >
              취소
            </button>
            
            <button
              onClick={() => handleSaveSubscription(selectedTenant, tempDate ? new Date(tempDate).toISOString() : '')}
              disabled={updating === selectedTenant.id}
              className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 transition-all font-korean disabled:opacity-50"
            >
              {updating === selectedTenant.id ? '처리 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  /**
   * 일괄 작업 패널 렌더링
   */
  const renderBulkActionsPanel = () => {
    if (!showBulkActions) return null;

    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
          {/* 헤더 */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between rounded-t-xl">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-md">
                <CreditCard className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 font-korean">
                일괄 갱신 ({selectedTenants.size}개 지점)
              </h3>
            </div>
            <button
              onClick={() => setShowBulkActions(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 본문 */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
            {/* 연장 기간 섹션 */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 font-korean flex items-center gap-2 pb-2 border-b border-gray-200">
                연장 기간 선택
              </h4>
              
              <div className="grid grid-cols-4 gap-2">
                {QUICK_EXTEND_OPTIONS.map(option => (
                  <button
                    key={option.months}
                    onClick={() => handleBulkExtend(option.months)}
                    disabled={updating === 'bulk'}
                    className="py-2.5 bg-primary/10 text-primary rounded-md text-sm font-semibold hover:bg-primary/20 transition-all disabled:opacity-50 font-korean"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 선택된 지점 목록 섹션 */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 font-korean flex items-center gap-2 pb-2 border-b border-gray-200">
                선택된 지점 ({selectedTenants.size}개)
              </h4>
              
              <div className="bg-gray-50 rounded-md p-3 max-h-48 overflow-y-auto">
                {Array.from(selectedTenants).map(tenantId => {
                  const tenant = tenants.find(t => t.id === tenantId);
                  return tenant ? (
                    <div key={tenant.id} className="text-sm text-gray-900 font-korean py-1">
                      • {tenant.name}
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          </div>

          {/* 푸터 */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 py-3 flex items-center justify-end gap-2 rounded-b-xl">
            <button
              onClick={() => setShowBulkActions(false)}
              disabled={updating === 'bulk'}
              className="px-4 py-2 bg-white text-gray-700 rounded-md text-sm font-medium hover:bg-gray-100 transition-all font-korean border border-gray-200 disabled:opacity-50"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* 통일된 헤더 */}
      <PageHeader />

      {/* 메인 컨텐츠 */}
      <main className="px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* 뒤로가기 + 페이지 제목 */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center gap-2 text-gray-600 hover:text-primary active:scale-95 transition-all mb-4 select-none"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium font-korean">관리자 대시보드</span>
            </button>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 font-korean">
                  구독 관리
                </h1>
                <p className="text-sm text-gray-600 font-korean mt-1">
                  대리점별 구독 갱신일을 관리할 수 있습니다
                </p>
              </div>
            </div>
          </div>

          {/* 관리자 권한 체크 */}
          <AdminGuard 
            fallback={
              <div className="bg-white border border-gray-200 rounded-md p-6 text-center">
                <div className="flex justify-center mb-4">
                  <CreditCard className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 font-korean mb-2">
                  관리자 권한 필요
                </h3>
                <p className="text-sm text-gray-600 font-korean">
                  이 기능은 본사 관리자만 사용할 수 있습니다
                </p>
              </div>
            }
          >
            {/* 상세 모달 */}
            {renderDetailModal()}

            {/* 일괄 작업 패널 */}
            {renderBulkActionsPanel()}

            <div className="space-y-6">
              {/* 통계 카드 */}
              <div className="bg-white border border-gray-200 rounded-md shadow-sm">
                <div className="px-3 py-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-primary/10 rounded-md">
                      <CreditCard className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 font-korean">
                      구독 현황
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div 
                      onClick={() => setFilterStatus('all')}
                      className={`bg-gray-50 rounded-md p-2.5 text-center border border-gray-200 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all ${
                        filterStatus === 'all' ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      <div className="text-lg font-bold text-gray-900">{stats.total}</div>
                      <div className="text-xs text-gray-500 font-korean">전체 지점</div>
                    </div>

                    <div 
                      onClick={() => setFilterStatus('active')}
                      className={`bg-gray-50 rounded-md p-2.5 text-center border border-gray-200 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all ${
                        filterStatus === 'active' ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      <div className="text-lg font-bold text-gray-900">{stats.active}</div>
                      <div className="text-xs text-gray-500 font-korean">활성</div>
                    </div>

                    <div 
                      onClick={() => setFilterStatus('expiring')}
                      className={`bg-gray-50 rounded-md p-2.5 text-center border border-gray-200 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all ${
                        filterStatus === 'expiring' ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      <div className="text-lg font-bold text-gray-900">{stats.expiring}</div>
                      <div className="text-xs text-gray-500 font-korean">임박 (7일 이내)</div>
                    </div>

                    <div 
                      onClick={() => setFilterStatus('expired')}
                      className={`bg-gray-50 rounded-md p-2.5 text-center border border-gray-200 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all ${
                        filterStatus === 'expired' ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      <div className="text-lg font-bold text-gray-900">{stats.expired}</div>
                      <div className="text-xs text-gray-500 font-korean">만료</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 일괄 작업 버튼 */}
              {selectedTenants.size > 0 && (
                <div className="bg-white rounded-md border border-gray-200 shadow-sm">
                  <div className="px-3 py-3">
                    <button
                      onClick={() => setShowBulkActions(true)}
                      className="w-full py-2.5 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary/90 transition-all font-korean flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      선택한 {selectedTenants.size}개 지점 일괄 갱신
                    </button>
                  </div>
                </div>
              )}

              {/* 지점 목록 */}
              <div className="bg-white rounded-md border border-gray-200 shadow-sm">
                <div className="px-3 py-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-primary/10 rounded-md">
                      <Building2 className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 font-korean">
                      지점 목록 ({sortedTenants.length})
                    </h3>
                  </div>

                  {/* 검색창 */}
                  <div className="relative mb-3">
                    <input
                      type="text"
                      placeholder="지점명 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-korean"
                    />
                    <svg 
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="relative">
                        {/* 외곽 회전 원 */}
                        <div className="w-16 h-16 border-4 border-primary/20 rounded-full"></div>
                        {/* 회전 애니메이션 원 */}
                        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
                        {/* 중앙 아이콘 */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                          <CreditCard className="w-6 h-6 text-primary animate-pulse" />
                        </div>
                      </div>
                    </div>
                  ) : sortedTenants.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sortedTenants.map(({ tenant, userCount, status, daysLeft, subscriptionDate }) => {
                        const statusDisplay = getStatusDisplay(status, daysLeft);
                        const isSelected = selectedTenants.has(tenant.id);
                        
                        return (
                          <div
                            key={tenant.id}
                            onClick={() => setSelectedTenant(tenant)}
                            className={`bg-white rounded-md border border-gray-200 p-4 cursor-pointer hover:border-primary hover:shadow-md transition-all duration-200 ${
                              isSelected ? 'ring-2 ring-primary' : ''
                            }`}
                          >
                            {/* 지점 정보 헤더 */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="font-semibold text-gray-900 font-korean">
                                {tenant.name}
                              </div>
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTenantSelection(tenant.id);
                                }}
                              >
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                  isSelected ? 'bg-primary border-primary' : 'border-gray-300'
                                }`}>
                                  {isSelected && (
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* 사용자 수 */}
                            <div className="text-sm text-gray-600 font-korean mb-2 flex items-center gap-1">
                              <UsersIcon className="w-3.5 h-3.5" />
                              {userCount}명
                            </div>

                            {/* 구독 상태 */}
                            <div className="flex items-center justify-between">
                              <span className={`px-2 py-0.5 text-xs font-medium rounded ${statusDisplay.badge}`}>
                                {statusDisplay.label}
                              </span>
                              {subscriptionDate && (
                                <span className="text-xs text-gray-500 font-korean">
                                  {new Date(subscriptionDate).toLocaleDateString('ko-KR', {
                                    year: '2-digit',
                                    month: 'numeric',
                                    day: 'numeric'
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
                      <div className="text-gray-500 font-korean">
                        {searchTerm ? '검색 결과가 없습니다' : '등록된 대리점이 없습니다'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </AdminGuard>
        </div>
      </main>
    </div>
  );
}
