# ZAPGO 대리점 SaaS MVP 설계: 1-6단계

작성일: 2026-05-20  
범위: 고객 상태값 정리부터 추천인 포털 MVP까지  
관련 목업:
- `/prototype/hq-dashboard`
- `/prototype/agency-dashboard`
- `/q/{dealerCode}/{referralCode}`

## 0. 설계 목적

현재 셀프견적 앱을 기반으로 다음 흐름을 SaaS화한다.

```text
고객 유입 링크
→ 고객/견적 생성
→ 대리점 귀속
→ 추천인 성과 귀속
→ 본사 모니터링
→ 대리점 고객 관리
→ 추천인 진행상태/인센티브 확인
```

이번 설계는 아래 6번까지를 구현 가능한 수준으로 정리한다.

1. 고객 상태값 표준화
2. DB 설계안 작성
3. 현재 DB와 비교한 마이그레이션 계획
4. 본사 대시보드 실제 쿼리 연결 설계
5. 대리점 대시보드 개선 설계
6. 추천인 포털 MVP 설계

---

## 1. 고객 상태값 표준화

### 전문가 토의

**B2B SaaS PM**  
상태값은 대시보드 숫자의 원천이므로 가장 먼저 고정해야 한다. 상태가 흔들리면 전환율, 미응대, 정산, 인센티브가 모두 흔들린다.

**소프트웨어 아키텍트**  
현재 코드에는 `NEW`, `CONSULTING`, `SCHEDULED`, `VISIT_REQUESTED`, `COMPLETED`, 한글 상태값이 섞여 있다. 한 번에 모두 변경하면 기존 화면이 깨질 수 있으므로, 표준 상태값을 정의하고 기존 값은 매핑한다.

**대리점 컨설턴트**  
대리점이 직접 상태를 바꿀 수 있어야 하지만, 정산과 인센티브에 영향을 주는 상태는 본사 확인 권한이 필요하다.

### 결정

DB에는 영문 표준 상태값을 사용하고, 화면에는 한국어 라벨을 보여준다.

| 표준 상태 | 화면 라벨 | 의미 | 변경 가능 주체 | 대시보드 집계 |
|---|---|---|---|---|
| `NEW` | 신규유입 | 링크/폼으로 고객이 생성됨 | 시스템, 본사 | 전체 유입 |
| `CONSULT_PENDING` | 상담대기 | 연락 또는 상담 시작 전 | 본사, 대리점 | 상담 대기, 미응대 |
| `CONSULTING` | 상담중 | 담당자가 연락/상담 중 | 본사, 대리점 | 상담 진행 |
| `QUOTE_SENT` | 견적제출 | 고객에게 견적 안내 완료 | 본사, 대리점 | 견적 전환 |
| `SCHEDULED` | 시공예약 | 시공일 확정 | 본사, 대리점 | 시공 예약 |
| `COMPLETED` | 시공완료 | 현장 시공 완료 | 본사, 대리점 | 시공 완료 |
| `SETTLEMENT_PENDING` | 정산대기 | 완료 후 정산 확인 필요 | 본사 | 정산 대기 |
| `SETTLED` | 정산완료 | 대리점/추천인 정산 완료 | 본사 | 정산 완료 |
| `AS_REQUESTED` | AS접수 | AS 요청 접수 | 본사, 대리점 | AS |
| `CLOSED` | 종료 | 더 이상 진행하지 않음 | 본사, 대리점 | 종료 |

### MVP 상태 흐름

초기 MVP에서는 아래 6개를 우선 사용한다.

```text
NEW → CONSULT_PENDING → CONSULTING → QUOTE_SENT → SCHEDULED → COMPLETED
```

정산/AS는 필드와 화면 설계만 먼저 잡고, 실제 운영은 2차에서 붙인다.

### 기존 상태 매핑

| 기존 값 | 표준 상태 |
|---|---|
| `NEW` | `NEW` |
| `상담대기` | `CONSULT_PENDING` |
| `CONSULTING` | `CONSULTING` |
| `견적확인` | `QUOTE_SENT` |
| `VISIT_REQUESTED` | `CONSULTING` |
| `VISIT_SCHEDULED` | `SCHEDULED` |
| `SCHEDULED` | `SCHEDULED` |
| `시공예약` | `SCHEDULED` |
| `COMPLETED` | `COMPLETED` |
| `시공완료` | `COMPLETED` |
| `상담종료` | `CLOSED` |

