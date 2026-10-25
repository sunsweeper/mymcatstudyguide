# Package 2 · Phase 1 release — spaced repetition and mastery

Released on its own. No other Package 2 phase is included.

## What changed for students

- **Spacing:** review gaps now come from FSRS instead of the fixed 1-3-7-14-30-60-90 ladder. The evidence is in PHASE-1-SCHEDULER-EVALUATION.md.
  - A new card answered Got it comes back in 3 days, not 1.
  - Well-known cards stretch out to as much as 180 days, less as the test approaches.
  - Struggled is scheduled from the card's history rather than always "tomorrow".
- **Mastery levels** are tracked for every card direction, with the criteria in MASTERY_CRITERIA.md. They are not displayed yet; Phase 4 (the dashboard) will use them.
- **Confidence insertions:** after 3 difficult cards in a row, one of her mastered cards appears next. A correct answer on it changes nothing about its schedule.
- **Sparkle:** a brief sparkle (about 0.5 s) after some correct answers on mastered cards. There is no message or popup, and nothing is shown with reduced motion.

## What didn't change

- **Card content and design:** every protected card's content and visual design (verified below), all card IDs, the rating buttons and keyboard keys, and the session order rules.
- **Writing and the second try:** writing rules, the missed-card second try and reinforcement.
- **Saved data:** existing due dates. No card is rescheduled at deploy time; each card's next rating uses its full history.

## Data changes

**No database change. No Supabase migration and no new table or column.** Progress is still one JSON document per student (`progress.data`). The new fields below are optional and additive:

| Field | Where | Meaning |
|---|---|---|
| `b: 1` | a history entry | That rating was on a confidence insertion |
| `boosted` | top level | Card ID → date it was last inserted, so it isn't inserted again within 14 days. Merged between devices, newest date wins. |
| `boost`, `boostCount`, `hardRun` | an unfinished session (`open`) | Insertion bookkeeping for that day's session |

Older builds ignore these fields. FSRS memory and mastery levels are never stored; they are recomputed from history.

## Rollback

| Option | How | Effect |
|---|---|---|
| **1. Scheduler only** | Set `RULES.scheduler: "ladder"` in `index.html` and push | The previous ladder rules apply from the next rating, using the kept streak (`reps`). History, mastery levels, insertions and the sparkle are unaffected. All 22 earlier test suites pass in this mode. |
| **2. Whole phase** | In Vercel, promote the previous production deployment (commit `a8a288e`), or revert this commit | The site is exactly as before Phase 1. Saved progress still loads: the extra fields are ignored, and a `b` entry counts as an ordinary Got it in the old miss-window rule (harmless). |

Either way, no review history is lost.

## Tests

| Suite | Result |
|---|---|
| `tests/phase1-scheduler.test.js` (new), covering the package's test items 1, 2, 3, 4, 5, 10, 11 and 13, plus insertions, sparkle, history retention, reverse direction and rollback | 50 / 50 passed (40 repeated runs, no flakes) |
| `tests/scheduler-parity.test.js` (new): site code vs the simulated scheduler on 3,000 random histories | Identical memory and levels |
| `tests/phase1-browser.test.js` (new, Chromium): sparkle outside the card; gone in about 0.6 s; focus and keyboard kept; none with reduced motion; insertion on a phone layout | 16 / 16 passed |
| Existing logic suites, scheduler = FSRS | 438 checks passed. Three checks changed to expect FSRS's 3-day first interval when the scheduler is FSRS. |
| Existing logic suites, scheduler = ladder (rollback mode) | All pre-existing checks passed unchanged |
| Existing browser suites (layout v2, tips, accounts) | 44 + 25 + 29 passed |
| Layout audit: every screen at 360 / 390 / 440 / 768 / 1280 px, light and dark | 0 findings |

## Protected card content

| Check | Result |
|---|---|
| `node tools/check-cards.js` | All 1,000 protected cards unchanged |
| `node tools/validate-metadata.js` | Valid: 1,000 card records, 1,359 concepts, 60 prerequisite links, 1,624 relations |
| `node tools/visual-check.js` | 2,514 card sides, 4 style sets and 16 screenshots match the approved reference |

The same checks run in GitHub Actions and in the Vercel build on every push.
