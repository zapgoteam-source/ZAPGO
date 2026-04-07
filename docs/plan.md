에너지잡고 셀프견적 앱 최종 확정본버전: MVP v1.2기준일: 2026-03-18
1. 서비스 개요에너지잡고 셀프견적 앱은 고객이 카카오싱크로 로그인한 뒤, 문제 진단 설문과 창문 이미지 선택을 통해 실시간 참고 견적을 확인하고, 시공 요청 또는 방문 견적 요청까지 할 수 있는 웹 기반 서비스다.
본 서비스는 단순 견적 계산기가 아니라 아래 목적을 함께 가진다.
* 가격문의 자동화
* 고객 교육
* 시공 이해도 상승
* 상담 효율 향상
* 본사/대리점 마케팅 효율 강화
* 고객관리 및 현장 운영 일원화
고객 안내 문구는 아래로 확정한다.
본 견적은 참고용 예상 금액이며, 지역, 현장상황, 창문상태에 따라 변동 가능성이 있습니다.
창틀 모헤어를 모르겠음으로 선택한 경우 추가 안내 문구는 아래와 같다.
실측 후 금액이 변동될 수 있습니다

2. MVP 목표
* 월 300건 견적 발행
* 전화/광고/카카오 문의를 셀프견적 링크로 전환
* 셀프견적 거부 고객도 방문견적으로 전환
* 관리자/시공자/대리점이 같은 데이터 흐름 안에서 운영 가능하게 만들기

3. 사용자 유형CUSTOMER
* 카카오싱크 로그인
* 설문 진행
* 셀프견적 진행
* 견적 저장
* 시공 요청 제출
* 방문 견적 요청
ADMIN
* 고객 등록 및 관리
* 셀프견적/방문견적 관리
* 상담 중 견적 수정
* 시공자 배정
* 입금/예약금 관리
* 수정 이력 확인
WORKER
* 배정 현장 조회
* 현장 견적 수정
* 장소 추가/삭제/수정
* 기타 금액 가감
* 고객 서명 수집
* 최종 확정
AGENCY
* 전용 코드 URL로 고객 유입
* 자기 유입 고객 조회
* 고객 관리 및 상담 연계

4. 기술 스택
* Next.js 14 App Router
* Tailwind CSS
* Zustand
* Supabase
* Kakao Sync
* YouTube Embed

5. 라우팅 구조고객
* /app/(customer)/login
* /app/(customer)/survey
* /app/(customer)/house-info
* /app/(customer)/windows
* /app/(customer)/estimate
* /app/(customer)/submit
관리자
* /app/admin/dashboard
* /app/admin/estimate/[id]
* /app/admin/customers
* /app/admin/customers/[id]
시공자
* /app/worker/list
* /app/worker/field/[id]
* /app/worker/sign/[id]
대리점
* /app/agency/dashboard
* /app/agency/customers
* /app/agency/estimate/[id]

6. 고객 여정
1. 카카오싱크 로그인
2. 문제 진단 설문
3. 추천 시공 표시
4. 시공 선택 화면에서 영상 팝업 확인
5. 평형 입력
6. 창문 추가
7. 창문 위치명 입력
8. 창문 유형 선택
9. 구조 이미지 선택
10. 단창/이중창 선택
11. 창틀 모헤어 상태 입력
12. 옵션별 실시간 견적 확인
13. 비용 부담 시 대안 견적 제시
14. 견적 저장
15. 시공 요청 제출 또는 방문 견적 요청
전 과정에서 상담원 연결과 방문 견적 요청 버튼은 상시 노출한다.

7. 설문 정의문항은 6개다.
* 냉난방비
* 외풍유입
* 먼지날림
* 벌레유입
* 소음유입
* 악취유입
응답값:
* 전혀 없음
* 약간 있음
* 심함
* 매우 심함
설문 결과는 자동 선택이 아니라 추천 표시만 한다.
추천 기준:
* 냉난방비, 외풍유입, 소음유입, 악취유입 높음: 패브릭씰러 탈거 4면 시공 추천
* 먼지날림 높음: 측면 시공 추천
* 벌레유입 있음: 방충솔루션 추천

