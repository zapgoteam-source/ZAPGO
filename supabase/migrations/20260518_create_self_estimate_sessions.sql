create table if not exists public.self_estimate_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  customer_id uuid references public.customers(id),
  payload_encrypted text not null,
  expires_at timestamptz not null,
  last_accessed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_self_estimate_sessions_expires_at
  on public.self_estimate_sessions (expires_at);

alter table public.self_estimate_sessions enable row level security;

comment on table public.self_estimate_sessions is
  '공개 셀프견적 문자 링크 복원을 위한 단기 세션 저장소';