### 미응대 기준

초기에는 아래 기준을 사용한다.

```text
미응대 고객 =
status in ('NEW', 'CONSULT_PENDING')
and created_at 또는 last_contacted_at 기준 24시간 이상 경과
```

`last_contacted_at`이 없으면 `created_at` 기준으로 계산한다. 2차에서 상담 로그 테이블을 만들면 마지막 상담 로그 기준으로 바꾼다.

---

## 2. DB 설계안

### 전문가 토의

**소프트웨어 아키텍트**  
대리점과 추천인을 같은 `agencies` 테이블에 계속 넣으면 당장은 편하지만, 추천인이 여러 대리점에 걸쳐 활동하거나 대리점 소속이 아닌 홍보대행사가 생기면 구조가 꼬인다.

**그로스 마케터**  
추천인은 성과/인센티브를 봐야 하고, 대리점은 고객관리/시공 책임을 져야 한다. 둘은 권한과 책임이 다르다.

**회계/재무**  
정산은 고객 단위, 시공건 단위, 추천인 단위가 모두 필요하다. 인센티브와 로열티를 별도 테이블로 분리해야 추후 지급 이력이 남는다.

### 결정

대리점은 `agencies`, 추천인은 신규 `referrers`로 분리한다. 기존 `agencies.referral_code`는 `agencies.code`로 단계적 전환한다.

### 핵심 테이블

#### `agencies`

대리점/직영점 단위. 고객 관리와 시공 책임 주체.

```sql
agencies (
  id uuid primary key,
  name text not null,
  code text not null unique,
  owner_name text,
  owner_email text,
  owner_phone text,
  business_number text,
  region text,
  status text not null default 'ACTIVE',
  royalty_rate numeric not null default 0,
  contract_start_date date,
  contract_end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)
```

상태:

```text
ACTIVE
PAUSED
INACTIVE
```

#### `referrers`

추천인/홍보대행사/제휴 파트너 단위. 유입 성과와 인센티브 대상.

```sql
referrers (
  id uuid primary key,
  agency_id uuid references agencies(id),
  name text not null,
  code text not null unique,
  type text not null default 'INDIVIDUAL',
  email text,
  phone text,
  status text not null default 'ACTIVE',
  incentive_type text not null default 'FIXED_PER_COMPLETION',
  incentive_amount integer not null default 0,
  incentive_rate numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)
```

`agency_id`는 선택값이다. 대리점 소속 추천인은 연결하고, 본사 직영 마케팅 파트너는 null로 둔다.

추천인 타입:

```text
INDIVIDUAL
AGENCY_MARKETER
AD_VENDOR
DEALER_SELF
```

#### `customers`

고객 마스터. 대리점/추천인 귀속, 상태, 일정, 결제 요약을 담는다.

기존 필드에 아래를 추가한다.

```sql
customers add columns (
  standard_status text not null default 'NEW',
  agency_id uuid references agencies(id),
  referrer_id uuid references referrers(id),
  source_code text,
  source_path text,
  last_contacted_at timestamptz,
  assigned_user_id uuid references users(id),
  payment_status text not null default 'UNPAID',
  settlement_status text not null default 'NONE',
  incentive_status text not null default 'NONE',
  royalty_amount integer not null default 0,
  incentive_amount integer not null default 0,
  tax_invoice_status text not null default 'NOT_REQUIRED'
)
```

`status`는 당분간 호환용으로 유지하고, 신규 화면은 `standard_status`를 우선 사용한다. 안정화 후 `status`를 정리한다.

#### `customer_status_events`

상태 변경 이력. 운영 추적과 분쟁 대응을 위해 필요하다.

```sql
customer_status_events (
  id uuid primary key,
  customer_id uuid not null references customers(id),
  from_status text,
  to_status text not null,
  changed_by uuid references users(id),
  changed_by_role text,
  memo text,
  created_at timestamptz not null default now()
)
```

#### `referral_attributions`

유입 귀속 이력. 최초 추천인을 보존하고, 중간에 링크가 바뀌어도 추적 가능하게 한다.