8. 창문 입력 규칙8.1 위치명 입력위치명은 자유 입력이지만 아래 태그를 먼저 제공한다.
* 거실
* 방
* 베란다
* 주방
* 세탁실
* 화장실
태그 선택 후 문구 수정 가능.
예:
* 거실 큰창
* 안방 베란다쪽
* 주방 오른쪽창
8.2 창문 유형 코드
* full_win = 완창
* half_win = 반창
* small_win = 소형창
고객은 먼저 완창/반창/소형창 대표 이미지를 보고 선택한다.
8.3 구조 이미지 선택각 유형 선택 후 아래 6개 구조 중 하나를 선택한다.
* 2_1_1
* 2_1_2
* 2_2_1
* 3_1_1_1
* 3_1_2_1
* 4_1_1_1_1
의미:
* 2짝, 1:1
* 2짝, 1:2
* 2짝, 2:1
* 3짝, 1:1:1
* 3짝, 1:2:1
* 4짝, 1:1:1:1
8.4 단창/이중창고객은 각 창문마다 단창 또는 이중창을 선택한다.

9. 창문 크기 분류 규칙기본 분류:
* small_win = 소형
* half_win = 중형
* full_win = 구조와 평형에 따라 중형/대형/특대형
세부 규칙:
* 완창의 넓은 창만 평형 기준 적용
* 반창은 넓은 창이어도 항상 중형
* 소형창이 아닌 이상 좁은 창도 중형
평형 기준:
* 23평 미만: 완창의 넓은 창도 중형
* 23~37평: 완창의 넓은 창은 대형
* 38~60평: 완창의 넓은 창은 특대형
* 60평 이상: 작업인원 무조건 5명

10. 견적 계산 로직모든 금액은 부가세 별도.
10.1 인건비
* 기본: 300,000원 × 작업 인원
규칙:
* 전체가 측면 시공만인 경우: 1명
* 60평 이상: 5명
* 그 외 가장 큰 창 기준
* 최대 창이 중형: 2명
* 최대 창이 대형: 3명
* 최대 창이 특대형: 4명
10.2 패브릭씰러 단가탈거 4면:
* 소 20,000
* 중 30,000
* 대 40,000
* 특대 50,000
측면:
* 소 10,000
* 중 15,000
* 대 20,000
* 특대 25,000
창틀:
* 소 15,000
* 중 25,000
* 대 30,000
* 특대 40,000
10.3 일반 모헤어 단가탈거 4면:
* 소 10,000
* 중 15,000
* 대 20,000
* 특대 25,000
측면:
* 소 5,000
* 중 10,000
* 대 15,000
* 특대 20,000
창틀:
* 소 10,000
* 중 15,000
* 대 20,000
* 특대 25,000
10.4 자재/공법 규칙
* 한 현장에서는 패브릭씰러와 일반 모헤어를 섞지 않음
* 그러나 창별로 탈거 4면과 측면 시공은 혼합 가능
예:
* 거실창: 탈거 4면
* 방창: 측면 시공
* 가능
10.5 이중창 과금
* 안쪽 창과 바깥쪽 창 각각 과금
* 같은 구조면 한쪽 금액의 2배
* 창틀도 동일 원칙 적용

11. 창틀 시공 규칙입력값:
* UNKNOWN
* NONE
* LINE_1
* LINE_2
* LINE_3
* LINE_4
과금 규칙:
* NONE: 계산 제외
* UNKNOWN: 계산 제외 + 경고 띠 노출
* LINE_1, LINE_2: 일반 창틀 단가 적용
* LINE_3, LINE_4: 창틀 단가 2배 적용
경고 문구:실측 후 금액이 변동될 수 있습니다
경고 노출 위치:
* 견적 결과 화면 상단
* 상단 고정 금액 영역 바로 아래
* 노란색 경고 띠 형태

