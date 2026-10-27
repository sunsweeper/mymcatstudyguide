# Homepage experience integrated into operational study — PR #5

This implements Aaron's expanded authorization to change presentation and interactions while preserving the original learning and persistence behavior. It supersedes the CSS-only acceptance restriction. Preview review is required before any production release.

## Inspection and comparison

The live homepage was opened and exercised at 1440, 768 and 390px. All nine Guided Tour steps were completed; Back/Exit were also tested. The walkthrough covered all three study modes, recall on/off, typing, flip in both directions, all three ratings, modal close/Escape, bookmarks, saved/edited sample notes, sample report validation, illustrative peer-question drafting, five-card completion and trial invitation/restart. These interactions affected sample data only. Inspection transcripts and screenshots are supplied with the review artifacts.

| Interaction | Original homepage demo | Operational app before integration | Integrated operational experience |
|---|---|---|---|
| Modes | Questions First / Answers First / Random Mix | Same modes, older controls | Same named toolbar controls; existing session order and next-card direction rules retained |
| Recall | Default-on switch and visible retrieval box | Active Recall button opened a workspace tab | Default-on switch and retrieval box; delegates to existing recall function and draft field |
| Required writing | Demo initially omitted real post-rating requirement | Existing pre-flip history-dependent writing and 20-character reinforcement | Existing validation retained; switch cannot bypass a required response; original Mandatory Response override/confirmation retained |
| Front/back | Centered face label, answer alone | Answer plus question context | Matching answer-only card face; question content itself unchanged |
| Flip | Initially instant switch | 170ms out + 190ms in, reduced-motion support | Same transition now demonstrated on homepage and used by real app; Enter/Space/card/button work |
| Navigation | Previous / Flip Card, then Next Card | Previous / Reveal Answer / Active Recall; reveal row disappeared | Persistent Previous / Flip Card and Next Card in demo-style layout |
| Rating | Next Card opens three-choice dialog | Inline ratings after reveal | Next Card opens dialog, connected to original `chooseRating`; exact values good/hard/again unchanged |
| Difficult rating | Originally advanced immediately in sample | Required reinforcement before advancement | Closes dialog and opens existing response field; 20-character minimum; Save response & Next Card completes original handler |
| Rating cancellation | Close, backdrop, Escape | No rating dialog | Close/backdrop/Escape cancel without a review; focus returns; stale duplicate events ignored |
| Notes | Card tool opens drawer and Save | Always-visible tabbed workspace | Card-tool drawer, Save/edit using original persistence and delete/save confirmations |
| Previous answers | Not demonstrated | Workspace tab, hidden until reveal | Drawer access; original before-reveal lock retained |
| Bookmark | Star toggle without flip | Bookmark shared across directions | Same star interaction and original card-ID ownership |
| Explanations | Memory tips inside illustrative help | Existing EXPLAIN content unused | Existing complete text or simple+why entries shown after flip; unsupported cards disabled; no generated science |
| Raise Your Hand | Illustrative sample question; tour implied real peer archive | No peer backend | Clearly labelled planned; no pretend posting; working local proposal accompanies report |
| Guided Tour | Homepage only | Tips and How to Use Me | Nine-step tour attached to actual study controls; homepage tour updated to disclose requirements/limitations |
| Completion | Five-card sample/trial invitation | Real session, missed-card retry, final three recalls | Real 50-card rules, existing optional retry and final recall remain; sample completion stays sample-only |

The homepage now also demonstrates the 20-character difficult-rating response and the same flip transition. Its tour no longer promises live peer assistance. This aligns the demonstration with real educational requirements instead of weakening the learning engine to match a simplified sample.

## Interaction implementation

`study-ui.js` adapts the existing engine-owned elements and handlers. Existing fields are moved, not cloned. Original note/writing/history/bookmark data and functions remain authoritative. `study-ui.css` supplies the toolbar, switch, recall entry, drawer, persistent navigation and rating dialog. The adapter wraps rendering and the UI-only recall entry point; it does not introduce another scheduler or persistence layer.

An optional recall switch cannot turn off engine-required writing. The existing Mandatory Response setting retains its original meaning, including explicit confirmation when skipping permitted responses. Before-flip text locks after revealing, as before. Extra tools and confidence controls remain accessible. Previous retains the original exact rating undo; changing modes retains existing session order. The tour explicitly explains these engine-governed details.

## Learning and student-data preservation

The original inline application script is unchanged from commit `13dfd503dcb760c4a9a13740f326df8be5962eb4`. Only stylesheet/script references were added to its page. Card questions/answers/IDs, scheduling calculations, FSRS parameters, mastery, stability/difficulty, selection/order, due dates, reinforcement rules, review history, storage formats/keys, auth, account ownership and Supabase synchronization code are unchanged. There are no migrations, schema changes or new progress properties.

A new protected manifest freezes 29 original learning/persistence functions plus RULES and MASTERY. Runtime tests verify critical bindings remain unchanged after the adapter loads. All three popup ratings are compared against the original engine: the resulting complete per-card scheduling/history records match exactly for identical input. Mock synchronization checks preserve student ownership. No real student or production database writes were used in testing.

## Protection and verification

Card Protection remains active and discovers every `.test.js` suite. Existing scheduling/session/auth/persistence tests remain; browser suites use actual Next Card -> rating-popup interactions instead of clicking hidden legacy controls. Existing functional assertions are retained. Visual expectations are updated only after browser workflow verification.

Visual coverage now includes 2,514 rendered sides, four style sets and **24** same-machine screenshot comparisons: the existing card-side shots plus full workspaces and rating dialogs. External UI CSS/JS are frozen beside the reference HTML; candidate assets are never reused by the reference. Pixel thresholds remain unchanged. Original content baseline, corrections and side-markup hashes remain unchanged.

Completed local checks include the 23-suite full run, 118 interaction checks across phone/tablet/desktop, 121 direct design/popup checks, 16 homepage reinforcement checks, 18 runtime/three-rating parity assertions, 29 protected function checks, all 113 interface assertions, all original scheduling/session/confidence/graphics tests, 3,000 random-history parity, 198 website checks and 54 routing checks. The additional rating-parity suite brings the CI runner to 24 suites. The source/metadata/graphics production build checks and expanded visual guard pass. The initial navigation test exposed an old recall entry point not revealing the relocated field; it was connected to the same recall switch/function and its 54 checks passed on repeat. No failure was hidden by relaxing the learning assertions.

## Incomplete features and limits

- Peer posting, answers/archive, anonymity policy, moderation, abuse controls and notifications require separate approved infrastructure. The current button explicitly says planned and does not submit anything. See the working local proposal.
- Explanations are existing authored library content, not newly generated or independently fact-checked material. Only nonempty text or complete simple+why entries are enabled. There is no invented fallback for unsupported cards. Existing expert-review flags remain.
- How to Use Me's video remains a pre-existing unavailable asset with its existing fallback.
- Real-account credential login, real report delivery, production Supabase writes/cross-device sync, physical devices, Safari/Firefox and human screen-reader use remain unverified. Auth/data tests use disposable isolated mocks; no new test account was created.
- Recall switch/drawer/tour UI state is in-memory. Existing card/session/draft/note data still uses the original persistence. Refresh restores the session and written response; the optional recall presentation defaults on, as in the homepage demo.

No merge or production deployment is authorized by these results. Use the Vercel preview for personal appearance and workflow review.
