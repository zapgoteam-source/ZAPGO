alter table public.self_estimate_sessions
  add column if not exists followup_due_at timestamptz,
  add column if not exists followup_sent_at timestamptz,
  add column if not exists consult_requested_at timestamptz;

update public.self_estimate_sessions
set followup_due_at = created_at + interval '24 hours'
where followup_due_at is null;

create index if not exists idx_self_estimate_sessions_followup_due
  on public.self_estimate_sessions (followup_due_at)
  where followup_sent_at is null and consult_requested_at is null;
