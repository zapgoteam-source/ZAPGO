# ZAPGO

전기 에너지 자재 견적 관리 시스템

## 📋 프로젝트 소개

ZAPGO는 본사, 직영점, 대리점이 함께 사용하는 3단계 멀티 테넌트 견적 관리 시스템입니다.

### 주요 기능

- 🏢 **3단계 조직 구조**: 본사(HQ), 직영점(OWNED_BRANCH), 대리점(DEALER) 분리 관리
- 👥 **세분화된 권한 관리**: 본사/직영점/대리점별 관리자 및 직원 역할 지원
- 📝 **견적서 작성 및 관리**: 고객별 견적서 생성, 수정, 조회
- 🔐 **Row Level Security**: Supabase RLS로 데이터 보안 강화
- ⏰ **자동 로그아웃**: 30분 비활성 시 자동 로그아웃

## 🚀 빠른 시작

### 1. 설치

```bash
# 저장소 클론
git clone <repository-url>
cd ZAPGO

# 의존성 설치
npm install
```

### 2. 환경 설정

`.env.local` 파일 생성:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. 데이터베이스 설정

**가장 쉬운 방법:** 

1. [Supabase](https://supabase.com) 대시보드 열기
2. SQL Editor 열기
3. `sql/000_full_setup.sql` 파일 전체 내용 복사 & 실행
4. 완료! ✅

상세한 설정 방법은 [SETUP_GUIDE.md](./docs/SETUP_GUIDE.md)를 참고하세요.

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

### 5. 첫 관리자 생성

1. `/signup`에서 회원가입
2. Supabase SQL Editor에서 권한 부여:
   ```sql
   UPDATE users 
   SET role = 'HQ_ADMIN', is_active = true 
   WHERE email = 'your-username@zapgo.local';
   ```
3. 로그인!

## 📂 프로젝트 구조

```
ZAPGO/
├── src/
│   ├── app/              # Next.js 앱 라우터
│   │   ├── login/        # 로그인 페이지
│   │   ├── signup/       # 회원가입 페이지
│   │   ├── home/         # 홈 페이지
│   │   ├── admin/        # 관리자 페이지
│   │   └── ...
│   ├── components/       # React 컴포넌트
│   │   ├── auth/         # 인증 관련 컴포넌트
│   │   ├── layout/       # 레이아웃 컴포넌트
│   │   └── ui/           # UI 컴포넌트
│   ├── contexts/         # React Context
│   │   └── AuthContext.tsx
│   └── lib/              # 유틸리티 및 설정
│       ├── supabase.ts   # Supabase 클라이언트
│       ├── permissions.ts # 권한 시스템
│       └── constants.ts  # 상수
├── sql/                  # SQL 마이그레이션
│   ├── 000_full_setup.sql              # 전체 설정 (권장)
│   ├── 001_create_tenants_and_profiles.sql
│   └── 002_create_materials_and_quotations.sql
├── docs/                 # 문서
│   ├── SETUP_GUIDE.md    # 설정 가이드
│   └── PERMISSION_SYSTEM.md  # 권한 시스템 문서
└── public/               # 정적 파일
```

## 🔐 권한 시스템

### 역할 (Roles)

| 역할 | 권한 |
|------|------|
| **UNASSIGNED** (미배정) | 회원가입 후 역할 배정 대기, 모든 권한 없음 |
| **HQ_ADMIN** (본사 관리자) | 모든 테넌트 데이터 조회/관리, 사용자/조직 관리 |
| **DEALER_OWNER** (대리점주) | 자신의 테넌트 전체 권한, 팀원 관리 |
| **DEALER_STAFF** (대리점 직원) | 자신의 테넌트 데이터 읽기/쓰기, 견적서 작성 |

자세한 내용은 [PERMISSION_SYSTEM.md](./docs/PERMISSION_SYSTEM.md)를 참고하세요.

## 🛠 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: React Context API

## 📖 문서

- [설정 가이드](./docs/SETUP_GUIDE.md) - 데이터베이스 설정 및 설치 방법
- [권한 시스템](./docs/PERMISSION_SYSTEM.md) - 권한 관리 시스템 상세 설명
- [회원가입 문제 해결](./docs/SIGNUP_FIX.md) - 회원가입 관련 문제 해결 가이드

## ❓ 문제 해결

### 회원가입이 작동하지 않아요

**증상**: 회원가입 버튼 클릭 시 오류 발생 또는 프로필이 생성되지 않음

**해결 방법**:
1. `sql/000_full_setup.sql` 파일을 Supabase SQL Editor에서 실행했는지 확인
2. 트리거가 제대로 설정되었는지 확인:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
3. 상세한 해결 방법은 [회원가입 문제 해결 가이드](./docs/SIGNUP_FIX.md) 참고

### "type user_role already exists" 에러

`sql/000_full_setup.sql`을 사용하세요. 기존 타입을 자동으로 삭제 후 재생성합니다.

### 회원가입 후 로그인이 안 돼요

회원가입 시 기본적으로 `UNASSIGNED` 역할과 비활성 상태로 생성됩니다. 
본사 관리자가 `/admin/users` 페이지에서 역할을 설정하거나, SQL로 직접 활성화할 수 있습니다:

```sql
-- 관리자로 승격 및 활성화
UPDATE users 
SET is_active = true, role = 'HQ_ADMIN', tenant_id = 'e701d162-b504-4c78-9574-6c76f982caa2'
WHERE email = 'username@zapgo.local';
```

더 많은 문제 해결 방법은 [SETUP_GUIDE.md](./docs/SETUP_GUIDE.md#문제-해결)를 참고하세요.

## 📝 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 👥 기여

버그 리포트, 기능 제안, Pull Request를 환영합니다!

---

© 2025 ZAPGO. All rights reserved.

