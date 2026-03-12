/**
 * 권한 관리 시스템
 * 
 * 사용자 역할과 권한을 관리하는 시스템입니다.
 * 본사, 직영점, 대리점의 3단계 조직 구조를 지원합니다.
 */

import { User } from '@supabase/supabase-js';

/**
 * 사용자 역할 정의
 * 
 * 조직 구조:
 * - 본사 (HQ): 전체 시스템 관리, 모든 지점/대리점 관리
 * - 직영점 (OWNED_BRANCH): 본사가 직접 운영하는 지점
 * - 대리점 (DEALER): 독립적으로 운영되는 대리점
 */
export enum UserRole {
  /** 미배정 - 회원가입 후 본사에서 역할 배정 대기 중인 상태, 모든 권한 없음 */
  UNASSIGNED = 'UNASSIGNED',
  /** 본사 관리자 - 전체 시스템 관리, 모든 테넌트 데이터 접근, 사용자·조직·정책 관리 */
  HQ_ADMIN = 'HQ_ADMIN',
  /** 직영점 관리자 - 자기 지점의 모든 권한, 직원 관리 */
  OWNED_BRANCH_ADMIN = 'OWNED_BRANCH_ADMIN',
  /** 직영점 직원 - 자기 지점 데이터 읽기/쓰기, 견적서 생성 */
  OWNED_BRANCH_STAFF = 'OWNED_BRANCH_STAFF',
  /** 대리점 관리자 - 자기 대리점의 모든 권한, 직원 관리 */
  DEALER_ADMIN = 'DEALER_ADMIN',
  /** 대리점 직원 - 자기 대리점 데이터 읽기/쓰기, 견적서 생성 */
  DEALER_STAFF = 'DEALER_STAFF',
}

/**
 * 권한 액션 타입
 */
export enum PermissionAction {
  /** 읽기 권한 */
  READ = 'READ',
  /** 쓰기 권한 */
  WRITE = 'WRITE',
  /** 삭제 권한 */
  DELETE = 'DELETE',
  /** 관리 권한 (사용자/조직 관리) */
  MANAGE = 'MANAGE',
  /** 정책 변경 권한 */
  POLICY = 'POLICY',
}

/**
 * 리소스 타입
 */
export enum ResourceType {
  /** 견적서 */
  QUOTATION = 'QUOTATION',
  /** 고객 정보 */
  CUSTOMER = 'CUSTOMER',
  /** 제품 정보 */
  PRODUCT = 'PRODUCT',
  /** 사용자 관리 */
  USER = 'USER',
  /** 조직 관리 */
  ORGANIZATION = 'ORGANIZATION',
  /** 요금/정책 */
  POLICY = 'POLICY',
  /** 대시보드/집계 데이터 */
  ANALYTICS = 'ANALYTICS',
}

/**
 * 테넌트 타입
 */
export type TenantType = 'HQ' | 'OWNED_BRANCH' | 'DEALER' | 'UNASSIGNED';

/**
 * 테넌트 정보
 */
