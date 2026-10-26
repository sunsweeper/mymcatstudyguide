# Development baseline audit

Audit date: 2026-10-25 (America/Los_Angeles). Repository: sunsweeper/mymcatstudyguide.
Baseline: `4bd0a7743f118c2e4f5b815373906198a3093608` (main). Local branch: `development/baseline-audit`, created from this commit. No push, PR, deployment, database query or database modification was performed.

## Scope and inspected evidence

Only the four documents in this directory were added. Existing documentation, application source, tests, metadata, protected references and deployment settings remain unchanged. Implemented means confirmed in source; it does not certify live service operation.

Inspected files and areas:

- `index.html`: inline markup/styles, card structures, embedded metadata, scheduling, sessions, persistence, auth/sync and startup/event handlers.
- `supabase.js`: vendor browser bundle; version string 2.117.3 matches README. Library internals were not independently security-audited.
- `README.md`, `.gitignore`, `vercel.json`, `.github/workflows/card-protection.yml`; legal-page headers and application links in `privacy.html` and `terms.html`.
- `docs/SETUP-ACCOUNTS.md`, `docs/supabase-setup.sql`, `docs/SCHEDULING.md`, `docs/CARD_IDS.md` (registry structure/counts), `docs/KNOWN_LIMITATIONS.md`, `docs/TEST_REPORT.md`, `docs/CHANGELOG.md`.
- `docs/package-1/README.md`, `METADATA_SCHEMA.md`, `AUDIT_REPORT.md`, `CONTENT_EXPANSION_REPORT.md`, `CARD-CORRECTIONS.md`, `STUDENT_EVENTS_DESIGN.md`, `review_events_draft.sql`; review-queue purpose and flagged counts. No substantive card/CSV/PDF content review or edits.
- `docs/package-2/INTERFACE-UPDATE.md`, `MASTERY_CRITERIA.md`, and `PHASE-1-RELEASE.md` through `PHASE-8-RELEASE.md`; scheduler evaluation context from release/mastery documentation and tools.
- All five `metadata/*.json` files: structures, counts and reference integrity via validators. Existing protected card/correction/visual files were read by protection checks.
- All 16 `tests/*.test.js` and `tests/harness.js`: execution model, fixtures, dependencies, network routing and outcomes.
- `tools/package.json`, `card-data.js`, `check-cards.js`, `validate-metadata.js`, `validate-graphics.js`, `visual-check.js`, `make-baseline.js`, `build-site-index.js`; scheduler-eval README, `sched.js`, simulation output paths; metadata-build README/generator inputs/output paths; graphics generator output paths. Generators were not run.
- Read-only GitHub repository metadata, baseline checks and attempted branch-protection read; Vercel project and production deployment metadata.

## Application architecture

Static vanilla JavaScript application: `index.html` contains UI, CSS, flashcards and application logic and loads the local Supabase SDK. No root package.json, application bundler/framework router or repository backend/API server exists. `tools/package.json` serves development checks. Vercel serves the root after two Node validators.

`CARDS` has 1,000 published text cards, each `[section, questionHTML, answerHTML, permanentId]`. `REVERSE` supplies 257 reverse variants. `BY_ID`, `SECTIONS`, `CATEGORIES`, `idOf()` and `keysFor()` provide identity/lookups. Forward progress uses the base ID; reverse progress appends `~r`. Notes/bookmarks use the base ID. `GRAPHIC_CARDS` contains 13 drafts, and `GRAPHICS_PUBLISHED` is empty. `?preview=graphics` renders drafts without account startup or progress saving.

Educational metadata is separate from student records: 1,000 card records, 1,359 concepts/subconcepts, 60 prerequisite links and 1,624 relations. `tools/build-site-index.js` produces compact `META` embedded in the page rather than fetched at runtime. It includes graphical drafts, whose publication remains separately gated. Ninety-eight cards are flagged for expert review.

## Authentication and account management

`AUTH_ON` checks for window.supabase.createClient. With the SDK, `startAuth()` gates the app behind accounts; without it, the page uses local-only progress. Tests deliberately omit/block the SDK. This fallback does not establish authenticated offline cold-start behavior.

The client contains hardcoded Supabase project `kwvcflbzocmalhlekxjv` and a browser publishable key. createClient enables implicit flow, URL session detection, persistent sessions and automatic token refresh. getSession restores sessions; the explicit auth-state callback handles PASSWORD_RECOVERY. General expiry/revocation/cross-tab sign-out integration is not covered by available tests.

`renderAuth()` implements password login, signup, verification resend, forgotten-password email and reset. Signup validates names, email, minimum eight-character password, MCAT date or unscheduled choice, terms and 18+ confirmation. `siteUrl()` supplies current origin/path for redirects. SMTP, confirmation, secure email-change, redirect allowlists and password policy were not inspected live.

`enterAccount()` loads profile/progress together, distinguishes setup/permission/network errors, chooses user-specific local storage and merges local/cloud/legacy progress. Signup metadata initializes MCAT defaults once. Legacy browser progress migrates into the first account logging in; a -moved-to-account copy is retained.

