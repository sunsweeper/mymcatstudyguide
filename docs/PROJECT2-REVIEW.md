# Project 2 — V24 real study interface review

Date: October 27, 2026. Branch: feature/v24-study-redesign. Base: 08a3b86b19cf8d07bbeaef53be129941b274b407, the tested Project 1 production application including screen URLs and login trial removal. No merge or production deployment is authorized by this project.

## What changed
The real application now uses the approved demonstration's cream card surface, forest-green workspace and controls, rose accents, centered content and category/ID treatment. Existing embedded fonts remain available offline. Questions First / Answers First / Random Mix, bookmarks, confidence ratings, notes, prior written answers, reporting, Mandatory Response, Previous Card and actual graphical cards remain part of the real application.

Next Card after a reveal opens a keyboard-accessible rating dialog with Didn't know, Struggled and Got it. Each selection delegates to the original chooseRating/finishCard/answer functions. The dialog closes synchronously before dispatch, preventing double-clicks from rating another card. Close, backdrop and Escape dismiss without saving a rating; focus is restored. Tab stays in the dialog and the application shell is inert while a dialog is open.

Struggled / Didn't know still open the existing written-response workspace. The existing 20-character enforcement and explicit skip confirmation are preserved. Both the contextual writing action and main Next Card use submitReinforce. A Change rating action allows correction before submission.

Active Recall is now an accessible on/off switch controlling the existing written-answer workspace. It does not override Mandatory Response: a missed direction that still requires writing cannot bypass that requirement through the new switch. New cards remain optional, mastery ends the old requirement, and missing a mastered card restores it. The separate existing Mandatory Response setting retains its original meaning and persistence. Drafts and answer history are retained.

## Audit and prototype differences
See PROJECT2-AUDIT.md for the pre-implementation inventory. The prototype is not the scheduling engine. It always requires writing by default, shuffles its own five-card array, keeps transient data, and lacks real reinforcement, undo, confidence, direction schedules and account synchronization. None of that replaces production logic. The real app never shows the demo's trial-completion popup.

## Protected behavior
7,680 paired before/after reviews compare direction state, complete saved histories, memory calculations and mastery against the exact Project 1 base, with identical controlled interval jitter. Cases include all three ratings, forward/reverse directions, variable day gaps and exam-date caps. Existing scheduler parity additionally covers 3,000 randomized histories.

Twenty-five protected learning/data functions are byte-for-byte unchanged: rate, memoryFrom, memOf, levelOf, cardLevel, fsrsInterval, fsrsDays, buildQueue, start, previousCard, finishCard, answer, mergeProgress, pushProgress, pullMerge, persistPlace, stashDraft, restoreDraft, sendReport, mustWrite, finishSession, toReinforce, endOfPass, startRetry and chooseRating.

All 1,000 protected card texts, IDs and reverse content are unchanged. All 13 graphical drafts remain unpublished. The application router, account storage keys, Supabase project/client, schema, permissions, user ownership and reporting destination are unchanged. No new dependencies or migrations were introduced.

## Test results
All 21 test suites passed locally. Raw logs accompany this handoff.

| Suite | Result |
|---|---:|
| interface-update | 54 passed |
| interface-browser | 113 passed |
| phase1-scheduler | 50 passed |
| phase1-browser | 16 passed |
| phase2-browser | 17 passed |
| phase3-confidence | 15 passed |
| phase3-browser | 9 passed |
| phase4-dashboard | 22 passed |
| phase4-browser | 13 passed |
| phase5-sessions | 23 passed |
| phase6-countdown | 18 passed |
| phase6-browser | 29 passed |
| phase7-final21 | 25 passed |
| phase7-browser | 13 passed |
| phase8-browser | 16 passed |
| contact | 6 mocked API checks passed |
| scheduler-parity | 3,000 randomized histories passed |
| screen-routing-browser | 54 passed |
| website-browser | 198 passed |
| v24-scheduling-parity | 7,680 paired comparisons; 25 unchanged functions |
| v24-study-browser | 83 passed |

Card-protection, metadata and graphics validation passed. The prior visual baseline correctly detected the requested design changes. The V24 candidate baseline was then generated under the explicit Project 2 design authorization, with a recorded approval context; final visual regression passes for 2,514 card sides, four theme/viewport style sets and 16 screenshots. No content baseline changed. This candidate baseline does not authorize production release.

Browser coverage includes 360/390/440/768/1280px for existing layout checks and 390/1440px for the new interactions; light/dark themes, keyboard controls, modal focus/Escape, screen-reader DOM structure, reduced motion, all ratings, duplicate-click prevention, mandatory pre/post writing, enforcement-off confirmation, notes, bookmarks, reporting feedback, study modes, missed retry, ungraded reinforcement, completion, refresh and mocked account synchronization. Graphical support is tested with all draft figures and simulated publication, without publishing them.

Tests tied to the intentionally replaced card-label/header geometry were updated to assert the V24 centered label, upper-left bookmark and upper-right category/ID, while retaining overlap, responsive, hidden-content and accessibility coverage. Existing rating-click tests now open Next Card's dialog. The refresh fixture now serves actual application assets rather than returning HTML for script URLs. The harness accepts a baseline source file solely for before/after comparison.

## What is not verified
Actual production accounts, verification/recovery email delivery, remote database writes and real cross-device sync were not exercised; sync tests use a mock client with explicit account identity checks. FormSubmit delivery is mocked, so owner-inbox receipt and external service activation are not claimed. No real user progress was modified by the test runs. Safari, Firefox, physical phones and a human screen-reader session have not been tested.

The pre-existing whole-copy multi-device sync limitation remains: nearby concurrent device writes may overwrite recent remote state until another merge. The missing how-to video remains outside this interface redesign. Contact delivery and legal/business confirmations documented in Project 1 remain outside this scope.

## Community status and owner decisions
A read-only inspection found only public.profiles, public.progress and public.activity, all with RLS enabled, and no deployed Supabase edge functions. No existing community backend or production community code was found. Raise Your Hand therefore opens an honest availability notice and can link into the existing card-report form. It never submits or saves a peer question. Real community posting, search, replies, anonymity and moderation remain unimplemented and need a separately scoped project.

Review the candidate appearance and interaction before authorizing production release. No learning-rule changes need approval because none were made. Community launch scope remains an owner decision; it is not represented as working.

## Modified files
- index.html: scoped V24 presentation, study controls, rating/community dialogs and UI adapters.
- tests/harness.js: optional baseline source input.
- tests/study-rating-helper.js: reusable Next Card dialog opening for browser tests.
- tests/interface-browser.test.js: authorized presentation geometry and proper refresh asset fixture.
- tests/phase1-browser.test.js, tests/phase3-browser.test.js, tests/phase8-browser.test.js: existing rating checks use the new dialog.
- tests/v24-study-browser.test.js: real-interface workflow, accessibility and persistence coverage.
- tests/v24-scheduling-parity.test.js: paired baseline/current learning and data-function protection.
- protected/visual-approvals.json: candidate design authorization record.
- protected/visual/card-styles.json and protected/visual/reference-index.html: candidate visual regression reference.
- .github/workflows/card-protection.yml: full base history for comparison and new regression jobs.
- docs/PROJECT2-AUDIT.md and docs/PROJECT2-REVIEW.md: audit and complete review/test report.

Approved homepage.html, all six supporting pages, site-pages-v24.css, auth/database configuration and app-router.js are unchanged.
