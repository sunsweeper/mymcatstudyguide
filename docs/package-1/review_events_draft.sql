-- DRAFT ONLY — Package 1 design. Not run. Review before using (see STUDENT_EVENTS_DESIGN.md).
-- Safe to run when approved: creates new tables only; existing tables and data are untouched.

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null,
  started_at timestamptz,
  ended_at timestamptz,
  active_ms integer check (active_ms >= 0),
  cards_seen integer check (cards_seen >= 0),
  reinforcement_status text,
  source text not null default 'app' check (source in ('app', 'migrated_history')),
  created_at timestamptz not null default now()
);

create table if not exists public.review_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id text not null check (card_id ~ '^[0-9A-Z]{2,3}-[0-9]{3}$'),
  direction text not null check (direction in ('question_first', 'answer_first')),
  reviewed_at timestamptz not null,
  rating text not null check (rating in ('good', 'hard', 'again')),
  review_duration_ms integer check (review_duration_ms is null or review_duration_ms between 0 and 3600000),
  confidence smallint check (confidence is null or confidence between 1 and 5),
  mandatory_recall boolean,
  recall_written boolean,
  attempt_kind text check (attempt_kind in ('first', 'second_try', 'reinforcement', 'early_review')),
  schedule_before jsonb,
  schedule_after jsonb,
  next_review_on date,
  session_id uuid references public.study_sessions(id) on delete set null,
  practice_attempt_id uuid,
  content_version text not null default 'cards-v1',
  source text not null default 'app' check (source in ('app', 'migrated_history')),
  client_event_id uuid not null unique,
  created_at timestamptz not null default now()
);
create index if not exists review_events_user_card on public.review_events (user_id, card_id, reviewed_at);
create index if not exists review_events_user_time on public.review_events (user_id, reviewed_at);

alter table public.study_sessions enable row level security;
alter table public.review_events enable row level security;

-- Students read and add only their own rows. Events are append-only (no update/delete grants).
-- The owner dashboard does NOT get access: like progress, these are a student's results.
drop policy if exists "own sessions" on public.study_sessions;
create policy "own sessions" on public.study_sessions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "read own events" on public.review_events;
create policy "read own events" on public.review_events for select to authenticated using (user_id = auth.uid());
drop policy if exists "add own events" on public.review_events;
create policy "add own events" on public.review_events for insert to authenticated with check (user_id = auth.uid());
revoke all on public.study_sessions, public.review_events from anon, authenticated;
grant select, insert, update on public.study_sessions to authenticated;
grant select, insert on public.review_events to authenticated;
