-- ZAPGO 대리점 SaaS MVP RLS 정책
-- 원칙:
-- 1. 본사(HQ_ADMIN/ADMIN)는 운영/정산 데이터를 전체 조회 및 관리한다.
-- 2. 대리점(DEALER_*/AGENCY)은 자기 agency_id에 연결된 데이터만 본다.
-- 3. 고객 셀프견적 접수는 서버 service role API를 통해 처리하므로 클라이언트 INSERT 정책을 열지 않는다.

create or replace function public.get_my_agency_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select agency_id from public.users where id = auth.uid();
$$;

create or replace function public.is_hq_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select role::text in ('HQ_ADMIN', 'ADMIN')
    from public.users
    where id = auth.uid()
  ), false);
$$;

create or replace function public.is_agency_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select role::text in ('AGENCY', 'DEALER_ADMIN', 'DEALER_OWNER', 'DEALER_STAFF', 'OWNED_BRANCH_ADMIN', 'OWNED_BRANCH_STAFF')
    from public.users
    where id = auth.uid()
      and agency_id is not null
  ), false);
$$;

alter table public.agencies enable row level security;
alter table public.customers enable row level security;
alter table public.referrers enable row level security;
alter table public.customer_status_events enable row level security;
alter table public.referral_attributions enable row level security;
alter table public.incentives enable row level security;
alter table public.settlements enable row level security;

drop policy if exists "saas_agencies_hq_all" on public.agencies;
drop policy if exists "saas_agencies_agency_select_own" on public.agencies;
create policy "saas_agencies_hq_all" on public.agencies
  for all using (public.is_hq_user())
  with check (public.is_hq_user());
create policy "saas_agencies_agency_select_own" on public.agencies
  for select using (public.is_agency_user() and id = public.get_my_agency_id());

drop policy if exists "saas_customers_hq_all" on public.customers;
drop policy if exists "saas_customers_agency_select_own" on public.customers;
drop policy if exists "saas_customers_agency_update_own" on public.customers;
create policy "saas_customers_hq_all" on public.customers
  for all using (public.is_hq_user())
  with check (public.is_hq_user());
create policy "saas_customers_agency_select_own" on public.customers
  for select using (public.is_agency_user() and agency_id = public.get_my_agency_id());
create policy "saas_customers_agency_update_own" on public.customers
  for update using (public.is_agency_user() and agency_id = public.get_my_agency_id())
  with check (public.is_agency_user() and agency_id = public.get_my_agency_id());

drop policy if exists "saas_referrers_hq_all" on public.referrers;
drop policy if exists "saas_referrers_agency_select_own" on public.referrers;
create policy "saas_referrers_hq_all" on public.referrers
  for all using (public.is_hq_user())
  with check (public.is_hq_user());
create policy "saas_referrers_agency_select_own" on public.referrers
  for select using (public.is_agency_user() and agency_id = public.get_my_agency_id());

drop policy if exists "saas_customer_status_events_hq_all" on public.customer_status_events;
drop policy if exists "saas_customer_status_events_agency_select_own" on public.customer_status_events;
create policy "saas_customer_status_events_hq_all" on public.customer_status_events
  for all using (public.is_hq_user())
  with check (public.is_hq_user());
create policy "saas_customer_status_events_agency_select_own" on public.customer_status_events
  for select using (
    public.is_agency_user()
    and exists (
      select 1
      from public.customers c
      where c.id = customer_status_events.customer_id
        and c.agency_id = public.get_my_agency_id()
    )
  );

drop policy if exists "saas_referral_attributions_hq_all" on public.referral_attributions;
drop policy if exists "saas_referral_attributions_agency_select_own" on public.referral_attributions;
create policy "saas_referral_attributions_hq_all" on public.referral_attributions
  for all using (public.is_hq_user())
  with check (public.is_hq_user());
create policy "saas_referral_attributions_agency_select_own" on public.referral_attributions
  for select using (public.is_agency_user() and agency_id = public.get_my_agency_id());

drop policy if exists "saas_incentives_hq_all" on public.incentives;
drop policy if exists "saas_incentives_agency_select_own" on public.incentives;
create policy "saas_incentives_hq_all" on public.incentives
  for all using (public.is_hq_user())
  with check (public.is_hq_user());
create policy "saas_incentives_agency_select_own" on public.incentives
  for select using (public.is_agency_user() and agency_id = public.get_my_agency_id());

drop policy if exists "saas_settlements_hq_all" on public.settlements;
drop policy if exists "saas_settlements_agency_select_own" on public.settlements;
create policy "saas_settlements_hq_all" on public.settlements
  for all using (public.is_hq_user())
  with check (public.is_hq_user());
create policy "saas_settlements_agency_select_own" on public.settlements
  for select using (public.is_agency_user() and agency_id = public.get_my_agency_id());