```sql
referral_attributions (
  id uuid primary key,
  customer_id uuid not null references customers(id),
  agency_id uuid references agencies(id),
  referrer_id uuid references referrers(id),
  dealer_code text,
  referral_code text,
  source_path text,
  is_first_touch boolean not null default true,
  created_at timestamptz not null default now()
)
```

MVP는 최초 유입만 사용한다. 2차에서 last-touch를 추가할 수 있다.

#### `incentives`

추천인 인센티브 지급 관리.

```sql
incentives (
  id uuid primary key,
  customer_id uuid not null references customers(id),
  referrer_id uuid not null references referrers(id),
  agency_id uuid references agencies(id),
  basis_amount integer not null default 0,
  incentive_amount integer not null default 0,
  status text not null default 'IN_PROGRESS',
  approved_at timestamptz,
  paid_at timestamptz,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)
```

상태:

```text
IN_PROGRESS
PAYABLE
HOLD
PAID
CANCELED
```

#### `settlements`

대리점 로열티/정산 관리.

```sql
settlements (
  id uuid primary key,
  agency_id uuid not null references agencies(id),
  period_month date not null,
  gross_amount integer not null default 0,
  royalty_rate numeric not null default 0,
  royalty_amount integer not null default 0,
  labor_cost_amount integer not null default 0,
  incentive_amount integer not null default 0,
  status text not null default 'DRAFT',
  confirmed_at timestamptz,
  paid_at timestamptz,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)
```

상태:

```text
DRAFT
CONFIRMED
INVOICED
PAID
HOLD
```

### 권한 원칙

| 역할 | 볼 수 있는 데이터 | 변경 가능 데이터 |
|---|---|---|
| 본사 | 전체 | 전체, 정산/인센티브 승인 |
| 대리점 | 자기 `agency_id` 고객 | 고객 상태, 상담 메모, 일정 |
| 추천인 | 자기 `referrer_id` 유입 고객의 제한 정보 | 본인 정보, 지급계좌 정보 |
| 시공팀장 | 배정된 현장/견적 | 현장견적, 시공완료, 현장 메모 |

---

## 3. 현재 DB와 비교한 마이그레이션 계획

### 현재 상태 요약

현재 주요 구조:

```text
agencies
- id
- name
- referral_code
- status

customers
- status
- referral_code
- agency_id
- final_construction_amount
- deposit_amount
- scheduled_date

estimates
- status
- referral_code
- agency_id
```

현재 `/q/{dealerCode}/{referralCode}` 링크는 고객 생성 시 다음을 저장한다.

```text
customers.agency_id
customers.referral_code
customers.ref_code
```

### 전문가 토의

**아키텍트**  
한 번에 테이블을 갈아엎지 말고, 기존 필드를 유지하면서 확장 필드를 추가해야 한다. 운영 중인 셀프견적이 깨지면 안 된다.

**PM**  
첫 마이그레이션은 데이터 구조의 뼈대를 만드는 것이고, 화면 교체는 그 다음이다.

### 단계별 마이그레이션

#### 3-1. 하위 호환 컬럼 추가

```sql
alter table agencies
  add column if not exists code text,
  add column if not exists owner_name text,
  add column if not exists owner_email text,
  add column if not exists owner_phone text,
  add column if not exists region text,
  add column if not exists royalty_rate numeric not null default 0,
  add column if not exists contract_start_date date,
  add column if not exists contract_end_date date;

update agencies
set code = referral_code
where code is null;

create unique index if not exists idx_agencies_code_unique
  on agencies(code);
```

#### 3-2. 추천인 테이블 추가

```sql
create table if not exists referrers (...);
```

초기 데이터:

```text
각 agencies.code마다 DEALER_SELF referrer 1개 자동 생성
```

예:

```text
agency gangnam01
→ referrer gangnam01, type DEALER_SELF, agency_id = gangnam agency id
```

#### 3-3. customers 확장

```sql
alter table customers
  add column if not exists standard_status text not null default 'NEW',
  add column if not exists referrer_id uuid references referrers(id),
  add column if not exists source_code text,
  add column if not exists source_path text,
  add column if not exists last_contacted_at timestamptz,
  add column if not exists assigned_user_id uuid references users(id),
  add column if not exists payment_status text not null default 'UNPAID',
  add column if not exists settlement_status text not null default 'NONE',
  add column if not exists incentive_status text not null default 'NONE',
  add column if not exists royalty_amount integer not null default 0,
  add column if not exists incentive_amount integer not null default 0,
  add column if not exists tax_invoice_status text not null default 'NOT_REQUIRED';
```

