'use client';
// 이 파일은 더 이상 사용되지 않습니다. 하위 호환성을 위해 유지합니다.

type GuardProps = { children: React.ReactNode; fallback?: React.ReactNode; [key: string]: unknown };

export function PermissionGuard({ children }: GuardProps) {
  return <>{children}</>;
}

export function AdminGuard({ children }: GuardProps) {
  return <>{children}</>;
}

export function SubscriptionGuard({ children }: GuardProps) {
  return <>{children}</>;
}

export function usePermissions() {
  return {
    hasPermission: () => true,
    loading: false,
    userProfile: null as unknown,
    isAdmin: false,
    isAdminOrBranchAdmin: false,
  };
}

export default PermissionGuard;