12. 방충망 및 방충솔루션 규칙12.1 방충망 대상 창 판단아래 조건 중 하나라도 만족하면 방충망 대상 창으로 본다.
* 장소명에 베란다, 세탁실, 화장실, 주방 포함
* 이중창
즉 OR 조건이다.
12.2 방충망 수량 자동 제안
* 2짝: 1개
* 3짝: 2개
* 4짝: 2개
자동 산정은 제안일 뿐이며, 고객이 직접 수정할 수 있다.
12.3 방충망 크기
* small_win → 소형
* half_win → 중형
* full_win → 대형
12.4 방충망 교체 단가
* 소형: 50,000
* 중형: 60,000
* 대형: 70,000
12.5 방충솔루션 단가
* 23,000원 × 방충망 수
크기와 무관하다.

13. 비용 부담 고객 대응기본 견적 제시 후, 고객이 부담을 느끼는 경우 대안을 함께 보여준다.
우선 제시:
* 패브릭씰러 측면 시공 총액
비교용 추가 제시 가능:
* 일반 모헤어 전체 시공 총액
기존 기본 견적은 저장해두고, 이후 상세 조정 가능하게 한다.

14. 방문 견적 기능셀프견적을 원하지 않는 고객도 처리할 수 있어야 한다.
방문 견적 요청 발생 경로:
* 셀프견적 도중 고객 요청
* 전화 문의를 관리자 직접 등록
* 대리점이 직접 등록
운영 흐름:
1. 고객 정보 등록
2. 방문견적 요청 생성
3. 담당자 배정
4. 현장 방문
5. 현장 견적 작성
6. 필요 시 서명 후 확정
상시 CTA:
* 상담원 연결
* 방문 견적 요청

15. 고객 관리 기능전화문의, 광고문의, 카카오문의, 셀프견적 고객을 통합 관리한다.
관리 항목:
* 등록일
* 상태
* 연락처
* 주소
* 해결하고 싶은 문제
* 기타 요청사항
* 상담메모
* 상담자
* 시공팀장
* 시공팀원
* 시공일정
* 최종시공금액
* 예약금 금액
* 예약금 수령일자
* 입금일자
* 입금자명
권장 상태 예시:
* 신규문의
* 상담중
* 셀프견적 진행중
* 방문견적 요청
* 시공예약
* 시공완료
* 보류
* 종결

16. 대리점 기능대리점은 자기 코드가 포함된 URL로 고객을 유입시킬 수 있다.
예:https://서비스도메인.com?ref=AGENCY001
정책:
* 유입 시 대리점 코드 저장
* 견적/고객 데이터와 연결
* 대리점은 자기 유입 고객 조회 가능
* 본사는 전체 데이터 조회 가능
목적:
* 대리점의 마케팅 동기 강화
* 유입 성과 추적
* 고객 귀속 관리

17. 관리자/시공자 수정 기능관리자와 시공자는 견적을 수정할 수 있다.
가능 항목:
* 옵션 변경
* 단가/수량 변경
* 장소 추가
* 장소 삭제
* 장소 상세 수정
* 기타 금액 가감
기타 금액 가감필수 기능이다.
허용:
* 추가금
* 할인금
예시:
* 출장비 추가
* 현장 상태 추가 비용
* 지인 할인
* 고객 요청 할인
규칙:
* 금액 입력 가능
* 사유 입력 필수
* 총액에 즉시 반영
* 이력 저장 필수

18. 서명 및 잠금현장 최종 확정은 고객 서명으로 완료한다.
정책:
* 시공자는 관리자 수정안을 보고 현장 협의 진행
* 필요 시 현장 수정
* 최종 견적 확인 후 고객 서명
* 서명 완료 시 COMPLETED
* 이후 수정 잠금

19. 상태 정의
* DRAFT
* REQUESTED
* ASSIGNED
* VISIT_REQUESTED
* VISIT_SCHEDULED
* COMPLETED