#### 3-4. 기존 status 매핑 업데이트

```text
status → standard_status로 매핑
```

기존 화면이 깨지지 않도록 `status`는 유지한다. 신규 쿼리만 `standard_status`를 사용한다.

#### 3-5. 이력/정산 테이블 추가

```text
customer_status_events
referral_attributions
incentives
settlements
```

#### 3-6. API 변경

`/api/self-estimate-session`에서 링크 코드를 해석하는 순서:

```text
1. dealerCode로 agencies.code 조회
2. referralCode로 referrers.code 조회
3. referralCode가 없으면 dealerCode와 같은 DEALER_SELF referrer 사용
4. customers.agency_id, customers.referrer_id, source_code, source_path 저장
5. referral_attributions에 최초 유입 기록
```

---

## 4. 본사 대시보드 실제 쿼리 연결 설계

### 전문가 토의

**프랜차이즈 컨설턴트**  
본사 대시보드는 차트보다 “어디를 관리해야 하는지”가 먼저다. 숫자를 누르면 대상 리스트가 바로 나와야 한다.

**PM**  
목업의 카드 클릭 상세 패널은 유지한다. 실제 데이터 연결 시 카드와 상세 리스트가 같은 필터 기준을 사용해야 한다.

### 대시보드 지표

기준 기간: 기본 이번 달. 추후 기간 필터 추가.

| 지표 | 쿼리 조건 |
|---|---|
| 전체 유입 | `customers.created_at between period` |
| 상담 대기 | `standard_status in ('NEW','CONSULT_PENDING')` |
| 시공 예약 | `standard_status = 'SCHEDULED'` |
| 시공 완료 | `standard_status in ('COMPLETED','SETTLEMENT_PENDING','SETTLED')` |
| 예상 매출 | `sum(final_construction_amount)` for scheduled/completed |
| 미응대 | `standard_status in ('NEW','CONSULT_PENDING') and last_contacted_at/coalesce(created_at) older than 24h` |

### 대리점 성과 테이블

대리점별 집계:

```sql
select
  agencies.id,
  agencies.name,
  agencies.code,
  count(customers.id) as leads,
  count(*) filter (where customers.standard_status in ('CONSULT_PENDING','CONSULTING','QUOTE_SENT','SCHEDULED','COMPLETED')) as consults,
  count(*) filter (where customers.standard_status = 'SCHEDULED') as scheduled,
  count(*) filter (where customers.standard_status in ('COMPLETED','SETTLEMENT_PENDING','SETTLED')) as completed,
  sum(customers.final_construction_amount) as revenue,
  count(*) filter (where customers.standard_status in ('NEW','CONSULT_PENDING') and coalesce(customers.last_contacted_at, customers.created_at) < now() - interval '24 hours') as pending
from agencies
left join customers on customers.agency_id = agencies.id
where agencies.status = 'ACTIVE'
group by agencies.id;
```

전환율:

```text
completed / leads
```

MVP 이후:

```text
consult_conversion = consults / leads
construction_conversion = completed / consults
```

### 상태 뱃지 계산

```text
비활성:
  last_lead_at is null or last_lead_at < now() - 14 days

주의:
  pending >= 5
  or leads >= 10 and consults / leads < 30%

정상:
  그 외
```

### 카드 클릭 상세

각 카드 클릭 시 같은 조건으로 고객 리스트를 조회한다.

```text
전체 유입 → customers by created_at
상담 대기 → NEW/CONSULT_PENDING
시공 예약 → SCHEDULED
시공 완료 → COMPLETED/SETTLEMENT_PENDING/SETTLED
예상 매출 → SCHEDULED 이상 + amount > 0
```

### 본사 대시보드 API 후보

```text
GET /api/hq/dashboard?from=2026-05-01&to=2026-05-31
GET /api/hq/dashboard/details?metric=consultPending&from=...&to=...
GET /api/hq/agencies/{agencyId}/summary?from=...&to=...
```

---

## 5. 대리점 대시보드 개선 설계

### 전문가 토의

