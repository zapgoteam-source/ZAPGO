-- ZAPGO 대리점 SaaS MVP 기반 확장
-- 목적:
-- 1. 대리점과 추천인을 분리한다.
-- 2. 고객 상태/정산/인센티브 필드를 표준화한다.
-- 3. 기존 agencies.referral_code, customers.status는 하위 호환을 위해 유지한다.

alter table public.agencies
  add column if not exists code text,
  add column if not exists owner_name text,
  add column if not exists owner_email text,
  add column if not exists owner_phone text,
  add column if not exists business_number text,
  add column if not exists region text,
  add column if not exists royalty_rate numeric not null default 0,
  add column if not exists contract_start_date date,
  add column if not exists contract_end_date date;

update public.agencies
set code = referral_code
where code is null and referral_code is not null;

create unique index if not exists idx_agencies_code_unique
  on public.agencies(code)
  where code is not null;

create table if not exists public.referrers (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid references public.agencies(id),
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
);

insert into public.referrers (agency_id, name, code, type, status)
select id, name, code, 'DEALER_SELF', status
from public.agencies
where code is not null
on conflict (code) do nothing;

alter table public.customers
  add column if not exists standard_status text not null default 'NEW',
  add column if not exists referrer_id uuid references public.referrers(id),
  add column if not exists source_code text,
  add column if not exists source_path text,
  add column if not exists last_contacted_at timestamptz,
  add column if not exists assigned_user_id uuid references public.users(id),
  add column if not exists payment_status text not null default 'UNPAID',
  add column if not exists settlement_status text not null default 'NONE',
  add column if not exists incentive_status text not null default 'NONE',
  add column if not exists royalty_amount integer not null default 0,
  add column if not exists incentive_amount integer not null default 0,
  add column if not exists tax_invoice_status text not null default 'NOT_REQUIRED';

update public.customers
set standard_status = case
  when status = 'NEW' then 'NEW'
  when status = '상담대기' then 'CONSULT_PENDING'
  when status = 'CONSULT_PENDING' then 'CONSULT_PENDING'
  when status = 'CONSULTING' then 'CONSULTING'
  when status = '견적확인' then 'QUOTE_SENT'
  when status = 'QUOTE_SENT' then 'QUOTE_SENT'
  when status = 'VISIT_REQUESTED' then 'CONSULTING'
  when status = 'VISIT_SCHEDULED' then 'SCHEDULED'
  when status = 'SCHEDULED' then 'SCHEDULED'
  when status = '시공예약' then 'SCHEDULED'
  when status = 'COMPLETED' then 'COMPLETED'
  when status = '시공완료' then 'COMPLETED'
  when status = 'SETTLEMENT_PENDING' then 'SETTLEMENT_PENDING'
  when status = 'SETTLED' then 'SETTLED'
  when status = 'AS_REQUESTED' then 'AS_REQUESTED'
  when status = '상담종료' then 'CLOSED'
  when status = 'CLOSED' then 'CLOSED'
  else 'NEW'
end;

update public.customers c
set referrer_id = r.id,
    source_code = coalesce(c.referral_code, c.ref_code)
from public.referrers r
where c.referrer_id is null
  and coalesce(c.referral_code, c.ref_code) = r.code;

create table if not exists public.customer_status_events (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references public.users(id),
  changed_by_role text,
  memo text,
  created_at timestamptz not null default now()
);

create table if not exists public.referral_attributions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  agency_id uuid references public.agencies(id),
  referrer_id uuid references public.referrers(id),
  dealer_code text,
  referral_code text,
  source_path text,
  is_first_touch boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.incentives (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  referrer_id uuid not null references public.referrers(id),
  agency_id uuid references public.agencies(id),
  basis_amount integer not null default 0,
  incentive_amount integer not null default 0,
  status text not null default 'IN_PROGRESS',
  approved_at timestamptz,
  paid_at timestamptz,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id),
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
  updated_at timestamptz not null default now(),
  unique (agency_id, period_month)
);

create index if not exists idx_customers_standard_status on public.customers(standard_status);
create index if not exists idx_customers_agency_status on public.customers(agency_id, standard_status);
create index if not exists idx_customers_referrer_id on public.customers(referrer_id);
create index if not exists idx_referrers_agency_id on public.referrers(agency_id);
create index if not exists idx_incentives_referrer_status on public.incentives(referrer_id, status);
create index if not exists idx_settlements_agency_period on public.settlements(agency_id, period_month);

alter table public.referrers enable row level security;
alter table public.customer_status_events enable row level security;
alter table public.referral_attributions enable row level security;
alter table public.incentives enable row level security;
alter table public.settlements enable row level security;

comment on table public.referrers is '추천인/홍보대행사/제휴 파트너 마스터';
comment on table public.referral_attributions is '고객 최초 유입 대리점/추천인 귀속 이력';
comment on table public.incentives is '추천인 인센티브 지급 관리';
comment on table public.settlements is '대리점 월 정산 및 로열티 관리';
