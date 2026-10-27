# One review candidate: website and integrated study experience

Branch: `integration/website-and-study-review`. Target: `main` directly.

This branch starts from latest main `4bd0a7743f118c2e4f5b815373906198a3093608` and contains a single consolidated implementation commit. Its application files match PR #5 head `06aceae9328361ad5e7c1f7ec3c4b890c8bfeff6`; only this consolidation map and historical PR #3 audit documents are added. It has no dependency on merging PR #2, #3, #4 or #5 first. Those PRs and branches are not closed, deleted, merged or rewritten.

## Inclusion audit

| Existing PR | Head / base | Included here |
|---|---|---|
| #2 — Implement V24 website and preserve study app at /login | `08a3b86` / main | All website/support pages, login/trial cleanup, URL routing and tests; ancestor of latest #5 |
| #3 — Project 2: CSS-only V24 study styling; original behavior and tests preserved | `be3f7cb` / #2 branch | Old styling implementation is superseded by the current interface, not layered on top; its two audit documents are preserved verbatim under `docs/archive/pr-3/` |
| #4 — Refine quote spacing, centered alignment, study label and resume-note placement | `0fcd48b` / #2 branch | All approved quote changes; ancestor of latest #5 |
| #5 — latest implementation head | `06aceae` / #4 branch | Full interaction adapter, CSS, homepage/tour alignment, stored explanations, frozen visual references, functional protection and tests |

`main`, PR #2 and PR #4 are ancestors of latest PR #5. PR #3 is a separate older branch; its net changes against #2 are only an older index.html skin plus the two historical reports. No unique operational feature from that CSS-only revision is missing. Its earlier interaction experiment is superseded by the latest tested adapter and remains recoverable in its original branch/history.

The previous PR #5 description still describes its older CSS-only stage. The inspected source at `06aceae` is the full interaction implementation. This consolidation identifies the actual source revision, not that stale description.

## Full integration is implemented

The actual app loads `study-ui.js` and `study-ui.css`. It provides a default-on Active Recall switch and retrieval box, persistent Flip Card, Next Card rating dialog, keyboard flipping, focus/escape/backdrop handling, reinforcement entry and minimum validation, notes/previous-answer drawers, bookmarks, stored explanations on supported cards, and an operational nine-step tour. All three rating flows delegate to the original handlers. A deliberate duplicate stale rating event is ignored. Refresh restores the real card, pending rating and response. All of this is exercised through browser interactions, not inferred from CSS tests.

The homepage now demonstrates the same reinforcement requirement and flip transition; its tour accurately discloses planned peer assistance and the real study rules.

## Access the actual study interface

Use the Vercel preview URL supplied with the PR. `/` is the marketing homepage and disposable five-card demonstration. To inspect the real application:

1. Open the preview's `/login` URL and sign in with your test account.
2. On `/dashboard`, choose a topic such as Bio/Biochem.
3. On the quote/introduction screen, select **Begin Flashcards**.
4. The real deck opens at `/study/bio-biochem` (or the selected topic's study URL). Use its Guided Tour, recall entry, Flip Card and Next Card to examine the integrated experience.

This is the account-backed operational deck, not the five-card homepage sample. No new account was created by the agent. Automated tests use isolated mocked users; they do not write real student progress.

## Remaining differences and incomplete features

- The homepage is a disposable five-card sample. Real sessions retain the existing 50-card selection/order, FSRS, confidence, mastery, optional missed-card retry and final three-concept recall. Real progress/counts and account navigation therefore differ appropriately.
- Mode changes in real study preserve the current session/order and apply to subsequent cards. Previous retains the original rating undo. The tour explains these engine-governed rules rather than replacing them with the prototype's simplified navigation.
- Real required writing and the existing Mandatory Response override/confirmation remain. First-recall text stays locked after revealing. Previously saved notes/answers remain hidden until reveal; personal draft editing/saving retains original behavior.
- Explain This Concept uses existing complete library entries only, after reveal. Unsupported cards have a disabled control; no new scientific explanation was generated or independently fact-checked.
- Raise Your Hand is explicitly planned; no live peer backend/archive/moderation exists. A local working design proposal is supplied separately. No messaging service or database migration was introduced.
- The real app has extra confidence, previous-answer, reporting and account controls. Existing unavailable help-video fallback remains.
- Real credential login, email verification/recovery, production writes, cross-device synchronization, physical devices, Safari/Firefox and human screen-reader use remain unverified. The existing contact form reports delivery unavailable until its webhook is configured; automated contact tests use mocks. Production copy/business/legal review is not established by these engineering checks.

## Protections and release status

The 1,000 card baseline, IDs/content, correction records and 2,514 markup hashes are unchanged. The learning engine, auth and persistence code from the approved operational version remains unchanged; a manifest protects 29 learning/persistence functions and scheduling/mastery constants. Browser tests compare all three popup ratings against original scheduling/history results and check progress ownership. No Supabase schema, migration, storage format or student-data change is included.

The complete Card Protection workflow remains active. It runs all 24 regression suites and content/metadata/graphics checks, plus four visual style sets and 24 screenshot comparisons covering card sides, full workspace and rating dialogs. Reference UI assets are frozen independently of candidate assets. Deliberate unauthorized card-content and external-color changes are still rejected.

The consolidation is a single **review candidate**, not a production approval. No existing PR/branch is removed or merged, no production deployment is performed, and the existing production alias is not changed. Publication requires the owner's review and approval of this new PR and preview.
