-- Raise Your Hand (card-specific questions and answers) + the notification inbox (bell).
-- Run once in Supabase → SQL Editor. Safe to run again.
-- Everything is read and written through /api/community with the server key, so students never see each other's
-- account IDs (posts are anonymous to other students). Row-level security is on with no student policies: no direct access.
create table if not exists public.rh_questions (
  id uuid primary key default gen_random_uuid(),
  card_key text not null check (char_length(card_key) <= 20),
  asker_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  status text not null default 'pending' check (status in ('pending', 'answered')),
  hidden boolean not null default false,
  ai_drafted_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists rh_questions_card on public.rh_questions (card_key, created_at desc);
create index if not exists rh_questions_pending on public.rh_questions (status, created_at) where status = 'pending';

create table if not exists public.rh_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.rh_questions(id) on delete cascade,
  author_id uuid references auth.users(id) on delete cascade,   -- null for Rosalind's drafts
  source text not null default 'student' check (source in ('student', 'team', 'rosalind')),
  body text not null check (char_length(body) between 1 and 2000),
  status text not null default 'live' check (status in ('live', 'draft')),   -- draft: Rosalind's answer waiting for the owner
  hidden boolean not null default false,
  helped boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists rh_answers_question on public.rh_answers (question_id, created_at);

create table if not exists public.rh_reports (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('question', 'answer')),
  target_id uuid not null,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text check (char_length(reason) <= 500),
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (kind, target_id, reporter_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('rh_question', 'rh_answer', 'site')),
  title text not null check (char_length(title) <= 140),
  body text check (char_length(body) <= 1000),
  link text check (char_length(link) <= 300),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user on public.notifications (user_id, created_at desc);

alter table public.rh_questions enable row level security;
alter table public.rh_answers enable row level security;
alter table public.rh_reports enable row level security;
alter table public.notifications enable row level security;
revoke all on public.rh_questions, public.rh_answers, public.rh_reports, public.notifications from anon, authenticated;
