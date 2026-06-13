# SaaS MVP 구현 로그

작성일: 2026-05-20

## 이번 구현 범위

### 1. 서버 공통 기반

- `src/lib/server/supabaseAdmin.ts`
  - 서버 전용 Supabase service-role 클라이언트 공통화
- `src/lib/server/apiAuth.ts`
  - Supabase access token 기반 API 사용자 확인
  - 본사 권한: `ADMIN`, `HQ_ADMIN`
  - 대리점 권한: `AGENCY`, `DEALER_ADMIN`, `DEALER_OWNER`, `DEALER_STAFF`
- `src/lib/server/dashboardMetrics.ts`
  - 고객 상태 표준화 기반 집계
  - 본사 대시보드 지표 생성
  - 대리점별 상태 뱃지 계산
  - 고객 개인정보 복호화/마스킹 헬퍼

### 2. 유입 귀속

- `/api/self-estimate-session`
  - `/q/{dealerCode}/{referralCode}` 입력값을 `agency_id`, `referrer_id`, `source_code`, `source_path`로 저장
  - `referrers` 테이블이 아직 없거나 새 컬럼이 없으면 기존 `agency_id`, `referral_code` 구조로 폴백
  - `referral_attributions`에 최초 유입 기록 시도
- `/api/self-estimate-consult`
  - 상담 신청 시 `CONSULT_PENDING` 상태로 전환
  - `customer_status_events`에 상태 변경 기록 시도
- `/api/self-estimate-followup`
  - 24시간 미상담 알림의 refCode를 실제 dealer/referral 코드로 전달

### 3. 실제 데이터 API

- `/api/hq/dashboard`
  - 본사 권한 필요
  - 전체 유입, 상담대기, 예약, 완료, 매출, 미응대 집계
  - 대리점별 성과/주의 필요/최근 고객 반환
- `/api/agency/dashboard`
  - 본사 또는 대리점 권한 필요
  - 대리점 자기 고객 집계와 최근 고객 반환
- `/api/referrer/dashboard`
  - 추천인 코드 기반 포털 데이터 반환
  - `REFERRER_PORTAL_PREVIEW_SECRET`가 설정되어 있으면 `secret` 파라미터 필요
- `/api/customers/[id]/workflow`
  - 본사/대리점 고객 처리 API
  - 상태, 주소, 상담 메모, 일정, 금액, 예약금, 입금 상태, 입금일, 시공팀 저장
  - 정산 상태는 본사만 변경 가능
  - 시공완료 시 추천인 인센티브 지급대상 생성 시도
- `/api/hq/settlements`
  - 본사 권한 필요
  - 월별 대리점 매출, 로열티, 추천인 인센티브, 순정산액 집계
  - 정산 상태(`DRAFT`, `CONFIRMED`, `PAID`) 저장

### 4. 실제 화면

- `/admin/operations`
  - 본사 SaaS 운영 화면
  - `/api/hq/dashboard` 실제 데이터 연결
  - 기존 `/admin/dashboard`는 견적 중심 화면으로 유지
- `/admin/settlements`
  - 월별 대리점 정산 관리 화면
  - 총 매출, 로열티, 인센티브, 지급 예정액 확인
  - 대리점별 정산 상태 변경
- `/agency/dashboard`
  - 기존 직접 Supabase 조회를 `/api/agency/dashboard` 기반으로 전환
- `/agency/customers`
  - 기존 직접 Supabase 조회를 `/api/agency/dashboard` 기반 고객 목록으로 전환
  - 상태 필터와 24시간 이상 미응대 필터 추가
- `/referrer/[code]`
  - 추천인 실제 데이터 포털
  - 고객 개인정보 마스킹 표시
- `/admin/customers/[id]`
  - 기존 직접 Supabase 업데이트를 `/api/customers/[id]/workflow` 저장 흐름으로 전환
  - 상태/주소/메모/일정/금액/입금/시공팀 저장 시 권한, 상태 이력, 인센티브 생성 로직을 통과

### 5. DB 운영 준비

- `supabase/migrations/20260520_saas_mvp_rls_policies.sql`
  - 본사 전체 관리, 대리점 자기 데이터 조회/수정 원칙의 RLS 정책 추가
  - `agencies`, `customers`, `referrers`, 상태 이력, 귀속, 인센티브, 정산 테이블 보호
- `supabase/migrations/20260520_saas_mvp_pilot_seed.sql`
  - 파일럿 대리점 2곳과 추천인/홍보대행 코드 샘플 추가
  - 실제 운영 전 계약 정보와 Supabase Auth 사용자 연결 필요

## 전문가 토의 반영 결정

1. 본사 API는 무조건 인증/권한 가드 적용
2. 대리점은 자기 `agency_id` 고객만 수정 가능
3. 추천인 포털은 고객명/연락처 마스킹
4. 기존 DB가 아직 마이그레이션되지 않은 환경을 고려해 폴백 처리
5. 기존 `/admin/dashboard`는 유지하고 새 SaaS 운영 화면을 `/admin/operations`로 분리
6. 정산은 세금계산서 자동연동보다 월별 확정/지급 상태 관리부터 시작
7. 대리점 모바일 화면은 미응대 고객 처리 속도를 우선시

## 남은 주요 작업

1. Supabase 마이그레이션 실제 적용 및 데이터 백필 검증
2. Supabase Auth 사용자 생성 후 `public.users.agency_id`, `role` 연결
3. RLS 정책을 실제 Supabase 프로젝트에서 SQL 실행 검증
4. 시공팀장 현장견적 화면을 고객/정산 워크플로우와 연결
5. 세금계산서 발행 상태와 외부 회계 서비스 연동 범위 확정
6. 파일럿 대리점 1~2곳에서 실제 상담/시공/정산 프로세스 리허설

## 검증

- `npm run build` 통과