export interface Tenant {
  id: string;
  name: string;
  type: TenantType;
  parent_tenant_id?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 사용자 프로필 (확장된 사용자 정보)
 * 
 * users 테이블 스키마:
 * - id: auth.users(id)를 직접 참조 (PRIMARY KEY)
 * - user_id는 호환성을 위해 id와 동일한 값으로 처리
 */
export interface UserProfile {
  id: string;
  user_id: string; // 호환성을 위해 유지, 실제로는 id와 동일
  role: UserRole;
  tenant_id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  position?: string;
  is_active: boolean;
  subscription_end_date?: string; // DEPRECATED: subscriptions 테이블 사용
  created_at: string;
  updated_at: string;
  tenant?: Tenant;
  tenant_subscription_end_date?: string; // subscriptions 테이블에서 가져온 구독 만료일
}

/**
 * 권한 규칙 정의
 * 각 역할별로 허용되는 액션과 리소스를 정의합니다.
 */
const PERMISSION_RULES: Record<UserRole, Record<ResourceType, PermissionAction[]>> = {
  [UserRole.UNASSIGNED]: {
    // 미배정 사용자는 모든 권한 없음 (본사에서 역할 배정 대기 중)
    [ResourceType.QUOTATION]: [],
    [ResourceType.CUSTOMER]: [],
    [ResourceType.PRODUCT]: [],
    [ResourceType.USER]: [],
    [ResourceType.ORGANIZATION]: [],
    [ResourceType.POLICY]: [],
    [ResourceType.ANALYTICS]: [],
  },
  [UserRole.HQ_ADMIN]: {
    // 본사 관리자 - 모든 권한
    [ResourceType.QUOTATION]: [PermissionAction.READ, PermissionAction.WRITE, PermissionAction.DELETE],
    [ResourceType.CUSTOMER]: [PermissionAction.READ, PermissionAction.WRITE, PermissionAction.DELETE],
    [ResourceType.PRODUCT]: [PermissionAction.READ, PermissionAction.WRITE, PermissionAction.DELETE],
    [ResourceType.USER]: [PermissionAction.READ, PermissionAction.WRITE, PermissionAction.DELETE, PermissionAction.MANAGE],
    [ResourceType.ORGANIZATION]: [PermissionAction.READ, PermissionAction.WRITE, PermissionAction.DELETE, PermissionAction.MANAGE],
    [ResourceType.POLICY]: [PermissionAction.READ, PermissionAction.WRITE, PermissionAction.DELETE, PermissionAction.POLICY],
    [ResourceType.ANALYTICS]: [PermissionAction.READ],
  },
  [UserRole.OWNED_BRANCH_ADMIN]: {
    // 직영점 관리자 - 자기 지점 전체 권한, 직원 관리 가능
    [ResourceType.QUOTATION]: [PermissionAction.READ, PermissionAction.WRITE, PermissionAction.DELETE],
    [ResourceType.CUSTOMER]: [PermissionAction.READ, PermissionAction.WRITE, PermissionAction.DELETE],
    [ResourceType.PRODUCT]: [PermissionAction.READ, PermissionAction.WRITE],
    [ResourceType.USER]: [PermissionAction.READ, PermissionAction.WRITE, PermissionAction.DELETE, PermissionAction.MANAGE],
    [ResourceType.ORGANIZATION]: [PermissionAction.READ],
    [ResourceType.POLICY]: [PermissionAction.READ],
    [ResourceType.ANALYTICS]: [PermissionAction.READ],
  },
  [UserRole.OWNED_BRANCH_STAFF]: {
    // 직영점 직원 - 자기 지점 데이터 읽기/쓰기
    [ResourceType.QUOTATION]: [PermissionAction.READ, PermissionAction.WRITE],
    [ResourceType.CUSTOMER]: [PermissionAction.READ, PermissionAction.WRITE],
    [ResourceType.PRODUCT]: [PermissionAction.READ],
    [ResourceType.USER]: [PermissionAction.READ],
    [ResourceType.ORGANIZATION]: [PermissionAction.READ],
    [ResourceType.POLICY]: [PermissionAction.READ],
    [ResourceType.ANALYTICS]: [PermissionAction.READ],
  },
  [UserRole.DEALER_ADMIN]: {
    // 대리점 관리자 - 자기 대리점 전체 권한, 직원 관리 가능
    [ResourceType.QUOTATION]: [PermissionAction.READ, PermissionAction.WRITE, PermissionAction.DELETE],
    [ResourceType.CUSTOMER]: [PermissionAction.READ, PermissionAction.WRITE, PermissionAction.DELETE],
    [ResourceType.PRODUCT]: [PermissionAction.READ, PermissionAction.WRITE],
    [ResourceType.USER]: [PermissionAction.READ, PermissionAction.WRITE, PermissionAction.DELETE, PermissionAction.MANAGE],
    [ResourceType.ORGANIZATION]: [PermissionAction.READ],
    [ResourceType.POLICY]: [PermissionAction.READ],
    [ResourceType.ANALYTICS]: [PermissionAction.READ],
  },
  [UserRole.DEALER_STAFF]: {
    // 대리점 직원 - 자기 대리점 데이터 읽기/쓰기
    [ResourceType.QUOTATION]: [PermissionAction.READ, PermissionAction.WRITE],
    [ResourceType.CUSTOMER]: [PermissionAction.READ, PermissionAction.WRITE],
    [ResourceType.PRODUCT]: [PermissionAction.READ],
    [ResourceType.USER]: [PermissionAction.READ],
    [ResourceType.ORGANIZATION]: [PermissionAction.READ],
    [ResourceType.POLICY]: [PermissionAction.READ],
    [ResourceType.ANALYTICS]: [PermissionAction.READ],
  },
};

/**
 * 권한 확인 클래스
 */
export class PermissionChecker {
  private userProfile: UserProfile;