20. DB 스키마 확정안20.1 users
* id uuid pk
* role text
* kakao_id text unique
* name text
* phone text
* agency_id uuid null
* created_at timestamptz
* updated_at timestamptz
20.2 agencies
* id uuid pk
* name text
* referral_code text unique
* status text
* created_at timestamptz
* updated_at timestamptz
20.3 customers
* id uuid pk
* name text
* phone text
* address text null
* status text
* problem_summary text null
* extra_request text null
* consult_memo text null
* consultant_user_id uuid null
* team_leader_user_id uuid null
* team_member_names text null
* scheduled_date timestamptz null
* final_construction_amount integer default 0
* deposit_amount integer default 0
* deposit_received_date date null
* payment_received_date date null
* payer_name text null
* referral_code text null
* agency_id uuid null
* created_at timestamptz
* updated_at timestamptz
20.4 estimates
* id uuid pk
* customer_id uuid fk
* worker_id uuid fk null
* status text
* estimate_request_type text
* housing_area_pyeong numeric
* material_type text null
* self_estimated_amount integer default 0
* admin_adjusted_amount integer default 0
* final_confirmed_amount integer default 0
* customer_name text null
* customer_phone text null
* address text null
* preferred_date date null
* extra_request text null
* marketing_consent boolean default false
* customer_signature_url text null
* warning_unknown_frame boolean default false
* referral_code text null
* agency_id uuid null
* locked_at timestamptz null
* requested_at timestamptz null
* assigned_at timestamptz null
* completed_at timestamptz null
* created_at timestamptz
* updated_at timestamptz
20.5 estimate_surveys
* id uuid pk
* estimate_id uuid fk
* heating_cost_level smallint
* draft_level smallint
* dust_level smallint
* bug_level smallint
* noise_level smallint
* odor_level smallint
* created_at timestamptz
20.6 windows
* id uuid pk
* estimate_id uuid fk
* location_label text
* window_type_code text
* layout_code text
* is_double_window boolean
* frame_work_selected boolean default false
* frame_mohair_state text
* screen_target boolean default false
* screen_size_type text null
* auto_screen_count smallint default 0
* confirmed_screen_count smallint default 0
* created_at timestamptz
* updated_at timestamptz
20.7 window_panels
* id uuid pk
* window_id uuid fk
* panel_order smallint
* width_ratio smallint
* size_category text
* created_at timestamptz
20.8 estimate_window_services
* id uuid pk
* estimate_id uuid fk
* window_id uuid fk
* service_family text
* service_type text
* selected boolean default true
* quantity integer default 0
* unit_price integer default 0
* total_price integer default 0
* created_at timestamptz
* updated_at timestamptz
20.9 estimate_adjustments
* id uuid pk
* estimate_id uuid fk
* actor_user_id uuid fk
* adjustment_type text
* amount integer
* reason text not null
* created_at timestamptz
20.10 estimate_revisions
* id uuid pk
* estimate_id uuid fk
* actor_user_id uuid fk
* actor_role text
* revision_type text
* field_path text
* before_value jsonb null
* after_value jsonb null
* memo text null
* created_at timestamptz

21. 총액 계산식총액 = 인건비 + 메인 시공비 + 창틀 시공비 + 방충솔루션 + 방충망 교체 + 기타 금액 가감

