# Package 2 · Phase 1.2 — Mastery criteria

These criteria were written before the feature was implemented, as Phase 1.2 requires. They are implemented as `memoryFrom()` / `levelOf()` / `cardLevel()` in `index.html` and as `memoryFrom()` in `tools/scheduler-eval/sched.js`; tests check that the two give identical results.

## Definitions

- **Counted rating:** the first rating of a card direction on a given day. Same-day repeats are ignored. A **Got it** on a confidence insertion (§Insertions below) is also ignored.
- **Delayed success:** a counted **Got it** at least 1 day after the previous counted rating. Its *gap* is the number of days since that previous rating.
- **Lapse:** a counted **Didn't know**. A lapse clears the run of delayed successes.
- **S (memory strength):** FSRS stability in days, i.e. roughly how long until predicted recall falls to 90%. It comes from replaying the full history (PHASE-1-SCHEDULER-EVALUATION.md).

## Levels (per card direction)

| Level | Rule |
|---|---|
| **Unseen** | No ratings |
| **Learning** | Seen, but no delayed success since the last lapse |
| **Developing** | At least one delayed success since the last lapse, but not yet provisionally mastered |
| **Provisionally mastered** | Since the last lapse: **≥ 2 delayed successes**, one with a gap **≥ 7 days**; latest counted rating is **Got it**; **S ≥ 21 days** |
| **Mastered** | Since the last lapse: **≥ 3 delayed successes**, one with a gap **≥ 21 days**; latest counted rating is **Got it**; **S ≥ 60 days** |
| **Previously mastered — needs renewed attention** | Was ever provisionally mastered or mastered, and is now below provisional. It stays here until it earns provisional mastery again. |

**Struggled:** a counted Struggled doesn't clear the run of successes. But while it is the latest rating, the card is held below provisional mastery.

**A card's overall level** is the lowest level among the directions she has studied. A card is mastered only when every direction she has studied is mastered. "Needs attention" wins a tie with Developing.

## Why these thresholds

- **Never from one answer:** a single correct answer can never be mastery. Even a first-sight Got it has no gap, so it isn't a delayed success.
- **Gaps and S both required:** the gap rules ask for evidence of retrieval across meaningful intervals. Requiring S as well means a lucky long gap after a string of struggles doesn't count.
- **A perfect run** reaches provisional mastery on about day 14 (Got it on day 0, 3 and 14) and mastery on about day 49 (a further Got it after about 35 days).
- **Cramming can't get there:** daily reviews never produce the 21-day gap that mastery needs (test P14).
- **Near the exam,** the test-date cap shortens intervals. Mastery then needs at least about 42 days left (cap ≥ 21), so cards studied only in the last weeks can reach provisional mastery but not mastery. This is intended: a short gap is weaker evidence.

**Validation:** recall in the simulation (30 students each, FSRS scheduling, exam in 90 days):

| Level at exam | GT-EXP: recall on exam day · 30 days later without review | GT-FSRS: same | GT-ACTR: same |
|---|---|---|---|
| Learning | 0.37 · 0.05 | 0.74 · 0.38 | 0.76 · 0.56 |
| Developing | 0.94 · 0.71 | 0.91 · 0.72 | 0.80 · 0.63 |
| Needs attention | 0.97 · 0.86 | 0.91 · 0.73 | 0.82 · 0.68 |
| Provisionally mastered | 0.99 · 0.93 | 0.98 · 0.90 | 0.80 · 0.67 |
| Mastered | **1.00 · 0.97** | **0.99 · 0.95** | 0.80 · 0.67 |

Under two of the three memory models, the levels separate durable retention clearly. Thirty days without review, mastered cards keep about 95–97% recall, against about 71% for developing cards. Under the ACT-R model, nothing the app can observe predicts retention well (FSRS predictions failed there too), so the levels barely differ. Levels are labeled as learning-evidence categories, not measured probabilities.

## How mastered cards are treated (Phase 1.3)

- **Never removed:** every direction always has a due date. The longest interval is 180 days, shorter as the test approaches.
- **Forgetting brings it back:** a Didn't know makes the card due again today and cuts its memory strength sharply. It moves to *needs attention* and comes back at short intervals until it recovers.
- **Mixed sessions:** mastered cards appear in normal sessions whenever they're due.
- **Insertions:** see below.

## Confidence insertions

- **When:** in the first pass of a session, after **3 consecutive** Struggled / Didn't know ratings, the next card is one of her mastered cards from the same topic. A provisionally mastered card is used only if none is available.
- **Eligible cards:** not due, not already studied today, not already in this session, and not inserted in the last 14 days. At most **2 insertions per session**.
- **Got it** on an inserted card is saved in its history (marked `b`) but changes nothing: same due date, interval, streak and totals, same memory strength and level.
- **Struggled or Didn't know** on an inserted card counts as a real review, because it's genuine evidence of forgetting.
- **Session results:** inserted cards aren't part of the session's results (score, missed-card second try, reinforcement picks).
- **Undo:** Previous Card removes an insertion along with the rating that triggered it.

## Celebration (Phase 1.4)

- **When:** after a counted Got it leaves a card at **Mastered**. A Got it on an inserted mastered card also qualifies.
- **What:** a sparkle of about 0.5 seconds over the card.
- **How often:** always when the card has just become mastered; otherwise at most about every 6th eligible card, with a 50% chance.
- **Constraints:** no text, no popup, nothing to click. The next card is already showing and keeps keyboard focus. Nothing is drawn when the device asks for reduced motion.
