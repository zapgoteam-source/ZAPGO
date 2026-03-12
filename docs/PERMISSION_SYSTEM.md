# ZAPGO 권한 시스템 가이드

ZAPGO의 권한 시스템은 **본사(HQ)**, **직영점(OWNED_BRANCH)**, **대리점(DEALER)** 3단계 조직 구조를 기반으로 한 멀티 테넌트 권한 관리 시스템입니다.

## 📋 목차

1. [권한 시스템 개요](#권한-시스템-개요)
2. [역할별 권한](#역할별-권한)
3. [데이터베이스 스키마](#데이터베이스-스키마)
4. [사용법](#사용법)
5. [컴포넌트 가이드](#컴포넌트-가이드)
6. [API 참조](#api-참조)

## 🔐 권한 시스템 개요

### 역할 정의

#### 조직 구조
- **HQ (본사)**: 전체 시스템 관리, 모든 지점/대리점 관리
- **OWNED_BRANCH (직영점)**: 본사가 직접 운영하는 지점
- **DEALER (대리점)**: 독립적으로 운영되는 대리점

#### 사용자 역할
- **UNASSIGNED (미배정)**: 회원가입 후 본사에서 역할 배정 대기 중인 상태, 모든 권한 없음
- **HQ_ADMIN (본사 관리자)**: 전체 시스템 관리, 모든 테넌트 데이터 접근, 사용자·조직·정책 관리
- **OWNED_BRANCH_ADMIN (직영점 관리자)**: 자기 지점의 모든 권한, 직원 관리
- **OWNED_BRANCH_STAFF (직영점 직원)**: 자기 지점 데이터 읽기/쓰기, 견적서 생성
- **DEALER_ADMIN (대리점 관리자)**: 자기 대리점의 모든 권한, 직원 관리
- **DEALER_STAFF (대리점 직원)**: 자기 대리점 데이터 읽기/쓰기, 견적서 생성

### 테넌트 격리

- 각 사용자는 하나의 테넌트에 소속
- 테넌트는 **HQ(본사)**, **OWNED_BRANCH(직영점)**, **DEALER(대리점)** 타입
- RLS(Row Level Security)를 통한 데이터 격리
- 본사 관리자만 모든 테넌트 데이터 접근 가능
- 직영점과 대리점은 자신의 테넌트 데이터만 접근 가능

## 👥 역할별 권한

### UNASSIGNED (미배정)
```typescript
// 모든 기능 접근 불가 (본사에서 역할 배정 대기 중)
- 견적서: 권한 없음
- 고객정보: 권한 없음
- 제품정보: 권한 없음
- 사용자관리: 권한 없음
- 조직관리: 권한 없음
- 정책변경: 권한 없음
- 분석데이터: 권한 없음

// 회원가입 후 자동으로 이 역할이 할당되며,
// 본사 관리자가 /admin/users 페이지에서 적절한 역할로 변경해야 합니다.
```

### HQ_ADMIN (본사 관리자)
```typescript
// 모든 리소스에 대한 전체 권한
- 견적서: 읽기/쓰기/삭제
- 고객정보: 읽기/쓰기/삭제  
- 제품정보: 읽기/쓰기/삭제
- 사용자관리: 읽기/쓰기/삭제/관리
- 조직관리: 읽기/쓰기/삭제/관리
- 정책변경: 읽기/쓰기/삭제/정책변경
- 분석데이터: 읽기
```

### OWNED_BRANCH_ADMIN (직영점 관리자)
```typescript
// 자신의 지점 내에서 전체 권한
- 견적서: 읽기/쓰기/삭제
- 고객정보: 읽기/쓰기/삭제
- 제품정보: 읽기/쓰기
- 사용자관리: 읽기/쓰기/삭제/관리 (자기 지점 직원만)
- 조직관리: 읽기
- 정책변경: 읽기
- 분석데이터: 읽기
```

### OWNED_BRANCH_STAFF (직영점 직원)
```typescript
// 자신의 지점 내에서 제한적 권한
- 견적서: 읽기/쓰기
- 고객정보: 읽기/쓰기
- 제품정보: 읽기
- 사용자관리: 읽기
- 조직관리: 읽기
- 정책변경: 읽기
- 분석데이터: 읽기
```

### DEALER_ADMIN (대리점 관리자)
```typescript
// 자신의 대리점 내에서 전체 권한
- 견적서: 읽기/쓰기/삭제
- 고객정보: 읽기/쓰기/삭제
- 제품정보: 읽기/쓰기
- 사용자관리: 읽기/쓰기/삭제/관리 (자기 대리점 직원만)
- 조직관리: 읽기
- 정책변경: 읽기
- 분석데이터: 읽기
```

### DEALER_STAFF (대리점 직원)
```typescript
// 자신의 대리점 내에서 제한적 권한
- 견적서: 읽기/쓰기
- 고객정보: 읽기/쓰기
- 제품정보: 읽기
- 사용자관리: 읽기
- 조직관리: 읽기
- 정책변경: 읽기
- 분석데이터: 읽기
```

## 🗄️ 데이터베이스 스키마

### 테넌트 테이블 (tenants)
```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type tenant_type NOT NULL DEFAULT 'DEALER',
    parent_tenant_id UUID REFERENCES tenants(id),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    business_number VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 사용자 프로필 테이블 (user_profiles)
```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    department VARCHAR(100),
    position VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🛠️ 사용법

### 1. 권한 확인

```tsx
import { useAuth } from '@/contexts/AuthContext';
import { ResourceType, PermissionAction } from '@/lib/permissions';

function MyComponent() {
  const { hasPermission, userProfile } = useAuth();
  
  // 견적서 삭제 권한 확인
  const canDeleteQuotation = hasPermission(
    ResourceType.QUOTATION, 
    PermissionAction.DELETE
  );
  
  // 특정 테넌트에 대한 권한 확인
  const canManageUser = hasPermission(
    ResourceType.USER,
    PermissionAction.MANAGE,
    'target-tenant-id'
  );
  
  return (
    <div>
      {canDeleteQuotation && (
        <button>견적서 삭제</button>
      )}
    </div>
  );
}
```

### 2. 권한 가드 컴포넌트

```tsx
import { PermissionGuard, AdminGuard } from '@/components/auth/PermissionGuard';
import { ResourceType, PermissionAction } from '@/lib/permissions';

function Dashboard() {
  return (
    <div>
      {/* 견적서 삭제 권한이 있는 사용자만 표시 */}
      <PermissionGuard 
        resource={ResourceType.QUOTATION} 
        action={PermissionAction.DELETE}
        fallback={<p>권한이 없습니다.</p>}
      >
        <button>견적서 삭제</button>
      </PermissionGuard>
      
      {/* 관리자 전용 컴포넌트 */}
      <AdminGuard fallback={<p>관리자 권한이 필요합니다.</p>}>
        <AdminPanel />
      </AdminGuard>
    </div>
  );
}
```

### 3. 권한 기반 훅 사용

```tsx
import { usePermissions } from '@/components/auth/PermissionGuard';

function UserInfo() {
  const { 
    userProfile, 
    isAdmin,
    isOwnedBranchAdmin,
    isOwnedBranchStaff,
    isDealerAdmin, 
    isDealerStaff,
    isAnyManager,
    currentTenantId 
  } = usePermissions();
  
  return (
    <div>
      <p>사용자: {userProfile?.name}</p>
      <p>역할: {
        isAdmin ? '본사 관리자' : 
        isOwnedBranchAdmin ? '직영점 관리자' : 
        isOwnedBranchStaff ? '직영점 직원' :
        isDealerAdmin ? '대리점 관리자' : 
        '대리점 직원'
      }</p>
      <p>소속: {userProfile?.tenant?.name}</p>
      <p>관리자 권한: {isAnyManager ? '있음' : '없음'}</p>
    </div>
  );
}
```

## 🧩 컴포넌트 가이드

### PermissionGuard
권한 기반 조건부 렌더링을 위한 컴포넌트

**Props:**
- `resource`: 리소스 타입 (ResourceType)
- `action`: 액션 타입 (PermissionAction)  
- `targetTenantId`: 대상 테넌트 ID (선택적)
- `roles`: 필요한 역할 배열 (선택적)
- `fallback`: 권한이 없을 때 표시할 컴포넌트
- `loadingComponent`: 로딩 중 표시할 컴포넌트

### AdminGuard
관리자 전용 컴포넌트 가드

**Props:**
- `fallback`: 권한이 없을 때 표시할 컴포넌트

### ManagerGuard
관리자 이상 권한 가드 (본사, 직영점, 대리점 관리자)

**Props:**
- `fallback`: 권한이 없을 때 표시할 컴포넌트

### DealerOwnerGuard (Deprecated)
대리점 관리자 이상 권한 가드 (하위 호환성 유지, `ManagerGuard` 사용 권장)

**Props:**
- `fallback`: 권한이 없을 때 표시할 컴포넌트

### UserRoleManager
사용자 역할 관리 컴포넌트 (관리자 전용)

**Props:**
- `tenantId`: 관리할 테넌트 ID (선택적)

## 📚 API 참조

### PermissionChecker 클래스

```typescript
class PermissionChecker {
  // 권한 확인
  hasPermission(resource: ResourceType, action: PermissionAction, targetTenantId?: string): boolean
  
  // 여러 권한 확인
  hasAllPermissions(permissions: PermissionCheck[]): boolean
  
  // 리소스별 권한 조회
  getResourcePermissions(resource: ResourceType): PermissionAction[]
  
  // 역할 확인 메서드
  isAdmin(): boolean
  isOwnedBranchAdmin(): boolean
  isOwnedBranchStaff(): boolean
  isDealerAdmin(): boolean
  isDealerStaff(): boolean
  isAnyAdmin(): boolean  // 모든 관리자 역할 확인 (본사/직영점/대리점)
}
```

### AuthContext 확장 API

```typescript
interface AuthContextType {
  // 기존 속성들...
  userProfile: UserProfile | null;
  permissionChecker: PermissionChecker | null;
  hasPermission: (resource: ResourceType, action: PermissionAction, targetTenantId?: string) => boolean;
  refreshUserProfile: () => Promise<void>;
}
```

### 유틸리티 함수

```typescript
// 역할명 한국어 변환
getRoleDisplayName(role: UserRole, context?: 'stats' | 'dropdown'): string

// 테넌트 타입명 한국어 변환
getTenantTypeDisplayName(type: TenantType): string

// 액션명 한국어 변환  
getActionDisplayName(action: PermissionAction): string

// 리소스명 한국어 변환
getResourceDisplayName(resource: ResourceType): string
```

## 🚀 설정 방법

### 1. 데이터베이스 마이그레이션 실행

```bash
# Supabase CLI를 사용하여 스키마 생성
supabase db push

# 또는 SQL 파일 직접 실행
psql -d your_database -f sql/001_create_tenants_and_profiles.sql
```

### 2. 환경 변수 설정

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. AuthProvider 래핑

```tsx
// app/layout.tsx
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

## 🔒 보안 고려사항

1. **RLS 정책**: 모든 테이블에 Row Level Security 적용
2. **JWT 토큰**: Supabase Auth를 통한 안전한 인증
3. **권한 검증**: 클라이언트와 서버 양쪽에서 권한 검증
4. **테넌트 격리**: 사용자는 자신의 테넌트 데이터만 접근 가능
5. **감사 로그**: 중요한 작업에 대한 로그 기록 권장

## 🐛 트러블슈팅

### 권한이 제대로 작동하지 않는 경우
1. 사용자 프로필이 올바르게 생성되었는지 확인
2. RLS 정책이 활성화되었는지 확인  
3. 테넌트 ID가 올바르게 설정되었는지 확인

### 회원가입 시 프로필이 생성되지 않는 경우
1. 테넌트 ID가 유효한지 확인
2. 데이터베이스 권한 설정 확인
3. Supabase 함수 로그 확인

---

이 권한 시스템을 통해 안전하고 확장 가능한 멀티 테넌트 애플리케이션을 구축할 수 있습니다. 추가 질문이나 개선사항이 있으면 언제든지 문의해주세요! 🚀
