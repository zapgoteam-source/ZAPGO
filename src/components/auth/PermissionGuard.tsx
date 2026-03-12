/**
 * 권한 기반 컴포넌트 가드
 * 
 * 사용자의 권한에 따라 컴포넌트의 표시/숨김을 제어합니다.
 */

'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ResourceType, PermissionAction, UserRole } from '@/lib/permissions';

/**
 * 권한 가드 Props
 */
interface PermissionGuardProps {
  /** 자식 컴포넌트들 */
  children: React.ReactNode;
  /** 필요한 리소스 권한 */
  resource?: ResourceType;
  /** 필요한 액션 권한 */
  action?: PermissionAction;
  /** 대상 테넌트 ID */
  targetTenantId?: string;
  /** 필요한 역할 (배열로 여러 역할 지정 가능) */
  roles?: UserRole[];
  /** 권한이 없을 때 표시할 컴포넌트 */
  fallback?: React.ReactNode;
  /** 로딩 중일 때 표시할 컴포넌트 */
  loadingComponent?: React.ReactNode;
}

/**
 * 권한 가드 컴포넌트
 * 
 * 사용자의 권한을 확인하여 자식 컴포넌트를 조건부 렌더링합니다.
 * 
 * @example
 * ```tsx
 * // 견적서 삭제 권한이 있는 사용자만 버튼 표시
 * <PermissionGuard resource={ResourceType.QUOTATION} action={PermissionAction.DELETE}>
 *   <button>견적서 삭제</button>
 * </PermissionGuard>
 * 
 * // 본사 관리자만 접근 가능
 * <PermissionGuard roles={[UserRole.HQ_ADMIN]}>
 *   <AdminPanel />
 * </PermissionGuard>
 * ```
 */
export function PermissionGuard({
  children,
  resource,
  action,
  targetTenantId,
  roles,
  fallback = null,
  loadingComponent = null,
}: PermissionGuardProps) {
  const { userProfile, hasPermission, loading } = useAuth();

  // 로딩 중이면 로딩 컴포넌트 표시
  if (loading) {
    return <>{loadingComponent}</>;
  }

  // 사용자가 로그인하지 않았으면 fallback 표시
  if (!userProfile) {
    return <>{fallback}</>;
  }

  // 미배정 사용자는 모든 기능 접근 불가 (UNASSIGNED)
  if (userProfile.role === UserRole.UNASSIGNED) {
    return <>{fallback}</>;
  }

  // 비활성 사용자는 접근 불가 (is_active = false)
  if (!userProfile.is_active) {
    return <>{fallback}</>;
  }

  // 역할 기반 권한 확인
  if (roles && roles.length > 0) {
    const hasRequiredRole = roles.includes(userProfile.role);
    if (!hasRequiredRole) {
      return <>{fallback}</>;
    }
  }

  // 리소스/액션 기반 권한 확인
  if (resource && action) {
    const hasRequiredPermission = hasPermission(resource, action, targetTenantId);
    if (!hasRequiredPermission) {
      return <>{fallback}</>;
    }
  }

  // 권한이 있으면 자식 컴포넌트 렌더링
  return <>{children}</>;
}

/**
 * 관리자 전용 컴포넌트 가드
 */
interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AdminGuard({ children, fallback = null }: AdminGuardProps) {
  return (
    <PermissionGuard roles={[UserRole.HQ_ADMIN]} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

/**
 * 관리자 이상 권한 가드 (본사, 직영점 관리자, 대리점 관리자)
 */
export function ManagerGuard({ children, fallback = null }: AdminGuardProps) {
  return (
    <PermissionGuard 
      roles={[UserRole.HQ_ADMIN, UserRole.OWNED_BRANCH_ADMIN, UserRole.DEALER_ADMIN]} 
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  );
}

/**
 * 대리점 관리자 이상 권한 가드 (하위 호환성 유지)
 * @deprecated ManagerGuard를 사용하세요
 */
export function DealerOwnerGuard({ children, fallback = null }: AdminGuardProps) {
  return (
    <ManagerGuard fallback={fallback}>
      {children}
    </ManagerGuard>
  );
}

/**
 * 구독 만료 가드 컴포넌트
 * 구독이 만료된 사용자는 데이터 접근을 제한합니다
 */
interface SubscriptionGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function SubscriptionGuard({ children, fallback }: SubscriptionGuardProps) {
  const { userProfile, permissionChecker } = useAuth();

  // 로그인하지 않았으면 fallback 표시
  if (!userProfile) {
    return <>{fallback}</>;
  }

  // 구독 만료 확인
  const isExpired = permissionChecker?.isSubscriptionExpired();
  
  if (isExpired) {
    return (
      <>{fallback || (
        <div className="bg-white border border-red-200 rounded-md p-6 text-center">
          <div className="flex justify-center mb-4">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 font-korean mb-2">
            구독이 만료되었습니다
          </h3>
          <p className="text-sm text-gray-600 font-korean">
            구독 갱신이 필요합니다. 본사 관리자에게 문의해주세요.
          </p>
        </div>
      )}</>
    );
  }

  // 구독이 유효하면 자식 컴포넌트 렌더링
  return <>{children}</>;
}

/**
 * 권한 기반 훅
 */
export function usePermissions() {
  const { userProfile, permissionChecker, hasPermission, refreshUserProfile } = useAuth();

  return {
    /** 현재 사용자 프로필 */
    userProfile,
    /** 권한 확인 인스턴스 */
    permissionChecker,
    /** 권한 확인 함수 */
    hasPermission,
    /** 사용자 프로필 새로고침 함수 */
    refreshUserProfile,
    /** 미배정 사용자 여부 */
    isUnassigned: userProfile?.role === UserRole.UNASSIGNED,
    /** 본사 관리자 여부 */
    isAdmin: userProfile?.role === UserRole.HQ_ADMIN && userProfile?.is_active === true,
    /** 직영점 관리자 여부 */
    isOwnedBranchAdmin: userProfile?.role === UserRole.OWNED_BRANCH_ADMIN && userProfile?.is_active === true,
    /** 직영점 직원 여부 */
    isOwnedBranchStaff: userProfile?.role === UserRole.OWNED_BRANCH_STAFF && userProfile?.is_active === true,
    /** 대리점 관리자 여부 */
    isDealerAdmin: userProfile?.role === UserRole.DEALER_ADMIN && userProfile?.is_active === true,
    /** 대리점 직원 여부 */
    isDealerStaff: userProfile?.role === UserRole.DEALER_STAFF && userProfile?.is_active === true,
    /** 모든 관리자 역할 여부 (본사/직영점/대리점) */
    isAnyManager: (
      userProfile?.role === UserRole.HQ_ADMIN ||
      userProfile?.role === UserRole.OWNED_BRANCH_ADMIN ||
      userProfile?.role === UserRole.DEALER_ADMIN
    ) && userProfile?.is_active === true,
    /** 활성 사용자 여부 */
    isActive: userProfile?.is_active === true,
    /** 현재 테넌트 ID */
    currentTenantId: userProfile?.tenant_id,
    /** 구독 만료 여부 */
    isSubscriptionExpired: permissionChecker?.isSubscriptionExpired() ?? false,
    // 하위 호환성을 위한 별칭
    /** @deprecated isDealerAdmin을 사용하세요 */
    isDealerOwner: userProfile?.role === UserRole.DEALER_ADMIN && userProfile?.is_active === true,
  };
}
