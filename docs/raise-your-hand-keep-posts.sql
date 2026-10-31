-- Raise Your Hand: keep questions and answers when a student deletes their account.
-- Run once in Supabase -> SQL Editor (after docs/raise-your-hand.sql). Safe to run again.
-- Posts are anonymous to other students. When an account is deleted, its questions and answers stay up and lose
-- their link to the account (asker_id / author_id become empty). The account's notifications and reports are
-- still deleted with it. Removing a post takes an official request (the owner hides or deletes it).
alter table public.rh_questions alter column asker_id drop not null;
alter table public.rh_questions drop constraint if exists rh_questions_asker_id_fkey;
alter table public.rh_questions add constraint rh_questions_asker_id_fkey foreign key (asker_id) references auth.users(id) on delete set null;
alter table public.rh_answers drop constraint if exists rh_answers_author_id_fkey;
alter table public.rh_answers add constraint rh_answers_author_id_fkey foreign key (author_id) references auth.users(id) on delete set null;
