-- Deck import: each student's own imported decks (Anki / CSV). Private: only the student who imported a deck can read,
-- change or delete it. Not even the owner account can read them (no is_admin clause).
-- Run once in Supabase → SQL Editor. Safe to run again.
create table if not exists public.user_decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,   -- deleted with the account
  code text not null check (code ~ '^[a-z0-9]{6}$'),
  name text not null check (char_length(name) between 1 and 80),
  cards jsonb not null check (jsonb_typeof(cards) = 'array' and jsonb_array_length(cards) between 1 and 5000),
  created_at timestamptz not null default now(),
  unique (user_id, code),
  constraint user_decks_size check (octet_length(cards::text) <= 4000000)
);
alter table public.user_decks enable row level security;
drop policy if exists "own decks only" on public.user_decks;
create policy "own decks only" on public.user_decks for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.user_decks from anon, authenticated;
grant select, insert, delete on public.user_decks to authenticated;

-- At most 20 decks per student.
create or replace function public.user_decks_limit() returns trigger language plpgsql set search_path = '' as $$
begin
  if (select count(*) from public.user_decks where user_id = new.user_id) >= 20 then raise exception 'deck limit reached'; end if;
  return new;
end; $$;
drop trigger if exists user_decks_limit on public.user_decks;
create trigger user_decks_limit before insert on public.user_decks for each row execute function public.user_decks_limit();
