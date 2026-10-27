# Project 2 pre-implementation audit

Base: production Project 1 commit 08a3b86b19cf8d07bbeaef53be129941b274b407, verified from production alias. Branch: feature/v24-study-redesign. Homepage, supporting pages and application routes are integration boundaries, not redesign targets. No merge or production deployment is authorized.

Reviewed docs/SCHEDULING.md, docs/package-2/MASTERY_CRITERIA.md, docs/package-2/INTERFACE-UPDATE.md, docs/KNOWN_LIMITATIONS.md, existing Node/browser regression tests, index.html rendering/event handlers, and the V24 homepage demo.

| Area | Authoritative production behavior | Prototype difference / redesign constraint |
|---|---|---|
| Rendering | renderScreen builds #card; stable ID, category, direction, question/answer and graphic SVG support | Restyle surface, headings, spacing and controls; preserve all card content and IDs |
| Scheduling | FSRS-5 history replay, 90% target recall, max 180 days, exam cap, per-direction state, same-day/early safeguards | Demo has no scheduler; never copy its deck/rating implementation |
| Mastery | Evidence thresholds: provisional 2 delayed successes including 7-day gap and S>=21; mastery 3 including 21-day gap and S>=60 | Demo ratings do not establish mastery |
| Active Recall | Voluntary writing available on every card; missed directions require pre-flip writing until mastery; Mandatory Response controls enforcement | Demo requires all cards to have writing. New Active Recall toggle must open/close existing workspace, not rewrite requirement semantics |
| Written answers | Pre-flip p, post-rating w, skipped k, optional confidence c saved in direction history, last 50 ratings; prior answers hidden until flip | Demo stores temporary drafts only; retain full answer history and privacy-before-reveal |
| Rating | good goes through finishCard; hard/again open reinforcement; >=20 chars when enforcement on, explicit existing confirmation when off | New Next Card popup routes to existing chooseRating and finishCard, never straight to rate or session advance |
| Session | 50 distinct cards, saved same-day position, active-time accounting, optional missed second pass, persisted reinforcement picks | Demo cycles five cards; no completion trial popup in real study |
| Previous/undo | Restores exact prior direction schedule/history, writing status, session queue/results and confidence insertion state | Preserve previousCard unchanged |
| Notes/bookmarks | Notes shared by card ID; additive auto-save; destructive edits require Save/Discard; bookmarks do not flip or schedule | Restyle and relabel entry points; preserve save rules and tab accessibility |
| Reporting | Existing FormSubmit report includes actual card/direction and optional reporter reply address; delivery activation external | Keep sendReport and endpoint unchanged; mock delivery in tests, do not send real reports |
| Persistence/sync | Local/account keys, merge-on-login, whole-copy push after changes, minute-limited pull outside sessions | Preserve schema, user ownership and sync. Known concurrent-device whole-copy limitation is out of scope |
| Confidence/modes | Optional 1-10 confidence and calibration; mode changes take effect next card with independent reverse scheduling | Keep confidence control and accessible mode semantics; do not copy demo shuffle |
| Reinforcement | After hard/again: post-rating writing. At session end: saved ungraded reinforcement and optional one-time missed-card retry | Preserve both; prototype lacks them |
| Graphics | 13 new-ID draft graphical cards, none published. Existing figure rendering and text alternatives | Restyle containing surface only, test drafts and simulated publication |
| Community | No community code or schema in repository; backend metadata checked separately | Clearly state unavailable; do not create fake posting, persistence, accounts or moderation |
| Tests | Card data protection, metadata/graphics, scheduler parity, Node behavior, browser responsive/accessibility/persistence, visual hashes/styles/screenshots | Run existing suites. Only adapt assertions tied to explicitly authorized presentation/interaction changes; preserve behavioral coverage |

Implementation approach: keep learning, scheduling, session, undo, history, persistence, reporting and account functions unchanged; add presentation CSS and a rating/availability dialog adapter. Accessibility includes labels, selected states, focus management, Tab containment, Escape/backdrop dismiss and reduced motion. Old visual baselines are retained until the new design is validated; explicitly authorized V24 visual baselines may be updated with an approval record, without changing content baselines.