  constructor(userProfile: UserProfile) {
    this.userProfile = userProfile;
  }

  /**
   * 특정 리소스에 대한 액션 권한이 있는지 확인
   * 
   * @param resource - 확인할 리소스 타입
   * @param action - 확인할 액션 타입
   * @param targetTenantId - 대상 테넌트 ID (선택적)
   * @returns 권한이 있으면 true, 없으면 false
   */
  hasPermission(
    resource: ResourceType,
    action: PermissionAction,
    targetTenantId?: string
  ): boolean {
    // 사용자가 비활성 상태면 권한 없음
    if (!this.userProfile.is_active) {
      return false;
    }

    // 역할별 기본 권한 확인
    const rolePermissions = PERMISSION_RULES[this.userProfile.role];
    const resourcePermissions = rolePermissions[resource];
    
    if (!resourcePermissions || !resourcePermissions.includes(action)) {
      return false;
    }

    // 테넌트 기반 권한 확인
    return this.checkTenantPermission(targetTenantId);
  }

  /**
   * 테넌트 기반 권한 확인
   * 
   * @param targetTenantId - 대상 테넌트 ID
   * @returns 권한이 있으면 true, 없으면 false
   */
  private checkTenantPermission(targetTenantId?: string): boolean {
    // HQ_ADMIN은 모든 테넌트에 접근 가능
    if (this.userProfile.role === UserRole.HQ_ADMIN) {
      return true;
    }

    // targetTenantId가 없으면 자신의 테넌트에 대한 권한
    if (!targetTenantId) {
      return true;
    }

    // DEALER_OWNER와 DEALER_STAFF는 자신의 테넌트에만 접근 가능
    return this.userProfile.tenant_id === targetTenantId;
  }

  /**
   * 여러 권한을 한 번에 확인
   * 
   * @param permissions - 확인할 권한들의 배열
   * @returns 모든 권한이 있으면 true, 하나라도 없으면 false
   */
  hasAllPermissions(
    permissions: Array<{
      resource: ResourceType;
      action: PermissionAction;
      targetTenantId?: string;
    }>
  ): boolean {
    return permissions.every(({ resource, action, targetTenantId }) =>
      this.hasPermission(resource, action, targetTenantId)
    );
  }

  /**
   * 특정 리소스에 대한 모든 권한 조회
   * 
   * @param resource - 리소스 타입
   * @returns 해당 리소스에 대한 권한 배열
   */
  getResourcePermissions(resource: ResourceType): PermissionAction[] {
    if (!this.userProfile.is_active) {
      return [];
    }

    const rolePermissions = PERMISSION_RULES[this.userProfile.role];
    return rolePermissions[resource] || [];
  }

  /**
   * 사용자가 관리자 권한을 가지고 있는지 확인
   * 
   * @returns HQ_ADMIN이면 true, 아니면 false
   */
  isAdmin(): boolean {
    return this.userProfile.role === UserRole.HQ_ADMIN;
  }

  /**
   * 사용자가 직영점 관리자인지 확인
   * 
   * @returns OWNED_BRANCH_ADMIN이면 true, 아니면 false
   */
  isOwnedBranchAdmin(): boolean {
    return this.userProfile.role === UserRole.OWNED_BRANCH_ADMIN;
  }

  /**
   * 사용자가 직영점 직원인지 확인
   * 
   * @returns OWNED_BRANCH_STAFF면 true, 아니면 false
   */
  isOwnedBranchStaff(): boolean {
    return this.userProfile.role === UserRole.OWNED_BRANCH_STAFF;
  }

  /**
   * 사용자가 대리점 관리자인지 확인
   * 
   * @returns DEALER_ADMIN이면 true, 아니면 false
   */
  isDealerAdmin(): boolean {
    return this.userProfile.role === UserRole.DEALER_ADMIN;
  }

