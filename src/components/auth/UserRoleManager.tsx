/**
 * 사용자 역할 관리 컴포넌트
 * 
 * 관리자가 사용자의 역할을 변경하고 관리할 수 있는 컴포넌트입니다.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  UserProfile, 
  UserRole, 
  Tenant,
  getRoleDisplayName 
} from '@/lib/permissions';
import { useAuth } from '@/contexts/AuthContext';
import { AdminGuard } from './PermissionGuard';

/**
 * 사용자 역할 관리 Props
 */
interface UserRoleManagerProps {
  /** 관리할 테넌트 ID (선택적, 없으면 모든 테넌트) */
  tenantId?: string;
  /** 승인 대기 중인 사용자만 표시 */
  showPendingOnly?: boolean;
}

/**
 * 사용자 역할 관리 컴포넌트
 */
export function UserRoleManager({ tenantId, showPendingOnly = false }: UserRoleManagerProps) {
  const { userProfile, refreshUserProfile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  /**
   * 사용자 목록 로드
   */
  const loadUsers = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('users')
        .select(`
          *,
          tenant:tenants(*)
        `)
        .order('created_at', { ascending: false });

      // 특정 테넌트만 필터링
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('사용자 목록 로드 오류:', error.message);
        return;
      }

      if (data) {
        const allUsers = data as UserProfile[];
        
        // 미배정 역할(UNASSIGNED)인 사용자들을 대기 중인 사용자로 분류
        const pending = allUsers.filter(user => 
          user.role === UserRole.UNASSIGNED
        );
        
        // 나머지는 일반 사용자로 분류
        const regular = allUsers.filter(user => 
          user.role !== UserRole.UNASSIGNED
        );
        
        setPendingUsers(pending);
        setUsers(regular);
      }
    } catch (error) {
      console.error('사용자 목록 로드 처리 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 테넌트 목록 로드
   */
  const loadTenants = async () => {
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
  };

  /**
   * 사용자 역할 및 테넌트 변경
   */
  const updateUserRoleAndTenant = async (userId: string, newRole: UserRole, newTenantId?: string) => {
    try {
      setUpdating(userId);

      const updateData: any = { 
        role: newRole,
        updated_at: new Date().toISOString()
      };
      
      // 테넌트 ID가 제공된 경우 함께 업데이트
      if (newTenantId) {
        updateData.tenant_id = newTenantId;
      }

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        console.error('사용자 역할 변경 오류:', error.message);
        alert('역할 변경에 실패했습니다.');
        return;
      }

      // 목록 새로고침
      await loadUsers();
      
      // 자신의 역할을 변경한 경우 프로필 새로고침
      const updatedUser = users.find(u => u.id === userId);
      if (updatedUser?.user_id === userProfile?.user_id) {
        await refreshUserProfile();
      }

      alert('사용자 정보가 성공적으로 변경되었습니다.');
    } catch (error) {
      console.error('사용자 정보 변경 처리 오류:', error);
      alert('정보 변경 중 오류가 발생했습니다.');
    } finally {
      setUpdating(null);
    }
  };

  /**
   * 사용자 역할만 변경 (기존 함수 호환성 유지)
   */
  const updateUserRole = async (userId: string, newRole: UserRole) => {
    return updateUserRoleAndTenant(userId, newRole);
  };

  /**
   * 사용자 활성/비활성 토글
   */
  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      setUpdating(userId);

      const { error } = await supabase
        .from('users')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('사용자 상태 변경 오류:', error.message);
        alert('상태 변경에 실패했습니다.');
        return;
      }

      // 목록 새로고침
      await loadUsers();
      alert(`사용자가 ${!currentStatus ? '활성화' : '비활성화'}되었습니다.`);
    } catch (error) {
      console.error('사용자 상태 변경 처리 오류:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    } finally {
      setUpdating(null);
    }
  };

  /**
   * 컴포넌트 마운트 시 데이터 로드
   */
  useEffect(() => {
    loadUsers();
    loadTenants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  return (
    <AdminGuard fallback={<div>관리자 권한이 필요합니다.</div>}>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-1.5 bg-primary/10 rounded-md">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900 font-korean">
              {showPendingOnly ? '승인 대기 중' : '사용자 역할 관리'}
            </h3>
          </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">사용자 목록을 불러오는 중...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 승인 대기 중인 사용자 카드 */}
            {(showPendingOnly || pendingUsers.length > 0) && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-red-100 rounded-md">
                    <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-red-800 font-korean">
                    승인 대기 중 ({pendingUsers.length}명)
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingUsers.map((user) => (
                    <div 
                      key={user.id} 
                      className="flex flex-col bg-red-50 rounded-lg border border-red-200 divide-y divide-red-100"
                    >
                      {/* 사용자 기본 정보 */}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-medium text-gray-900">
                            {user.name}
                          </div>
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            대기중
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {user.email?.replace('@zapgo.local', '')}
                        </div>
                      </div>

                      {/* 역할 및 소속 설정 */}
                      <div className="p-4 space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1 font-korean">
                            역할 설정
                          </label>
                          <select
                            value={user.role}
                            onChange={(e) => updateUserRole(user.id, e.target.value as UserRole)}
                            disabled={updating === user.id}
                            className="w-full text-sm border border-red-300 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-50 font-korean"
                          >
                            {Object.values(UserRole).map((role) => (
                              <option key={role} value={role}>
                                {getRoleDisplayName(role)}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1 font-korean">
                            소속 설정
                          </label>
                          <select
                            value={user.tenant_id}
                            onChange={(e) => updateUserRoleAndTenant(user.id, user.role, e.target.value)}
                            disabled={updating === user.id}
                            className="w-full text-sm border border-red-300 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-50 font-korean"
                          >
                            {tenants.map((tenant) => (
                              <option key={tenant.id} value={tenant.id}>
                                {tenant.name} ({tenant.type === 'HQ' ? '본사' : tenant.type === 'OWNED_BRANCH' ? '직영점' : '대리점'})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* 가입일 */}
                      <div className="p-4 flex items-center justify-between text-xs text-gray-600">
                        <div>
                          {new Date(user.created_at).toLocaleDateString('ko-KR')} 가입
                        </div>
                        <div className="font-medium text-red-600">
                          {updating === user.id ? '처리 중...' : '설정 필요'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 기존 사용자 목록 - showPendingOnly가 true면 숨김 */}
            {!showPendingOnly && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((user) => (
                  <div 
                    key={user.id} 
                    className="flex flex-col bg-white rounded-lg border border-gray-200 divide-y divide-gray-100"
                  >
                    {/* 사용자 기본 정보 */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-medium text-gray-900">
                          {user.name}
                        </div>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            user.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {user.is_active ? '활성' : '비활성'}
                        </span>
                      </div>
                          <div className="text-sm text-gray-500">
                            {user.email?.replace('@zapgo.local', '')}
                          </div>
                    </div>

                    {/* 역할 및 소속 */}
                    <div className="p-4 bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <select
                            value={user.role}
                            onChange={(e) => updateUserRole(user.id, e.target.value as UserRole)}
                            disabled={updating === user.id}
                            className="w-full text-sm border rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-50"
                          >
                            {Object.values(UserRole).map((role) => (
                              <option key={role} value={role}>
                                {getRoleDisplayName(role)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={() => toggleUserStatus(user.id, user.is_active)}
                          disabled={updating === user.id}
                          className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                            user.is_active
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          } disabled:opacity-50`}
                        >
                          {updating === user.id ? '처리 중...' : (user.is_active ? '비활성화' : '활성화')}
                        </button>
                      </div>
                    </div>

                    {/* 소속 및 가입일 */}
                    <div className="p-4 flex items-center justify-between text-xs text-gray-500">
                      <div>
                        {user.tenant?.name || '미지정'}
                        {user.tenant?.type && (
                          <span className="ml-1">
                            ({user.tenant.type === 'HQ' ? '본사' : user.tenant.type === 'OWNED_BRANCH' ? '직영점' : '대리점'})
                          </span>
                        )}
                      </div>
                      <div>
                        {new Date(user.created_at).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {users.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <div className="text-gray-500 font-korean">
                    등록된 사용자가 없습니다.
                  </div>
                </div>
              )}
            </div>
            )}
          </div>
        )}
        </div>
      </div>
    </AdminGuard>
  );
}

/**
 * 사용자 역할 통계 컴포넌트
 */
export function UserRoleStats({ onRoleClick }: { onRoleClick?: (role: UserRole) => void }) {
  const [stats, setStats] = useState<Record<UserRole, number>>({
    [UserRole.UNASSIGNED]: 0,
    [UserRole.HQ_ADMIN]: 0,
    [UserRole.OWNED_BRANCH_ADMIN]: 0,
    [UserRole.OWNED_BRANCH_STAFF]: 0,
    [UserRole.DEALER_ADMIN]: 0,
    [UserRole.DEALER_STAFF]: 0,
  });
  const [loading, setLoading] = useState(true);

  /**
   * 역할별 사용자 수 통계 로드
   */
  const loadStats = async () => {
    try {
      setLoading(true);

      // 활성 사용자 조회
      const { data: activeData, error: activeError } = await supabase
        .from('users')
        .select('role')
        .eq('is_active', true);

      if (activeError) {
        console.error('활성 사용자 통계 로드 오류:', activeError.message);
        return;
      }

      // 승인 대기 중인 사용자 조회 (is_active = false)
      const { data: pendingData, error: pendingError } = await supabase
        .from('users')
        .select('role')
        .eq('is_active', false);

      if (pendingError) {
        console.error('승인 대기 사용자 통계 로드 오류:', pendingError.message);
        return;
      }

      const newStats = {
        [UserRole.UNASSIGNED]: 0,
        [UserRole.HQ_ADMIN]: 0,
        [UserRole.OWNED_BRANCH_ADMIN]: 0,
        [UserRole.OWNED_BRANCH_STAFF]: 0,
        [UserRole.DEALER_ADMIN]: 0,
        [UserRole.DEALER_STAFF]: 0,
      };

      // 활성 사용자 카운트
      if (activeData) {
        activeData.forEach((user) => {
          newStats[user.role as UserRole]++;
        });
      }

      // 승인 대기 사용자 카운트 (UNASSIGNED에 추가)
      if (pendingData) {
        newStats[UserRole.UNASSIGNED] = pendingData.length;
      }

      setStats(newStats);
    } catch (error) {
      console.error('통계 로드 처리 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  return (
    <AdminGuard>
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(stats).map(([role, count]) => (
          <div 
            key={role} 
            onClick={() => {
              // UNASSIGNED(승인대기)는 클릭하지 않도록 처리
              if (role !== UserRole.UNASSIGNED && onRoleClick) {
                onRoleClick(role as UserRole);
              }
            }}
            className={`bg-gray-50 rounded-md p-2.5 text-center border border-gray-200 ${
              role !== UserRole.UNASSIGNED && onRoleClick 
                ? 'cursor-pointer hover:border-primary hover:bg-primary/5 transition-all' 
                : ''
            }`}
          >
            <div className="text-lg font-bold text-gray-900">
              {count}
            </div>
            <div className="text-xs text-gray-500 font-korean">
              {getRoleDisplayName(role as UserRole, 'stats')}
            </div>
          </div>
        ))}
      </div>
    </AdminGuard>
  );
}
