# Student review events — design and migration plan (not yet built)

Package 1 designs this; it doesn't turn anything on. No table was created, the app doesn't send events, and students see nothing new. The draft SQL is in `review_events_draft.sql` and has **not** been run.

## Why

Today each student's progress is one JSON document (Supabase table `progress`, column `data`). For each card direction it keeps the current schedule plus the last 50 ratings (`history`). That's enough to schedule cards but not to analyze learning: older ratings are dropped, review time isn't stored per card, and session links are lost. An append-only event table fixes that without touching the current system.

## What's stored now (preserved as is)

| Where | Contents |
|---|---|
| `progress.data.cards["1A-005"]` / `["1A-005~r"]` | Per direction: `status`, `writing` (write-before-flip required), `due`, `interval`, `reps`, totals, and `history` — up to 50 entries of `{ d: day, r: rating (good/hard/again), t: timestamp ms, w: what they wrote after Struggled/Didn't know }` |
| `progress.data.open[topic]` | The unfinished session for today: card order, position, first ratings, second-try results, study time |
| `progress.data.sessionLog` | Up to 500 finished-session summaries: topic, end time, cards seen, ratings tally, missed, second-try results, reinforcement outcome, active study time |
| `progress.data.stats` | Lifetime sessions and active study time |
| `activity` table | Per day: cards reviewed, active seconds, last seen (no answers or scores) |

## Proposed tables

**`review_events`** (one row per rating; never updated or deleted except with the account)

| Column | Type | Notes |
|---|---|---|
| `id` | bigint identity | |
| `user_id` | uuid → auth.users, cascade delete | Row-level security: a student sees only their own rows; the owner can't read them |
| `card_id` | text | The permanent card ID (`1A-005`); direction is a separate column |
| `direction` | text | `question_first` or `answer_first` |
| `reviewed_at` | timestamptz | |
| `rating` | text | `good`, `hard`, `again` (Got it / Struggled / Didn't know) |
| `review_duration_ms` | integer, nullable | Card shown → rated, only when the tab stayed visible and active; null otherwise |
| `confidence` | smallint, nullable | Reserved for a future confidence rating |
| `mandatory_recall` | boolean | Write-before-flip was required for this card |
| `recall_written` | boolean | Something was written before flipping (Active Recall or the required box) |
| `attempt_kind` | text | `first`, `second_try`, `reinforcement`, `early_review` |
| `schedule_before` / `schedule_after` | jsonb | Interval, reps, due date before and after the rating |
| `next_review_on` | date | Due date after the rating |
| `session_id` | uuid, nullable → `study_sessions` | |
| `practice_attempt_id` | uuid, nullable | For a future practice-question feature |
| `content_version` | text | Card text version reviewed (`cards-v1`), so a later correction never mixes evidence |
| `source` | text | `app` or `migrated_history` |
| `client_event_id` | uuid, unique | Makes uploads safe to retry; duplicates are ignored |

**`study_sessions`**: `id`, `user_id`, `topic`, `started_at`, `ended_at`, `active_ms`, `cards_seen`, `reinforcement_status`, `source`.

## Migration plan (non-destructive)

1. **Create the tables** with row-level security. Nothing writes to them. Safe to run anytime.
2. **Dual-write.** On each rating the app still updates the progress JSON exactly as now, and also queues an event that uploads in the background (retrying offline, as progress already does). If the upload fails, nothing about studying changes.
3. **Backfill** from each student's existing `history` entries as `source = 'migrated_history'`. `client_event_id` is derived from user, card direction, timestamp and rating, so running it twice adds nothing. Missing fields stay null (duration, session); `mandatory_recall` is left null rather than guessed.
4. **Verify** per student: event counts match history counts for every card direction; schedules recomputed from events match the stored schedules.
5. **Only then** start using events for analytics or adaptive features. The progress JSON stays the source of truth for scheduling until a later package decides otherwise. Nothing is deleted.

Rollback at any step: stop writing events. The progress JSON was never changed.

## Limits to know

- History before this point is capped at the last 50 ratings per card direction, so a backfill can't recover older ratings.
- Review time per card isn't recorded today; it will exist only for events captured after step 2.
- Card relations matter for analysis: near-duplicate and same-fact pairs (`metadata/card_relations.json`) are overlapping evidence, not independent demonstrations of mastery.
