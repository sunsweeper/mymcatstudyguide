# Project 2 audit — styling-only revision

Authority: the latest Project 2 request explicitly limits changes to presentation. It supersedes the earlier request for a new rating popup and toggle interaction. The earlier interaction-changing preview is withdrawn from the final candidate.

Starting point: tested Project 1 commit 08a3b86b19cf8d07bbeaef53be129941b274b407, including screen URLs and login trial removal. Branch: feature/v24-study-redesign. Production remains on this Project 1 base.

Read docs/SCHEDULING.md, docs/package-2/MASTERY_CRITERIA.md, docs/package-2/INTERFACE-UPDATE.md, docs/KNOWN_LIMITATIONS.md, the application source and existing regression/interface tests. The V24 design source is the supplied MCAT_V24_Work_Handoff_2026-10-26.zip; its homepage file has a V23 review-only filename. The approved deployed homepage was also used as the visual reference.

Before applying the CSS-only revision, all 19 original suites and three content/metadata/graphics checks were run against the exact Project 1 source. Eighteen suites passed. The existing interface-browser suite reported 112 passes and one failure because its HTTP fixture returns HTML for script URLs, producing two Unexpected token '<' errors. This baseline failure was reported before proceeding and has not been fixed. Original visual regression passed.

## Existing behavior retained
- FSRS-5, 90% target recall, maximum 180 days, test-date cap, per-direction schedules, same-day and early-review safeguards are unchanged.
- Mastery evidence thresholds, confidence calculations, confidence insertions and celebrations are unchanged.
- Active Recall remains the original action that opens My Written Answers. Missed directions retain pre-flip writing until mastery; Mandatory Response retains the original enforcement/skip-confirmation behavior. Post-rating reinforcement retains its 20-character threshold.
- Pre-flip p, post-rating w, skip k and confidence c history fields, history limits and hiding of saved notes/answers before reveal are unchanged.
- All three inline rating buttons appear immediately after the original reveal. Got it advances immediately; Struggled/Didn't know retain their writing step. No new popup or Next Card interaction is introduced.
- Session queues, 50-card length, same-day resume, timer rules, optional missed second try, saved ungraded reinforcement and completion remain unchanged.
- Previous Card restores the original prior schedule, history, session state and draft. Bookmarks, shared notes, auto-save/Save/Discard rules and reporting are unchanged.
- Local/account keys, whole-copy sync requests, merge behavior, user ownership, authentication and all routes are unchanged.
- All 1,000 active card texts/IDs and 257 reverse definitions are untouched. All 13 graphical drafts remain unpublished; SVG content and text alternatives are unchanged.
- Existing loading, error, modal, focus, keyboard and screen-reader behavior remain accessible through exactly the same markup and event handlers.

## Visual mapping and limits
| V24 visual element | Existing control/surface | CSS-only treatment |
|---|---|---|
| Cream card, soft edges and depth | #card | Cream surface, forest ink, softer border, radius and shadow |
| Refined question/answer presentation | Existing .face, .asked, .ans | Color and text alignment; original content, font resources and geometry contracts retained |
| Face label | Existing .side | Rose color; original upper-left cursive placement retained because original tests require it |
| Bookmark star | Existing bookmark button and .bm-g | Decorative CSS star mask and selected colors; button action, accessible name and top-right position retained |
| Category and ID | Existing card footer | Forest typography; footer placement retained because original tests require it |
| Green/rose controls | Existing reveal, recall, previous and rating buttons | Backgrounds, borders, radii, shadows and spacing only |
| Rating interface | Existing #rateRow | Cream panel with forest/rose buttons; original inline appearance and submission sequence retained |
| Active Recall | Original #recallBtn | Button styling only; not converted into a new on/off interaction |
| Written answers and notes | Existing #ws and tabs | Forest panels, cream fields, readable labels and focus styling |
| Reinforcement and missed-card screens | Existing #screen states | CSS :has selectors target existing controls; no state or markup changes |
| Bookmarks and notes lists | Existing list tabs and rows | Matching forest surfaces and rose accents |
| Existing confirmations | Existing note/ask modals | Cream/forest visual treatment; no modal logic changes |
| Responsive layout | Existing DOM and controls | CSS spacing/target sizing; original control order and visibility are retained |

No Raise Your Hand control is added: it does not exist in the baseline and would introduce a new interaction. Read-only metadata inspection found only profiles, progress and activity tables and no deployed Supabase edge functions; community posting/search/moderation was not found. Nothing was built or claimed as a community backend.

The final application diff is a single style block. Removing that block reproduces the entire Project 1 index.html exactly. All JavaScript, markup outside the style block, controls, handlers, tests, CI settings, approved website files and visual baselines are unchanged.