Account settings update first/last name. Email change verifies current password and same user ID, then calls Supabase updateUser({email}); pending change/resend and `refreshAuthUser()` exist. Completion depends on configured verification links. Password changes use logout/reset. Deletion requires typed DELETE and invokes delete_my_account, whose repository SQL deletes the auth user with cascading data deletion. No real account operation was exercised.

## Progress, synchronization and database contract

`blank()`, `normalizeProgress()` and `save()` own persistence. Local-only key: mcat-progress-v2. Authenticated key: mcat-progress-v2:u:<user-id>. Progress holds cards, open, newDay, notes, bookmarks, view, stats, sessionLog, test-date/settings fields, boosted, quote tracking and optional final21. Direction records contain schedule, totals and latest 50 history entries (d, r, t, optional w/p/k/b/e/c). Session summaries retain at most 500 records.

`save()` writes locally and schedules a push after four seconds. `pushProgress()` upserts the **whole JSON document**, without fetch-before-write or revision comparison. `pullMerge()` fetches on visible-tab return outside session modes, at most once a minute. No app online listener or durable retry queue exists; a later save/tab transition/login can retry. Hidden-tab/pagehide writes are best effort.

`mergeProgress()` chooses a whole direction record by last review timestamp, then longer history on ties, then earlier input. It does not union histories. Notes/bookmarks/open sessions merge as maps, counters take maxima, logs deduplicate by end timestamp/topic, newer-day sessions win, and settings generally favor first input. Login order is local, cloud, legacy. Concurrent devices can replace recent cloud work; deletions have no tombstones, so another copy can restore a deleted note/bookmark.

`noteActivity()` accumulates cards/time in memory; `flushActivity()` calls log_activity, restoring deltas on errors. Visible signed-in pages heartbeat about once a minute. These totals have no persisted idempotency token; ambiguous network outcomes/unloads need separate testing.

| SQL object | Contract in docs/supabase-setup.sql |
|---|---|
| profiles | Names/email/consent/admin/signup MCAT date; own read, admin read-all; student updates limited to names |
| progress | One JSONB document per user; authenticated owner-only CRUD; no special owner-dashboard access |
| activity | Daily cards/seconds/last seen; own read, admin read-all; writes through RPC |
| handle_new_user, handle_user_email | Profile creation and email propagation triggers |
| is_admin() | Reads profile admin flag, not editable user metadata |
| log_activity() | Auth required, server date +/-2 days; each call limited to 1,000 cards/7,200 seconds |
| delete_my_account() | Auth identity required; cascading deletion |

RLS/grants are repository contracts, not verified production schema. No production data was accessed. Event/session-table SQL in docs/package-1 is draft-only; the app has no review_events/study_sessions writer.

`exportProgress()`, `validBackup()`, `readImport()` and `applyImport()` implement version-2 JSON backup validation and confirmed restore. One safety snapshot is retained at mcat-progress-v2-before-restore. This key is origin-wide rather than account-specific and is not cleared by logout; shared-browser recovery isolation needs future validation. Export contains personal study data. No real data was exported/restored.

## Scheduling, sessions and time

RULES.scheduler is fsrs: embedded FSRS-5 weights, 90% recall target, 180-day maximum and approximately +/-5% spread from four-day intervals, capped afterward. `testCap()` limits spacing to half the remaining positive exam days; `clampToTest()` pulls schedules inward. `memoryFrom()` replays **retained** history, not unlimited history; `memOf()` caches it. `levelOf()`/`cardLevel()` use delayed-evidence mastery and the weakest studied direction.

First daily reviews drive memory evidence/totals; same-day repeats are retained without inflating long-term evidence. A miss is due today; same-day recovery can become due tomorrow. Successful confidence insertions (b) and targeted early practice (e) leave memory/schedules unchanged; misses count normally. Pre-reveal confidence (c, 1-10) does not alter scheduling. Legacy ladder remains selectable in RULES with the same history shape; source was not switched.

`buildQueue()` prioritizes due, missed-today, new, then early cards, generally 50 distinct cards and one direction each. `buildFocus()`/`buildFinal21()` implement targeted selection; `interleave()` mixes familiar cards and learning blocks. progress.open[topic] saves order, position, direction, first results, retries, reinforcement, drafts and time. Sessions resume same-day and rebuild on new days. `endOfPass()`, `startRetry()`, `pickReinforce()` and `finishSession()` implement one optional retry of first-pass misses, adaptive ungraded reinforcement and summary logging. Reinforcement now prefers struggle/forgetting/retention examples; the old positions rule is fallback.

First reveal counts a session once; its first card starts time. SESSION_MODES, `tickTime()`, `markActive()`, `flushTime()` and `persistPlace()` exclude other screens and hidden/idle time (two-minute threshold), periodically save and resume saved time. A tick is capped at five seconds, so throttling can undercount. Previous Card uses in-memory undo, not database rollback.

## Reuse map