**대리점 컨설턴트**  
대리점 화면은 본사 화면보다 단순해야 한다. 대리점이 필요한 것은 자기 링크, 자기 고객, 오늘 처리할 상담, 예약 일정이다.

**현장 소장**  
현장팀장 화면과 대리점 화면을 섞으면 안 된다. 대리점은 고객관리 중심, 현장팀장은 현장견적/시공완료 중심이어야 한다.

### 대리점 대시보드 MVP

대리점 첫 화면:

```text
상단
- 대리점명
- 공유 링크 /q/{agencyCode}/{agencyCode}
- 링크 복사

요약
- 전체 유입
- 상담 대기
- 시공 예약
- 시공 완료
- 이번 달 매출

오늘 처리할 고객
- 미응대 고객
- 상담 예정
- 시공 예정

고객 리스트
- 이름
- 연락처
- 상태
- 유입 코드
- 마지막 처리일
```

### 대리점에서 가능한 액션

| 액션 | 허용 |
|---|---|
| 자기 고객 조회 | 가능 |
| 자기 고객 상태 변경 | 가능 |
| 상담 메모 작성 | 가능 |
| 시공 일정 입력 | 가능 |
| 최종 시공금액 입력 | 가능 |
| 정산완료 처리 | 불가, 본사만 |
| 인센티브 지급 처리 | 불가, 본사만 |
| 다른 대리점 고객 조회 | 불가 |

### 고객 상세

대리점 고객 상세에 필요한 섹션:

```text
고객 기본정보
상태 변경
상담 메모
셀프견적 내용
시공 일정
결제 상태
현장팀 메모
```

### 권한/RLS

대리점 사용자:

```text
users.role in ('AGENCY', 'DEALER_ADMIN', 'DEALER_STAFF')
and users.agency_id = customers.agency_id
```

초기에는 앱 레이어 필터로 시작하되, 운영 전에는 RLS를 반드시 강화한다.

### 대리점 API 후보

```text
GET /api/agency/dashboard
GET /api/agency/customers?status=...
PATCH /api/agency/customers/{id}
POST /api/agency/customers/{id}/status-events
```

---

## 6. 추천인 포털 MVP 설계

### 전문가 토의

**그로스 마케터**  
추천인에게 너무 많은 개인정보를 보여주면 안 된다. 본인이 데려온 고객의 진행상태와 인센티브 상태만 알면 된다.

**회계/재무**  
추천인 인센티브는 자동 지급이 아니라 본사 승인 기반으로 시작한다. 지급 기준은 시공완료 이후 본사 확인이다.

**PM**  
추천인 포털은 “내가 보낸 고객이 어떻게 되고 있는지”를 보여주는 신뢰 장치다. 복잡한 CRM이 아니다.

### 추천인 포털 목적

추천인이 확인할 수 있는 것:

```text
내 링크
내 유입 고객 수
진행 중 고객 수
시공 완료 고객 수
지급대상 인센티브
지급완료 인센티브
고객별 진행상태
```

### 추천인 URL

고객 유입 링크:

```text
/q/{dealerCode}/{referralCode}
```

추천인 포털:

```text
/referrer/dashboard
```

또는 로그인 없이 비밀코드 기반 MVP:

```text
/referrer/{referralCode}?secret={secret}
```

보안상 권장안은 로그인 기반이다. MVP에서 빠르게 검증하려면 비밀코드 기반을 임시로 사용할 수 있다.

### 추천인 화면

```text
상단
- 추천인명
- 내 추천 링크
- 링크 복사

요약
- 유입 고객
- 진행 중
- 시공 완료
- 지급대상
- 지급완료

고객 리스트
- 마스킹된 고객명
- 진행상태
- 유입일
- 시공완료일
- 인센티브 상태
```

개인정보 노출 제한:

```text
고객명: 김*지
전화번호: 010-****-5678 또는 미표시
주소: 구/동 수준 또는 미표시
```

### 인센티브 상태

| 상태 | 의미 | 표시 대상 |
|---|---|---|
| `IN_PROGRESS` | 고객 진행 중 | 추천인, 본사 |
| `PAYABLE` | 시공완료 후 지급대상 | 추천인, 본사 |
| `HOLD` | 지급 보류 | 추천인, 본사 |
| `PAID` | 지급완료 | 추천인, 본사 |
| `CANCELED` | 취소/무효 | 본사 중심 |

