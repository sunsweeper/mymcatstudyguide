# PR #5: approved visual expectations, protected study behavior

This reconciliation follows Aaron's explicit request to update legitimate visual expectations after checking the operational cards against the live homepage. It does not authorize a production release. PR #5 remains a draft for personal appearance review.

## Failure classification

| Failure before reconciliation | Classification | Resolution |
|---|---|---|
| Card Protection: 202 computed-style / screenshot differences | Intentional visual change, with genuine visual mismatches found during comparison | Correct question weight, label line height, border, shadow and base height; record the verified new reference and style expectations |
| Interface C1–C4: 70 assertions requiring the old cursive/left label, right bookmark, bottom taxonomy and old spacing | Intentional visual change | Replace with centered-label, upper-left usable bookmark, separated upper-right taxonomy, retained question context and no-overlap assertions; C5–C7 still protect centering/overflow/wrapping |
| Occasional C5 while flip/font layout was settling | Test synchronization issue | Wait for fonts and the real animation completion rather than guessing elapsed time; keep the centering assertion |
| H9: Unexpected token '<' when loading JavaScript | Unrelated pre-existing harness issue, reproduced before redesign | The old miniature server returned HTML for `/app-router.js`. Use the existing asset-aware preview server and retain the zero-JavaScript-errors assertion |
| Intermittent RF1 refresh assertion | Harness mismatch/timing issue | Use a mocked signed-in session with the real router, wait for field focus before keyboard typing, then refresh the actual study URL and assert identical card/side/written text |
| Initial browser phase 1 timeout | Timing-sensitive prior test run, not reproduced by full suite | Retained the scheduling test unchanged; full run passes |

No genuine learning-engine regression was found in the completed tests. This is not a claim of live-account or real-device verification.

## Direct visual verification

The comparison source was checked byte-for-byte against the current live homepage, excluding Vercel's injected feedback script. The homepage is not modified. A new browser test renders both the homepage demo and the actual operational deck at 360, 390, 768 and 1440px, comparing equal content/available card width. Its 117 assertions cover card background/ink, border/shadow/radius, padding and base height; question and answer font family, weight, size, line height, color and alignment; face label styling/position; real flip, retained question context, inline ratings and page overflow.

The card base is now 315px tall with no added border/shadow, matching the demo; long content expands naturally. Question weight is 700, answer weight 400 and label line height 1.65. A CSS grid lets long taxonomy wrap above the face label rather than collide with it. The outlined bookmark retains its existing saved/unsaved affordance and accessible name. The application keeps its extra question context, confidence, writing, notes/report controls and inline ratings rather than copying the demo's simplified workflow. Page-shell widths and metadata text can differ; comparison uses equal available width. Existing flip animation and reduced-motion logic remain unchanged.

## Protections retained and strengthened

- Original 1,000-card baseline, IDs, content corrections and 2,514 side-markup hashes are unchanged.
- All application scripts and markup outside the scoped CSS are identical to approved production `0fcd48b`. FSRS, mastery, session selection, mandatory writing, reinforcement, notes/bookmarks, auth, Supabase sync, storage formats and routing code are unchanged.
- Visual protection still compares every rendered side, four computed-style sets and 16 screenshots. The 0.15 pixel threshold and 0.5% maximum pixel difference are unchanged. Font loading is awaited to avoid capturing fallback-font layout.
- The updated visual reference and approval log document this explicit request. This approval concerns the test reference, not permission to release the appearance to production.
- The Card Protection workflow keeps every existing content, metadata, graphics, website, contact, routing and visual gate. It now additionally runs all 20 regression suites, including scheduling, writing, reinforcement, auth and persistence fixtures. No `continue-on-error`, skipped gate or altered success condition was introduced.
- Deliberate unauthorized wording and color changes in a separate scratch copy are rejected by the original content guard and by both computed-style and pixel comparisons. No test mutation touches the working application or production.

## Local results

- Full runner: **20/20 suites passed**, including 113 interface assertions, H9 and RF1; 117 direct design assertions; 3,000-history scheduler parity; website/auth/routing/contact and all study phases.
- Visual guard: **2,514 card sides, four style sets and 16 screenshots passed**.
- Supplemental mocked study workflows: **70 checks** across phone/tablet/desktop.
- Supplemental actual shortest/longest question and longest answer fields: **22 checks**; no overflow or JavaScript errors, usable bookmark targets, centered labels.
- Original card, metadata and graphics validation / configured production build commands pass. Existing metadata still flags 98 cards for expert content review; no content was edited. Thirteen graphics remain unpublished drafts.
- Source-integrity audit passes. No lint script is configured.

All browser writes and report delivery in automated tests are mocked. Real-account login, real Supabase writes/cross-device sync, report delivery, physical devices, Safari/Firefox and human screen-reader use remain unverified. The preview retains the existing login and Supabase configuration so the owner can inspect it using a test account. No test account was created and no production data, schema, auth configuration or environment variable was changed.