| Concern | Existing structures/functions |
|---|---|
| Identity/metadata | Permanent IDs, ~r, BY_ID, idOf, keysFor, META, conceptOf, subOf, nearDup |
| Persistence/backups | blank, normalizeProgress, save, mergeProgress, validBackup; preserve legacy/optional fields |
| Scheduling/mastery | rate, memoryFrom, memOf, levelOf, cardLevel, testCap, clampToTest, RULES |
| Sessions | openSession, buildQueue, buildFocus, buildFinal21, interleave, start, persistPlace, finishSession |
| Estimated analytics | countedReviews, cardFacts, dashModel, categoryStatus, subActions, readiness, confidenceStats |
| Accounts/sync | startAuth, enterAccount, pushProgress, pullMerge, logOut, refreshAuthUser; existing SQL/RPC contract |
| UI/writing | Existing renderer, renderWorkspace, mustWrite, leaveCard, stashDraft/restoreDraft, focus/modal helpers |
| Protection | Card hashes, validators, visual reference, harness; never regenerate references to accept accidental edits |

## Tests actually executed

Windows; bundled Node v24.22.1. CI declares Node 20; Vercel reports 24.x. No root runner/config or lockfile is committed. Tests are standalone Node programs, not Playwright Test runner suites. Harness evaluates inline script with fake DOM/storage/clock and no SDK. Browser tests use disposable local/file pages and block Supabase loading, not real accounts.

| Node suite | Result |
|---|---|
| tests/interface-update.test.js | 54 passed, 0 failed |
| tests/phase1-scheduler.test.js | 50 passed, 0 failed |
| tests/phase3-confidence.test.js | 15 passed, 0 failed |
| tests/phase4-dashboard.test.js | 22 passed, 0 failed |
| tests/phase5-sessions.test.js | 23 passed, 0 failed |
| tests/phase6-countdown.test.js | 18 passed, 0 failed |
| tests/phase7-final21.test.js | 25 passed, 0 failed |
| tests/scheduler-parity.test.js | 3,000 histories identical, exit 0 |

Seven assertion suites total **207 checks**, plus parity. All eight exited 0. Eight browser suites passed **226 checks**; visual protection matched **2,514 card sides, four style sets and 16 screenshots** (details in regression checklist).

`node tools/check-cards.js`, `node tools/validate-metadata.js`, `node tools/validate-graphics.js` each exited 0: 1,000 protected originals unchanged; metadata valid with 98 review flags; 13 graphical drafts valid, zero published.

Initially Node/npm/gh were absent from PATH. Used bundled Node. Two pnpm installs failed with Windows EPERM project-registration symlinks, including a workspace-local store. Bundled modules were unsuitable (Playwright 1.62.1, pixelmatch 7.2.0, missing browser). Fallback extracted exact declared versions Playwright/playwright-core 1.56.0, pixelmatch 5.3.0, pngjs 7.0.0 into scratch outside the repository and set NODE_PATH. Playwright installed Chromium 141.0.7390.37/build 1194 using scratch PLAYWRIGHT_BROWSERS_PATH; one FFMPEG reset succeeded on installer retry. Bypassing normal package-manager install is a reproducibility limitation. No tracked dependency files changed.

GitHub protect succeeded for this SHA ([run](https://github.com/sunsweeper/mymcatstudyguide/actions/runs/40247657978)). It runs card/metadata/graphics/visual checks, **not feature suites**. Vercel runs card/graphics only. Required merge/deploy gates are unverified: main protection read returned 403. Successful Supabase Preview check exists but does not establish isolated credentials or migration policy.

## Risks and unsupported assumptions

1. Whole-document sync can overwrite concurrent work; maps cannot represent deletions. Recovery/legacy copies need shared-device testing.
2. Preview code retains the hardcoded backend. Separate browser origins do not isolate database records; no staging backend configuration exists in tracked source.
3. Auth, SMTP, deployed RLS, expiry, account switching and real offline reconciliation are not exercised by current suites. Source alone does not certify production security/deletion-token revocation.
4. Checks are not proven release gates. Baseline production readiness preceded protect completion. Vercel omits metadata/visual/feature checks; tools check-all omits graphics and feature suites.
5. No lockfile, differing Node versions, random selection and OS/file-URL/font behavior limit reproducibility. Safari/Firefox, real keyboards/devices, screen readers and long suspensions remain unverified.
6. Bounded history/logs cannot recover old review events; normalized events, per-card duration and graded-practice data are absent.
7. Owner dashboard MCAT dates are signup profile values and can be stale relative to progress. Admin behavior depends on deployed SQL.
8. Help media absent; report delivery/activation unverified. Browser suggestion-disabling attributes are requests, not guarantees.
9. Existing documents are historical: README says no build command, but vercel.json defines one. Scheduling's local-only/no-sync and fixed reinforcement descriptions conflict with newer code. TEST_REPORT.md references missing tests/results.txt, tests_v2.js, site/index.html and older suite totals. Earlier metadata audit says no graphics, but 13 drafts now exist. Those claims were not silently adopted or rewritten.

See [FEATURE_INVENTORY.md](FEATURE_INVENTORY.md), [REGRESSION_CHECKLIST.md](REGRESSION_CHECKLIST.md) and [DEPLOYMENT_ROLLBACK.md](DEPLOYMENT_ROLLBACK.md).
