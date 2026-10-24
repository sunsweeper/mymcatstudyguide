-- MyMCATstudyguide.com: database setup.
-- Run once in Supabase: SQL Editor -> New query -> paste all of this -> Run.
-- Safe to run again; it updates the existing setup.

-- ---------- Tables ----------

-- One row per account: name, email, when they agreed to the terms, and whether they're the site owner.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '' check (char_length(first_name) <= 40),
  email text,
  created_at timestamptz not null default now(),
  terms_accepted_at timestamptz,
  age_confirmed boolean not null default false,
  is_admin boolean not null default false
);

-- Each person's study progress (ratings, schedules, notes, bookmarks). Only that person can read it.
create table if not exists public.progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Daily usage totals: cards reviewed and seconds of active study. No answers or scores.
create table if not exists public.activity (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  cards integer not null default 0,
  seconds integer not null default 0,
  last_seen timestamptz not null default now(),
  primary key (user_id, day)
);

-- Added later: last name and MCAT date (safe to run on an existing database).
alter table public.profiles add column if not exists last_name text not null default '' check (char_length(last_name) <= 40);
alter table public.profiles add column if not exists mcat_date date;
alter table public.profiles add column if not exists mcat_unscheduled boolean not null default false;

alter table public.profiles enable row level security;
alter table public.progress enable row level security;
alter table public.activity enable row level security;

-- ---------- Who can see what ----------

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

drop policy if exists "read own profile, owner reads all" on public.profiles;
create policy "read own profile, owner reads all" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (first_name, last_name) on public.profiles to authenticated;   -- people can change their name, nothing else

-- Progress: only the person themself. The owner cannot read it.
drop policy if exists "own progress" on public.progress;
create policy "own progress" on public.progress
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.progress from anon, authenticated;
grant select, insert, update, delete on public.progress to authenticated;

-- Activity: people see their own; the owner sees everyone's. Written only through log_activity below.
drop policy if exists "read own activity, owner reads all" on public.activity;
create policy "read own activity, owner reads all" on public.activity
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
revoke all on public.activity from anon, authenticated;
grant select on public.activity to authenticated;

-- ---------- New accounts get a profile automatically ----------

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare d date;
begin
  begin d := (new.raw_user_meta_data->>'mcat_date')::date; exception when others then d := null; end;   -- a bad date never blocks sign-up
  insert into public.profiles (id, first_name, last_name, email, terms_accepted_at, age_confirmed, mcat_date, mcat_unscheduled)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data->>'first_name', ''), 40),
    left(coalesce(new.raw_user_meta_data->>'last_name', ''), 40),
    new.email,
    case when (new.raw_user_meta_data->>'accepted_terms') = 'true' then now() end,
    coalesce((new.raw_user_meta_data->>'age_confirmed') = 'true', false),
    d,
    coalesce((new.raw_user_meta_data->>'mcat_unscheduled') = 'true', false)
  )
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_user_email()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end; $$;
drop trigger if exists on_auth_user_email on auth.users;
create trigger on_auth_user_email after update of email on auth.users
  for each row execute function public.handle_user_email();

-- ---------- Usage logging (counts and time only) ----------

create or replace function public.log_activity(p_day date, p_cards integer, p_seconds integer)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if p_day < current_date - 2 or p_day > current_date + 2 then raise exception 'bad day'; end if;
  insert into public.activity (user_id, day, cards, seconds, last_seen)
  values (auth.uid(), p_day, greatest(0, least(coalesce(p_cards, 0), 1000)), greatest(0, least(coalesce(p_seconds, 0), 7200)), now())
  on conflict (user_id, day) do update
    set cards = public.activity.cards + excluded.cards,
        seconds = public.activity.seconds + excluded.seconds,
        last_seen = now();
end; $$;
revoke all on function public.log_activity(date, integer, integer) from public, anon;
grant execute on function public.log_activity(date, integer, integer) to authenticated;

-- ---------- "Delete my account" ----------

create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  delete from auth.users where id = auth.uid();   -- profile, progress and activity are deleted with it
end; $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ---------- Make yourself the owner ----------
-- After you sign up on the site and verify your email, run this one line (with your email):
-- update public.profiles set is_admin = true where email = 'aaron@sunsweeper.com';