22. Supabase SQL 초안
create table public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  referral_code text not null unique,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.users (
  id uuid primary key,
  role text not null default 'CUSTOMER',
  kakao_id text unique,
  name text,
  phone text,
  agency_id uuid references public.agencies(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  address text,
  status text not null default 'NEW',
  problem_summary text,
  extra_request text,
  consult_memo text,
  consultant_user_id uuid references public.users(id),
  team_leader_user_id uuid references public.users(id),
  team_member_names text,
  scheduled_date timestamptz,
  final_construction_amount integer not null default 0,
  deposit_amount integer not null default 0,
  deposit_received_date date,
  payment_received_date date,
  payer_name text,
  referral_code text,
  agency_id uuid references public.agencies(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.estimates (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id),
  worker_id uuid references public.users(id),
  status text not null default 'DRAFT',
  estimate_request_type text not null default 'SELF',
  housing_area_pyeong numeric not null,
  material_type text,
  self_estimated_amount integer not null default 0,
  admin_adjusted_amount integer not null default 0,
  final_confirmed_amount integer not null default 0,
  customer_name text,
  customer_phone text,
  address text,
  preferred_date date,
  extra_request text,
  marketing_consent boolean not null default false,
  customer_signature_url text,
  warning_unknown_frame boolean not null default false,
  referral_code text,
  agency_id uuid references public.agencies(id),
  locked_at timestamptz,
  requested_at timestamptz,
  assigned_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.estimate_surveys (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.estimates(id) on delete cascade,
  heating_cost_level smallint not null,
  draft_level smallint not null,
  dust_level smallint not null,
  bug_level smallint not null,
  noise_level smallint not null,
  odor_level smallint not null,
  created_at timestamptz not null default now()
);

create table public.windows (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.estimates(id) on delete cascade,
  location_label text not null,
  window_type_code text not null,
  layout_code text not null,
  is_double_window boolean not null default false,
  frame_work_selected boolean not null default false,
  frame_mohair_state text not null default 'NONE',
  screen_target boolean not null default false,
  screen_size_type text,
  auto_screen_count smallint not null default 0,
  confirmed_screen_count smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.window_panels (
  id uuid primary key default gen_random_uuid(),
  window_id uuid not null references public.windows(id) on delete cascade,
  panel_order smallint not null,
  width_ratio smallint not null,
  size_category text not null,
  created_at timestamptz not null default now()
);

create table public.estimate_window_services (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.estimates(id) on delete cascade,
  window_id uuid references public.windows(id) on delete cascade,
  service_family text not null,
  service_type text not null,
  selected boolean not null default true,
  quantity integer not null default 0,
  unit_price integer not null default 0,
  total_price integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.estimate_adjustments (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.estimates(id) on delete cascade,
  actor_user_id uuid not null references public.users(id),
  adjustment_type text not null,
  amount integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create table public.estimate_revisions (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.estimates(id) on delete cascade,
  actor_user_id uuid not null references public.users(id),
  actor_role text not null,
  revision_type text not null,
  field_path text not null,
  before_value jsonb,
  after_value jsonb,
  memo text,
  created_at timestamptz not null default now()
);

23. 작업 티켓 초안Epic 1. 고객 셀프견적
* 카카오싱크 로그인 연결
* 설문 화면 구현
* 평형 입력 화면 구현
* 창문 입력 UI 구현
* 구조 이미지 선택 UI 구현
* 실시간 계산 엔진 구현
* 견적 결과 화면 구현
* 상담원 연결/방문견적 CTA 구현
* 제출 화면 구현
Epic 2. 견적 계산 엔진
* 창문 구조 분해 로직
* 평형 기반 크기 판정 로직
* 인건비 계산 로직
* 방충망 자동 제안 로직
* 창틀 경고 플래그 처리
* 총액 계산 로직
* 대안 견적 계산 로직
Epic 3. 관리자 기능
* 대시보드 목록
* 고객 관리 목록/상세
* 견적 수정 화면
* 상태 변경/배정 기능
* 예약금/입금 정보 관리
Epic 4. 시공자 기능
* 배정 현장 목록
* 현장 수정 화면
* 장소 추가/삭제
* 기타 금액 가감
* 서명 패드 및 잠금
Epic 5. 대리점 기능
* 대리점 테이블/권한
* ref 코드 유입 추적
* 대리점 대시보드
* 자기 고객 조회
Epic 6. 이력/감사 로그
* revision 기록
* adjustment 기록
* 상태 변경 로그
* 최종 잠금 처리

24. 권장 개발 순서
1. 고객 셀프견적 플로우
2. 계산 엔진 서버화
3. 관리자 수정 기능
4. 시공자 현장 수정 + 서명
5. 고객 관리 기능
6. 대리점 기능
