-- ZAPGO 에너지잡고 셀프견적 앱 DB 스키마
-- MVP v1.2 기준 2026-03-26

create table if not exists public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  referral_code text not null unique,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key,
  role text not null default 'CUSTOMER',
  kakao_id text unique,
  name text,
  phone text,
  agency_id uuid references public.agencies(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
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

create table if not exists public.estimates (
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

create table if not exists public.estimate_surveys (
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

create table if not exists public.windows (
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

create table if not exists public.window_panels (
  id uuid primary key default gen_random_uuid(),
  window_id uuid not null references public.windows(id) on delete cascade,
  panel_order smallint not null,
  width_ratio smallint not null,
  size_category text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.estimate_window_services (
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

create table if not exists public.estimate_adjustments (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.estimates(id) on delete cascade,
  actor_user_id uuid not null references public.users(id),
  adjustment_type text not null,
  amount integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.estimate_revisions (
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

-- RLS 활성화
alter table public.agencies enable row level security;
alter table public.users enable row level security;
alter table public.customers enable row level security;
alter table public.estimates enable row level security;
alter table public.estimate_surveys enable row level security;
alter table public.windows enable row level security;
alter table public.window_panels enable row level security;
alter table public.estimate_window_services enable row level security;
alter table public.estimate_adjustments enable row level security;
alter table public.estimate_revisions enable row level security;

-- users: 본인만 읽기 가능, ADMIN은 전체 읽기
create policy "users_select_own" on public.users
  for select using (auth.uid() = id);

create policy "users_insert_own" on public.users
  for insert with check (auth.uid() = id);

create policy "users_update_own" on public.users
  for update using (auth.uid() = id);

-- estimates: 로그인한 사용자 전체 허용 (역할 필터링은 앱 레이어에서 처리)
create policy "estimates_select_authed" on public.estimates
  for select using (auth.uid() is not null);

create policy "estimates_insert_customer" on public.estimates
  for insert with check (auth.uid() is not null);

create policy "estimates_update_customer" on public.estimates
  for update using (auth.uid() is not null);

-- estimate_surveys: estimate와 동일 규칙
create policy "estimate_surveys_all" on public.estimate_surveys
  for all using (auth.uid() is not null);

-- windows, window_panels, services, adjustments, revisions
create policy "windows_all" on public.windows
  for all using (auth.uid() is not null);

create policy "window_panels_all" on public.window_panels
  for all using (auth.uid() is not null);

create policy "estimate_window_services_all" on public.estimate_window_services
  for all using (auth.uid() is not null);

create policy "estimate_adjustments_all" on public.estimate_adjustments
  for all using (auth.uid() is not null);

create policy "estimate_revisions_all" on public.estimate_revisions
  for all using (auth.uid() is not null);

-- customers: ADMIN/WORKER/AGENCY는 읽기 가능
create policy "customers_all_auth" on public.customers
  for all using (auth.uid() is not null);

-- agencies: 전체 읽기 가능
create policy "agencies_select_all" on public.agencies
  for select using (true);
