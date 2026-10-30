-- Review events: one permanent row per rating (review-log.js). Run once in Supabase → SQL Editor. Safe to run again.
-- Append-only: a student can add rows and read their own; nobody can change or delete a row from the app.
-- Rows are deleted with the account. No written answers and no device identifiers are stored here.
create table if not exists public.review_events (
  id bigint generated always as identity primary key,
  event_id uuid not null unique,                       -- made in the browser, so a resend isn't counted twice
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  at timestamptz not null default now(),               -- when the server received it
  client_at timestamptz,                               -- when it happened in the browser
  kind text not null default 'review' check (kind in ('review', 'undo')),
  card_key text not null check (char_length(card_key) <= 40),   -- "1A-005", reverse "1A-005~r", imported "Uab12cd-3"
  imported boolean not null default false,
  topic text check (char_length(topic) <= 20),
  session_id uuid,
  grade text check (grade in ('good', 'hard', 'again')),
  source text check (source in ('match', 'ai', 'self')),   -- key-concept match, Rosalind (AI), or rated by the student
  disputed boolean not null default false,
  retired boolean not null default false,
  boost boolean not null default false,                -- confidence insertion (doesn't move the schedule)
  practice boolean not null default false,             -- targeted practice before the card was due
  skipped_writing boolean not null default false,      -- a required written answer was skipped
  wrote_before boolean not null default false,         -- wrote an answer before flipping
  wrote_after boolean not null default false,          -- wrote in the adaptive learning box
  confidence smallint check (confidence between 1 and 10),
  ms_to_flip integer check (ms_to_flip between 0 and 7200000),     -- card shown -> flipped
  ms_to_next integer check (ms_to_next between 0 and 7200000),     -- flipped -> Next Card
  ms_in_popup integer check (ms_in_popup between 0 and 7200000),   -- Rosalind's pop-up -> Save and Next Card
  interval_days integer,
  due date,
  scheduler text check (char_length(scheduler) <= 40)
);
create index if not exists review_events_user_time on public.review_events (user_id, at);
create index if not exists review_events_card on public.review_events (card_key);
alter table public.review_events enable row level security;
drop policy if exists "add own events" on public.review_events;
create policy "add own events" on public.review_events for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "read own events" on public.review_events;
create policy "read own events" on public.review_events for select to authenticated using (user_id = auth.uid());
revoke all on public.review_events from anon, authenticated;
grant select, insert on public.review_events to authenticated;
