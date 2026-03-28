/**
 * ZAPGO 권한 헬퍼
 * 역할: ADMIN | WORKER | AGENCY | CUSTOMER
 */

import type { UserRole } from '@/types';

export function getRoleDisplayName(role: UserRole | string): string {
  const names: Record<string, string> = {
    ADMIN: '관리자',
    WORKER: '시공자',
    AGENCY: '대리점',
    CUSTOMER: '고객',
  };
  return names[role] ?? role;
}