  /**
   * 사용자가 대리점 직원인지 확인
   * 
   * @returns DEALER_STAFF면 true, 아니면 false
   */
  isDealerStaff(): boolean {
    return this.userProfile.role === UserRole.DEALER_STAFF;
  }

  /**
   * 사용자가 관리자 역할인지 확인 (본사/직영점/대리점 관리자)
   * 
   * @returns 관리자 역할이면 true, 아니면 false
   */
  isAnyAdmin(): boolean {
    return this.isAdmin() || this.isOwnedBranchAdmin() || this.isDealerAdmin();
  }

  /**
   * 사용자 프로필 정보 조회
   * 
   * @returns 사용자 프로필
   */
  getUserProfile(): UserProfile {
    return this.userProfile;
  }

  /**
   * 구독이 만료되었는지 확인 (tenant 기반)
   * 
   * @returns 구독이 만료되었으면 true, 아니면 false
   */
  isSubscriptionExpired(): boolean {
    // 본사 관리자는 구독 제한 없음
    if (this.userProfile.role === UserRole.HQ_ADMIN) {
      return false;
    }

    // tenant_subscription_end_date (subscriptions 테이블)를 우선 확인
    const subscriptionDate = this.userProfile.tenant_subscription_end_date || this.userProfile.subscription_end_date;

    // 구독 갱신일이 설정되지 않은 경우 만료되지 않은 것으로 처리
    if (!subscriptionDate) {
      return false;
    }

    // 현재 날짜와 구독 갱신일 비교
    const now = new Date();
    const subscriptionEndDate = new Date(subscriptionDate);
    
    return now > subscriptionEndDate;
  }
}

/**
 * 권한 확인을 위한 유틸리티 함수들
 */

/**
 * 사용자 역할을 문자열로 변환
 * 
 * @param role - 사용자 역할
 * @param context - 컨텍스트 (통계 또는 드롭다운)
 * @returns 한국어 역할명
 */
export function getRoleDisplayName(role: UserRole, context?: 'stats' | 'dropdown'): string {
  const roleNames = {
    [UserRole.UNASSIGNED]: context === 'stats' ? '승인대기' : '미배정',
    [UserRole.HQ_ADMIN]: '본사 관리자',
    [UserRole.OWNED_BRANCH_ADMIN]: '직영점 관리자',
    [UserRole.OWNED_BRANCH_STAFF]: '직영점 직원',
    [UserRole.DEALER_ADMIN]: '대리점 관리자',
    [UserRole.DEALER_STAFF]: '대리점 직원',
  };
  
  return roleNames[role] || '알 수 없는 역할';
}

/**
 * 테넌트 타입을 문자열로 변환
 * 
 * @param type - 테넌트 타입
 * @returns 한국어 테넌트 타입명
 */
export function getTenantTypeDisplayName(type: TenantType): string {
  const typeNames = {
    HQ: '본사',
    OWNED_BRANCH: '직영점',
    DEALER: '대리점',
    UNASSIGNED: '미배정',
  };
  
  return typeNames[type] || '알 수 없는 타입';
}

/**
 * 권한 액션을 문자열로 변환
 * 
 * @param action - 권한 액션
 * @returns 한국어 액션명
 */
export function getActionDisplayName(action: PermissionAction): string {
  const actionNames = {
    [PermissionAction.READ]: '읽기',
    [PermissionAction.WRITE]: '쓰기',
    [PermissionAction.DELETE]: '삭제',
    [PermissionAction.MANAGE]: '관리',
    [PermissionAction.POLICY]: '정책 변경',
  };
  
  return actionNames[action] || '알 수 없는 액션';
}

/**
 * 리소스 타입을 문자열로 변환
 * 
 * @param resource - 리소스 타입
 * @returns 한국어 리소스명
 */
export function getResourceDisplayName(resource: ResourceType): string {
  const resourceNames = {
    [ResourceType.QUOTATION]: '견적서',
    [ResourceType.CUSTOMER]: '고객 정보',
    [ResourceType.PRODUCT]: '제품 정보',
    [ResourceType.USER]: '사용자',
    [ResourceType.ORGANIZATION]: '조직',
    [ResourceType.POLICY]: '정책',
    [ResourceType.ANALYTICS]: '분석 데이터',
  };
  
  return resourceNames[resource] || '알 수 없는 리소스';
}
