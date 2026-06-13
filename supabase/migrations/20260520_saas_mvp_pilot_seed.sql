-- ZAPGO 대리점 SaaS 파일럿 시드
-- 실제 파일럿 전에는 코드/이메일/로열티율을 운영 계약서 기준으로 바꿔 적용한다.
-- 사용자 계정은 Supabase Auth에서 생성한 뒤 public.users.agency_id를 아래 agency id로 연결한다.

insert into public.agencies (
  name,
  referral_code,
  code,
  owner_name,
  owner_email,
  owner_phone,
  region,
  royalty_rate,
  status
)
values
  ('강남 파일럿 대리점', 'gangnam', 'gangnam', '강남점장', 'gangnam@example.com', '010-0000-1001', '서울 강남/서초', 0.08, 'ACTIVE'),
  ('수원 파일럿 대리점', 'suwon', 'suwon', '수원점장', 'suwon@example.com', '010-0000-1002', '경기 수원/용인', 0.07, 'ACTIVE')
on conflict (referral_code) do update
set
  code = excluded.code,
  owner_name = excluded.owner_name,
  owner_email = excluded.owner_email,
  owner_phone = excluded.owner_phone,
  region = excluded.region,
  royalty_rate = excluded.royalty_rate,
  status = excluded.status,
  updated_at = now();

insert into public.referrers (
  agency_id,
  name,
  code,
  type,
  email,
  phone,
  status,
  incentive_type,
  incentive_amount,
  incentive_rate
)
select
  a.id,
  seed.name,
  seed.code,
  seed.type,
  seed.email,
  seed.phone,
  'ACTIVE',
  seed.incentive_type,
  seed.incentive_amount,
  seed.incentive_rate
from (
  values
    ('gangnam', '강남점 자체 링크', 'gangnam-self', 'DEALER_SELF', 'gangnam@example.com', '010-0000-1001', 'FIXED_PER_COMPLETION', 0, 0::numeric),
    ('gangnam', '강남 홍보대행 A', 'gn-marketer-a', 'MARKETING_AGENCY', 'marketer-a@example.com', '010-0000-2001', 'FIXED_PER_COMPLETION', 50000, 0::numeric),
    ('suwon', '수원점 자체 링크', 'suwon-self', 'DEALER_SELF', 'suwon@example.com', '010-0000-1002', 'FIXED_PER_COMPLETION', 0, 0::numeric),
    ('suwon', '수원 추천인 A', 'sw-ref-a', 'INDIVIDUAL', 'ref-a@example.com', '010-0000-2002', 'FIXED_PER_COMPLETION', 30000, 0::numeric)
) as seed(agency_code, name, code, type, email, phone, incentive_type, incentive_amount, incentive_rate)
join public.agencies a on a.code = seed.agency_code
on conflict (code) do update
set
  agency_id = excluded.agency_id,
  name = excluded.name,
  type = excluded.type,
  email = excluded.email,
  phone = excluded.phone,
  status = excluded.status,
  incentive_type = excluded.incentive_type,
  incentive_amount = excluded.incentive_amount,
  incentive_rate = excluded.incentive_rate,
  updated_at = now();