### 지급 기준

MVP 기본:

```text
customer.standard_status in ('COMPLETED','SETTLEMENT_PENDING','SETTLED')
and customer.referrer_id is not null
```

본사 확인 후:

```text
incentives.status = 'PAYABLE'
```

실제 송금 후:

```text
incentives.status = 'PAID'
paid_at = now()
```

### 추천인 API 후보

```text
GET /api/referrer/me
GET /api/referrer/dashboard
GET /api/referrer/customers
GET /api/referrer/incentives
```

---

## 전문가 토의 종합 결론

### 합의된 방향

1. 고객 상태값을 먼저 표준화한다.
2. 대리점과 추천인은 반드시 분리한다.
3. 기존 필드는 유지하고 확장 필드를 추가한다.
4. 본사 대시보드는 숫자 → 상세 리스트 → 대리점 관리 패널 흐름으로 간다.
5. 대리점 대시보드는 자기 고객 처리에 집중한다.
6. 추천인 포털은 개인정보를 제한하고 진행상태/인센티브 중심으로 만든다.

### 보류된 결정

1. 추천인 로그인 방식
   - 권장: 로그인 기반
   - 빠른 MVP: 비밀코드 기반

2. 인센티브 금액 정책
   - 고정 금액
   - 매출 비율
   - 상품/지역별 차등

3. 정산 기준
   - 시공완료 기준
   - 입금완료 기준
   - 본사 승인 기준

MVP에서는 아래로 시작한다.

```text
추천인 로그인: 비밀코드 기반 임시 가능
인센티브: 시공완료 1건당 고정 금액
정산: 본사 승인 기준
```

---

## 구현 백로그

### P0: 설계 기반 정리

1. `standard_status` 타입과 라벨 상수 추가
2. 기존 `status` → `standard_status` 매핑 유틸 추가
3. `agencies.code` 컬럼 추가 및 기존 `referral_code` 복사
4. `referrers` 테이블 추가
5. 대리점 자체 추천인 초기 생성
6. `customers.referrer_id`, `source_code`, `source_path` 추가

### P1: 유입 귀속 안정화

1. `/q/{dealerCode}/{referralCode}`에서 agency/referrer 조회
2. 고객 생성 시 `agency_id`, `referrer_id`, `source_code`, `source_path` 저장
3. `referral_attributions` 최초 유입 기록
4. 잘못된 코드 처리 정책 추가
   - dealerCode 없음: 본사 직접 유입
   - referralCode 없음: 대리점 자체 추천인
   - 비활성 코드: 본사 직접 유입 또는 오류 표시

### P2: 본사 대시보드 실제 데이터 연결

1. `/api/hq/dashboard` 생성
2. 카드 지표 실제 집계
3. 카드 클릭 상세 리스트 실제 조회
4. 대리점 성과 테이블 실제 조회
5. 대리점 상세 패널 실제 조회

### P3: 대리점 대시보드 개선

1. 자기 고객 집계 카드
2. 자기 고객 리스트 필터
3. 상태 변경 UI
4. 상담 메모 저장
5. 시공일정 저장
6. 링크 복사 UI 정리

### P4: 추천인 포털 MVP

1. `referrer` 접근 방식 결정
2. 추천인 대시보드 목업
3. 내 추천 링크 표시
4. 내 유입 고객 리스트
5. 인센티브 상태 리스트
6. 개인정보 마스킹 적용

### P5: 운영 보안

1. RLS 정책 재설계
2. 본사/대리점/추천인 역할 분리
3. API 서버 권한 체크
4. 고객 개인정보 마스킹 규칙 적용

---

## 다음 개발 제안

가장 먼저 구현할 파일 단위 작업:

```text
1. src/lib/customerStatus.ts 추가
2. src/types/index.ts에 표준 상태/정산/인센티브 타입 추가
3. supabase/migrations/20260520_saas_mvp_foundation.sql 작성
4. /prototype/referrer-dashboard 목업 추가
```

그 다음 실제 데이터 연결 순서:

```text
본사 대시보드 → 대리점 대시보드 → 추천인 포털
```

이 순서가 좋은 이유는 본사가 전체 데이터를 검증해야 대리점과 추천인 화면의 숫자도 신뢰할 수 있기 때문이다.
