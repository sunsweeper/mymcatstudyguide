# Baseline feature inventory

As inspected 2026-10-25 at `4bd0a7743f118c2e4f5b815373906198a3093608`. This supplements historical release notes. Implemented means source exists, not verified live service operation. Partial means a working subset or pending publication/validation. Missing means absent from this checkout, not authorization to build it.

| Feature | State | Evidence and boundary |
|---|---|---|
| Text library | Implemented | 1,000 cards, permanent IDs, five section groupings; original-content validator passes |
| Question-first/answer-first/mixed | Implemented | keysFor, resolveKey, REVERSE; reverse variants for 257 cards, not all |
| Reveal/self-rating | Implemented | reveal, chooseRating, answer, rate; good/hard/again, no automatic grading |
| Mandatory written recall | Implemented | mustWrite, memoryFrom().needs, renderWorkspace; per-direction miss-to-mastery, explicit override/skip |
| Notes and written-answer history | Implemented | Shared card notes, per-direction answers, draft restore; latest 50 ratings retained |
| Bookmarks/lists | Implemented | toggleBookmark, tabs/filters/counts |
| Optional confidence/calibration | Implemented | setConf, history c, confidenceStats; compares self-ratings, not graded accuracy |
| FSRS-5 | Implemented | History-derived stability/difficulty, 90% target, interval spread/max/test cap; parity passes |
| Legacy ladder | Implemented | RULES alternate path; not enabled here; scheduler suite includes fallback cases |
| Mastery/insertions/sparkle | Implemented | cardLevel, pickBoost, maybeCelebrate; delayed evidence, reduced motion |
| Regular/targeted/interleaved sessions | Implemented | buildQueue, buildFocus, interleave; generally 50 unique cards; targeted concept controls |
| Second try/reinforcement | Implemented | One optional retry for first-pass misses; adaptive ungraded reinforcement |
| Resume/drafts/Previous Card | Implemented | openSession, persistPlace, stashDraft, in-memory undo; same-day resume |
| Active timer/summaries | Implemented | Visible active-session time, idle threshold, bounded tick; stats and up to 500 logs |
| Weakness dashboard/focus actions | Implemented | dashModel, concept-aware evidence, prerequisites and estimated retention |
| MCAT date/countdown | Implemented | saveDate, countdownState; calendar-day countdown and review cap |
| Final 21 | Implemented | Opt-in 21-1 days before exam, staged priorities, estimated readiness |
| Email/password accounts | Implemented, live unverified | Signup/login/verification/reset; requires Supabase auth/SMTP/redirect configuration |
| Name/email changes/deletion | Implemented, live unverified | Profile updates, password recheck, confirmation links, delete RPC; no real operations tested |
| Local cache/cloud sync | Partial | Whole JSON push and login/tab-return merge; no per-write merge/CAS/deletion tombstones/durable retry |
| Owner dashboard | Implemented, live unverified | Profile/activity aggregates and online status; signup exam date may be stale; SQL intends no private-progress access |
| Export/import/undo restore | Implemented | Version-2 checks/confirmation/safety copy; origin-wide recovery key needs account-isolation review |
| Metadata/concepts/prerequisites | Partial | Valid links and embedded META; 98 flags and proposed difficulty/prerequisites need expert validation |
| Graphical cards | Partial | Renderer/SVG preview/approval validator; 13 drafts, zero published |
| Report this card | Partial | FormSubmit UI exists; external activation/delivery unverified; no report sent |
| Help video | Partial | Modal/controls/fallback exist; MP4/VTT files absent |
| Privacy/terms/consent | Implemented | Static pages and signup checkboxes; legal adequacy not assessed |
| Mobile/accessibility | Partial | Chromium layout/focus/reduced-motion checks; real devices, assistive tech, Safari/Firefox unverified |
| Content/metadata/visual protection | Implemented | Validators, references and GitHub workflow; feature suites not in CI |
| Automated feature release gate | Missing | Standalone feature tests exist; no workflow runs them or proves mandatory release checks |
| Locked reproducible test installation | Missing | Pinned direct dev dependencies but no committed lockfile; Node versions differ |
| Development branch | Implemented locally | development/baseline-audit at baseline; unpushed, no remote deployment triggered |
| Isolated staging backend | Missing from source | Hardcoded Supabase endpoint; Vercel preview alone does not isolate records |
| Append-only review events/normalized sessions | Missing (designed) | STUDENT_EVENTS_DESIGN.md and draft SQL only; no app writer/migration execution |
| Per-card duration/unlimited event history | Missing | Aggregate time exists; per-card duration not recorded, history bounded |
| Graded practice/questions/passages/tests | Missing | Existing UI covers flashcards; design reserves future practice links |
| Objective accuracy/MCAT score prediction | Missing | Readouts estimate from self-ratings; no score or percentile model |

No feature was added, removed, redesigned or enabled. This inventory records current behavior and gaps for later scoped work. See [BASELINE_AUDIT.md](BASELINE_AUDIT.md) for reuse points, risks and evidence limits.
