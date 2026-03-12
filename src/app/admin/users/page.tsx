/**
 * 사용자 관리 페이지
 * 
 * 사용자 승인, 권한 관리 기능을 제공합니다.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminGuard, usePermissions } from '@/components/auth/PermissionGuard';
import { PageHeader } from '@/components/layout/PageHeader';
import { UserRoleStats } from '@/components/auth/UserRoleManager';
import { getRoleDisplayName, UserRole, UserProfile, Tenant } from '@/lib/permissions';
import { Users, Clock, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { UNASSIGNED_TENANT } from '@/lib/constants';

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

/**
 * 사용자 관리 페이지 컴포넌트
 */
export default function UsersManagementPage() {
  const router = useRouter();
  const { userProfile: authUserProfile } = usePermissions();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [statsKey, setStatsKey] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [originalUser, setOriginalUser] = useState<UserProfile | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromRoleModal, setFromRoleModal] = useState(false);

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

  /**
   * 사용자 목록 로드
   */
  const loadUsers = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          tenant:tenants(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('사용자 목록 로드 오류:', error.message);
        return;
      }

      if (data) {
        const allUsers = data as UserProfile[];
        
        // 승인 대기 중인 사용자 (is_active가 false인 사용자)
        const pending = allUsers.filter(user => !user.is_active);
        
        // 승인된 사용자 (is_active가 true인 사용자)
        const regular = allUsers.filter(user => user.is_active);
        
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
   * 구독 정보 목록 로드
   */
  const loadSubscriptions = async () => {
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
  };

  /**
   * 사용자 역할 및 테넌트 변경 (임시 저장 - 승인 전)
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
        console.error('사용자 정보 변경 오류:', error.message);
        alert('정보 변경에 실패했습니다.');
        return;
      }

      // 목록 새로고침
      await loadUsers();
    } catch (error) {
      console.error('사용자 정보 변경 처리 오류:', error);
      alert('정보 변경 중 오류가 발생했습니다.');
    } finally {
      setUpdating(null);
    }
  };

  /**
   * 사용자 역할만 변경 (임시 저장)
   */
  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      setUpdating(userId);

      const { error } = await supabase
        .from('users')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('사용자 역할 변경 오류:', error.message);
        alert('역할 변경에 실패했습니다.');
        return;
      }

      // 목록 새로고침
      await loadUsers();
      setStatsKey(prev => prev + 1);
    } catch (error) {
      console.error('사용자 역할 변경 처리 오류:', error);
      alert('역할 변경 중 오류가 발생했습니다.');
    } finally {
      setUpdating(null);
    }
  };

  /**
   * 사용자 승인 (역할과 소속이 모두 설정되어야 함)
   */
  const approveUser = async (userId: string) => {
    try {
      setUpdating(userId);

      // 현재 사용자 찾기
      const user = pendingUsers.find(u => u.id === userId);
      
      if (!user) {
        alert('사용자를 찾을 수 없습니다.');
        setUpdating(null);
        return;
      }

      // 역할과 소속이 모두 설정되어 있는지 확인
      if (!user.tenant_id || user.tenant_id === UNASSIGNED_TENANT.ID || user.role === UserRole.UNASSIGNED) {
        alert('역할과 소속을 모두 올바르게 설정해주세요.');
        setUpdating(null);
        return;
      }

      // 승인 처리 (활성화)
      const { error } = await supabase
        .from('users')
        .update({ 
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('사용자 승인 오류:', error.message);
        alert('승인 처리에 실패했습니다.');
        return;
      }

      // 목록 새로고침
      await loadUsers();
      setStatsKey(prev => prev + 1);
      alert('사용자가 승인되었습니다.');
    } catch (error) {
      console.error('사용자 승인 처리 오류:', error);
      alert('승인 처리 중 오류가 발생했습니다.');
    } finally {
      setUpdating(null);
    }
  };

  /**
   * 사용자 활성/비활성 토글
   */
  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      setUpdating(userId);

      // 비활성화 시 권한과 소속을 미배정으로 초기화
      const updateData: any = {
        is_active: !currentStatus,
        updated_at: new Date().toISOString()
      };

      if (currentStatus) {
        // 현재 활성 상태에서 비활성화하는 경우
        updateData.role = UserRole.UNASSIGNED;
        updateData.tenant_id = UNASSIGNED_TENANT.ID;
      }

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        console.error('사용자 상태 변경 오류:', error.message);
        alert('상태 변경에 실패했습니다.');
        return;
      }

      // 목록 새로고침
      await loadUsers();
      setStatsKey(prev => prev + 1);
      alert(`사용자가 ${!currentStatus ? '활성화' : '비활성화'}되었습니다.`);
    } catch (error) {
      console.error('사용자 상태 변경 처리 오류:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    } finally {
      setUpdating(null);
    }
  };

  /**
   * 모달에서 사용자 변경사항 저장
   */
  const handleSaveUserChanges = async () => {
    if (!selectedUser || !originalUser) return;

    try {
      setUpdating(selectedUser.id);

      const updateData: any = { 
        role: selectedUser.role,
        tenant_id: selectedUser.tenant_id,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', selectedUser.id);

      if (error) {
        console.error('사용자 정보 변경 오류:', error.message);
        alert('정보 변경에 실패했습니다.');
        return;
      }

      // 목록 새로고침
      await loadUsers();
      setStatsKey(prev => prev + 1);
      
      alert('사용자 정보가 성공적으로 변경되었습니다.');
      
      // 모달 닫기
      handleCloseModal();
    } catch (error) {
      console.error('사용자 정보 변경 처리 오류:', error);
      alert('정보 변경 중 오류가 발생했습니다.');
    } finally {
      setUpdating(null);
    }
  };

  /**
   * 모달 닫기
   */
  const handleCloseModal = () => {
    setSelectedUser(null);
    setOriginalUser(null);
    setHasChanges(false);
    setFromRoleModal(false);
  };

  /**
   * 사용자 상세 모달에서 뒤로가기
   */
  const handleBackToRoleModal = () => {
    setSelectedUser(null);
    setOriginalUser(null);
    setHasChanges(false);
    setFromRoleModal(false);
  };

  /**
   * 모달 열릴 때 body 스크롤 비활성화
   */
  useEffect(() => {
    if (selectedUser || selectedRole) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedUser, selectedRole]);

  // 역할 클릭 핸들러 메모이제이션
  const handleRoleClick = useCallback((role: UserRole) => {
    setSelectedRole(role);
  }, []);

  // 컴포넌트 마운트 시 데이터 병렬 로드
  useEffect(() => {
    if (authUserProfile) {
      Promise.all([loadUsers(), loadTenants(), loadSubscriptions()]);
    }
  }, [authUserProfile]);

  /**
   * 역할별 사용자 목록 모달 렌더링
   */
  const renderRoleUsersModal = () => {
    if (!selectedRole || selectedUser) return null;

    const roleUsers = users.filter(user => user.role === selectedRole);
    const filteredUsers = roleUsers.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const sortedUsers = [...filteredUsers].sort((a, b) => 
      a.name.localeCompare(b.name, 'ko-KR')
    );

    return (
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={() => {
          setSelectedRole(null);
          setSearchTerm('');
        }}
      >
        <div 
          className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 모달 헤더 */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between rounded-t-xl">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-md">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 font-korean">
                {getRoleDisplayName(selectedRole)} ({roleUsers.length}명)
              </h3>
            </div>
            <button
              onClick={() => {
                setSelectedRole(null);
                setSearchTerm('');
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 검색 영역 */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="relative">
              <input
                type="text"
                placeholder="이름 또는 이메일로 검색..."
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
          </div>

          {/* 사용자 목록 */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {sortedUsers.length > 0 ? (
              <div className="space-y-2">
                {sortedUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => {
                      setSelectedUser(user);
                      setOriginalUser(user);
                      setHasChanges(false);
                      setFromRoleModal(true);
                      setSearchTerm('');
                    }}
                    className="bg-white border border-gray-200 rounded-md p-3 hover:border-primary hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 space-y-1">
                        <div className="font-medium text-gray-900 font-korean">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-600 font-korean">
                          소속: {user.tenant?.name || '미지정'}
                          {user.tenant?.type && (
                            <span className="ml-1 text-gray-500">
                              ({user.tenant.type === 'HQ' ? '본사' : '대리점'})
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 font-korean">
                          권한: {getRoleDisplayName(user.role)}
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <svg className="w-12 h-12 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="font-korean">
                  {searchTerm ? '검색 결과가 없습니다' : '해당 역할의 사용자가 없습니다'}
                </p>
              </div>
            )}
          </div>

          {/* 모달 푸터 */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 py-3 flex items-center justify-end rounded-b-xl">
            <button
              onClick={() => {
                setSelectedRole(null);
                setSearchTerm('');
              }}
              className="px-4 py-2 bg-white text-gray-700 rounded-md text-sm font-medium hover:bg-gray-100 transition-all font-korean border border-gray-200"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    );
  };

  /**
   * 사용자 상세 모달 렌더링
   */
  const renderUserDetailModal = () => {
    if (!selectedUser) return null;

    return (
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={handleCloseModal}
      >
        <div 
          className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 모달 헤더 */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between rounded-t-xl">
            <div className="flex items-center gap-2">
              {fromRoleModal && (
                <button
                  onClick={handleBackToRoleModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-md"
                  title="뒤로가기"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <div className="p-1.5 bg-primary/10 rounded-md">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 font-korean">
                사용자 상세 정보
              </h3>
            </div>
            <button
              onClick={handleCloseModal}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 모달 본문 */}
          <div className="px-4 py-4 space-y-5">
            {/* 기본 정보 섹션 */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 font-korean flex items-center gap-2 pb-2 border-b border-gray-200">
                기본 정보
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1 font-korean">이름</label>
                  <div className="text-sm font-medium text-gray-900 font-korean">{selectedUser.name}</div>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-500 mb-1 font-korean">아이디</label>
                  <div className="text-sm text-gray-900">{selectedUser.email?.replace('@zapgo.local', '')}</div>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-500 mb-1 font-korean">상태</label>
                  <span
                    className={`inline-flex text-xs font-medium ${
                      selectedUser.is_active ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {selectedUser.is_active ? '활성' : '비활성'}
                  </span>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-500 mb-1 font-korean">가입일</label>
                  <div className="text-sm text-gray-900">
                    {new Date(selectedUser.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* 권한 및 소속 섹션 */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 font-korean flex items-center gap-2 pb-2 border-b border-gray-200">
                권한 및 소속
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1 font-korean">권한</label>
                  <select
                    value={selectedUser.role}
                    onChange={(e) => {
                      const newRole = e.target.value as UserRole;
                      setSelectedUser({...selectedUser, role: newRole});
                      const hasRoleChange = newRole !== originalUser?.role;
                      const hasTenantChange = selectedUser.tenant_id !== originalUser?.tenant_id;
                      setHasChanges(hasRoleChange || hasTenantChange);
                    }}
                    disabled={updating === selectedUser.id}
                    className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-50 font-korean"
                  >
                    {Object.values(UserRole).map((role) => (
                      <option key={role} value={role}>
                        {getRoleDisplayName(role)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1 font-korean">소속</label>
                  <select
                    value={selectedUser.tenant_id || ''}
                    onChange={(e) => {
                      const newTenantId = e.target.value;
                      const newTenant = tenants.find(t => t.id === newTenantId);
                      setSelectedUser({...selectedUser, tenant_id: newTenantId, tenant: newTenant});
                      const hasRoleChange = selectedUser.role !== originalUser?.role;
                      const hasTenantChange = newTenantId !== originalUser?.tenant_id;
                      setHasChanges(hasRoleChange || hasTenantChange);
                    }}
                    disabled={updating === selectedUser.id}
                    className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-50 font-korean"
                  >
                    {tenants
                      .filter(tenant => tenant.id !== UNASSIGNED_TENANT.ID)
                      .map((tenant) => (
                        <option key={tenant.id} value={tenant.id}>
                          {tenant.name} ({tenant.type === 'HQ' ? '본사' : '대리점'})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 추가 정보 섹션 */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 font-korean flex items-center gap-2 pb-2 border-b border-gray-200">
                추가 정보
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1 font-korean">구독 만료일 (지점 기준)</label>
                  {(() => {
                    const subscription = subscriptions.find(s => s.tenant_id === selectedUser.tenant_id);
                    if (!subscription || !subscription.subscription_end_date) {
                      return (
                        <div className="text-sm text-gray-500 py-2 font-korean">
                          구독 정보 없음
                        </div>
                      );
                    }
                    
                    const endDate = new Date(subscription.subscription_end_date);
                    const isExpired = endDate < new Date();
                    const daysLeft = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <div>
                        <div className="text-sm text-gray-900 py-2 font-korean">
                          {endDate.toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        {isExpired ? (
                          <p className="text-xs text-red-600 mt-1 font-korean">구독이 만료되었습니다</p>
                        ) : daysLeft <= 7 ? (
                          <p className="text-xs text-orange-600 mt-1 font-korean">{daysLeft}일 남음</p>
                        ) : null}
                      </div>
                    );
                  })()}
                </div>
                
                <div>
                  <label className="block text-xs text-gray-500 mb-1 font-korean">최근 수정일</label>
                  <div className="text-sm text-gray-900 py-2">
                    {new Date(selectedUser.updated_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 모달 푸터 */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 py-3 flex items-center justify-end gap-2 rounded-b-xl">
            {hasChanges ? (
              <>
                <button
                  onClick={handleCloseModal}
                  disabled={updating === selectedUser.id}
                  className="px-4 py-2 bg-white text-gray-700 rounded-md text-sm font-medium hover:bg-gray-100 transition-all font-korean border border-gray-200 disabled:opacity-50"
                >
                  취소
                </button>
                
                <button
                  onClick={handleSaveUserChanges}
                  disabled={updating === selectedUser.id}
                  className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 transition-all font-korean disabled:opacity-50"
                >
                  {updating === selectedUser.id ? '처리 중...' : '변경사항 저장'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={async () => {
                    await toggleUserStatus(selectedUser.id, selectedUser.is_active);
                    handleCloseModal();
                  }}
                  disabled={updating === selectedUser.id}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all font-korean ${
                    selectedUser.is_active
                      ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                      : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
                  } disabled:opacity-50`}
                >
                  {updating === selectedUser.id ? '처리 중...' : (selectedUser.is_active ? '비활성화' : '활성화')}
                </button>
                
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-white text-gray-700 rounded-md text-sm font-medium hover:bg-gray-100 transition-all font-korean border border-gray-200"
                >
                  닫기
                </button>
              </>
            )}
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
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 font-korean">
                  사용자 관리
                </h1>
                <p className="text-sm text-gray-600 font-korean mt-1">
                  사용자 승인 및 권한을 관리할 수 있습니다
                </p>
              </div>
            </div>
          </div>

          {/* 관리자 권한 체크 */}
          <AdminGuard 
            fallback={
              <div className="bg-white border border-gray-200 rounded-md p-6 text-center">
                <div className="flex justify-center mb-4">
                  <Users className="w-12 h-12 text-gray-400" />
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
            {/* 역할별 사용자 목록 모달 */}
            {renderRoleUsersModal()}
            
            {/* 사용자 상세 모달 */}
            {renderUserDetailModal()}

            <div className="space-y-6">
              {/* 사용자 통계 카드 */}
              <div className="bg-white border border-gray-200 rounded-md shadow-sm">
                <div className="px-3 py-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-primary/10 rounded-md">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 font-korean">
                      사용자 현황
                    </h3>
                  </div>
                  <UserRoleStats
                    key={statsKey}
                    onRoleClick={handleRoleClick}
                  />
                </div>
              </div>
              
              {/* 승인 대기 중인 사용자 카드 */}
              <div className="bg-white rounded-md border border-gray-200 shadow-sm">
                <div className="px-3 py-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-primary/10 rounded-md">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 font-korean">
                      승인 대기 중 ({pendingUsers.length}명)
                    </h3>
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
                          <Users className="w-6 h-6 text-primary animate-pulse" />
                        </div>
                      </div>
                    </div>
                  ) : pendingUsers.length > 0 ? (
                    <div className="space-y-3">
                      {pendingUsers.map((user) => (
                        <div 
                          key={user.id} 
                          className="p-4 bg-red-50 border border-red-200 rounded-md"
                        >
                          <div className="mb-3">
                            <span className="font-semibold text-gray-900 font-korean">
                              {user.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <label className="block text-xs text-gray-600 mb-1 font-korean">권한</label>
                              <select
                                value={user.role}
                                onChange={(e) => updateUserRole(user.id, e.target.value as UserRole)}
                                disabled={updating === user.id}
                                className="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:bg-gray-50 font-korean"
                              >
                                {Object.values(UserRole).map((role) => (
                                  <option key={role} value={role}>
                                    {getRoleDisplayName(role)}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex-1">
                              <label className="block text-xs text-gray-600 mb-1 font-korean">소속</label>
                              <select
                                value={user.tenant_id}
                                onChange={(e) => updateUserRoleAndTenant(user.id, user.role, e.target.value)}
                                disabled={updating === user.id}
                                className="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:bg-gray-50 font-korean"
                              >
                                {tenants.map((tenant) => (
                                  <option key={tenant.id} value={tenant.id}>
                                    {tenant.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex-shrink-0 self-end">
                              <button
                                onClick={() => approveUser(user.id)}
                                disabled={
                                  updating === user.id || 
                                  !user.tenant_id || 
                                  user.tenant_id === UNASSIGNED_TENANT.ID ||
                                  user.role === UserRole.UNASSIGNED
                                }
                                className={`px-6 py-1.5 rounded-md text-sm font-medium transition-colors font-korean ${
                                  user.tenant_id && 
                                  user.tenant_id !== UNASSIGNED_TENANT.ID &&
                                  user.role !== UserRole.UNASSIGNED
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                } disabled:opacity-50`}
                              >
                                {updating === user.id ? '처리 중...' : '승인'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
                      <div className="text-gray-500 font-korean">
                        승인 대기 중인 사용자가 없습니다
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 사용자 권한 관리 카드 */}
              <div className="bg-white rounded-md border border-gray-200 shadow-sm">
                <div className="px-3 py-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-primary/10 rounded-md">
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 font-korean">
                      사용자 권한 관리
                    </h3>
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
                          <Users className="w-6 h-6 text-primary animate-pulse" />
                        </div>
                      </div>
                    </div>
                  ) : users.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {users.map((user) => (
                        <div 
                          key={user.id} 
                          onClick={() => {
                            setSelectedUser(user);
                            setOriginalUser(user);
                            setHasChanges(false);
                          }}
                          className="bg-white rounded-md border border-gray-200 p-4 cursor-pointer hover:border-primary hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold text-gray-900 font-korean">
                              {user.name}
                            </div>
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded ${
                                user.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {user.is_active ? '활성' : '비활성'}
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-600 font-korean mb-1">
                            <span className="text-gray-500">권한:</span> {getRoleDisplayName(user.role)}
                          </div>
                          
                          <div className="text-sm text-gray-600 font-korean">
                            <span className="text-gray-500">소속:</span> {user.tenant?.name || '미지정'}
                            {user.tenant?.type && (
                              <span className="ml-1 text-xs text-gray-400">
                                ({user.tenant.type === 'HQ' ? '본사' : '대리점'})
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-md">
                      <div className="text-gray-500 font-korean">
                        등록된 사용자가 없습니다.
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

