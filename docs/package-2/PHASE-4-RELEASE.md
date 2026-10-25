# Package 2 · Phase 4 release — Weakness Dashboard rebuild

**My Weaknesses** (same button) is rebuilt. Everything on it is labeled as estimated from the student's own ratings and review spacing, not practice-question accuracy, because no graded practice questions exist yet.

## Data it uses

- **Package 1 metadata (no student data):**
  - Each card's subtopic, primary concept, curriculum weight and priority.
  - Prerequisite links between concepts.
  - These are embedded in the page as a compact index (about 45 KB), built by `node tools/build-site-index.js` from `metadata/`. Educational metadata stays separate from personal records.
- **The student's own review history:**
  - **Counted review:** the first rating of a card on a day; a Got it on a confidence insertion is skipped.
  - **Time-separated review:** a counted review at least one day after the previous one. Outcomes: Got it = 1, Struggled = 0.5, Didn't know = 0.
  - **Mastery levels:** from Phase 1.

## 4.1 / 4.4 What's measured, per subtopic

| Measure | Definition |
|---|---|
| Estimated mastery | Average of card mastery levels (Learning 0.1, Needs attention 0.35, Developing 0.45, Provisionally mastered 0.75, Mastered 1) over seen cards |
| Retention across sessions | Share of time-separated reviews that held up |
| Recent vs. earlier | With 6 or more time-separated reviews: the later half compared with the earlier half |
| Repeated failures | Cards with 2 or more Didn't know among their last 4 counted reviews |
| Unseen / overdue | Cards never seen; cards past their due date |
| Evidence | Per **distinct concept**: time-separated reviews ÷ 2, capped at 1 per concept |

**Why evidence is counted per concept:** drilling near-identical cards on one concept adds at most 1 evidence unit, however many times they're reviewed (test D4).

**Status, the first rule that applies:**

| Status | Rule |
|---|---|
| Not studied | No card seen |
| Insufficient evidence | Fewer than 3 time-separated reviews, or evidence < 1.5 concepts |
| Persistent weakness | Holds up < 60%, at least 6 time-separated reviews, and repeated misses on 2 or more distinct concepts |
| Improving | The later half is at least 20 points better than the earlier half, and at least 60% |
| Emerging weakness | Holds up < 75% |
| Strong | Estimated mastery ≥ 0.7 and holds up ≥ 85% |
| Developing | Everything else |

**Category level:**
- **Weak:** only when the evidence spans more than a card or two. That means 2 or more weak subtopics, or a persistent subtopic with misses across 3 or more concepts.
- **Other statuses:** "Insufficient evidence" if every studied subtopic is; Improving / Strong / Developing otherwise.

**Section level:** sections show counts ("2 weak · 5 strong · 8 need more evidence") instead of one label, so a whole section is never called weak because of one category.

## 4.2 / 4.3 Assessment Confidence Thermometer ("How clear is the picture?")

- **What it measures:** evidence, not ability. There's one per section, plus an overall one weighted by each section's concept count.
- **Fill:** evidence units ÷ max(10, 60% of the section's concepts with cards), shown as **5 stages** with no percentage: Just getting started, Early picture, Taking shape, Fairly clear, Clear picture.
- **Display:** filled segments run red to green. Screen readers hear "Bio/Biochem: Taking shape".
- **Wording:** it shows the suggested supporting text, and says it's separate from the 1–10 confidence ratings.
- **Not a statistic:** it isn't presented as a statistical confidence level.
- **No fixed quota:** the dashboard works from the first card, and the picture gets clearer as evidence accumulates.
- **Practice questions:** practice-question evidence will be added to the same evidence count when practice questions exist.

## 4.5 Prioritization

Score per subtopic, top 5 shown. The formula is in `dashModel()` in `index.html`. Its parts:
- weakness (1 − estimated mastery), weighted by how much evidence there is;
- repeated failures;
- overdue cards;
- curriculum weight;
- unseen cards, scaled by **time pressure** (MCAT in 3 weeks or less = 1; 8 weeks or less = 0.7; later or no date = 0.4);
- recent deterioration (adds) or improvement (subtracts).

Strong subtopics with nothing overdue are down-weighted. Unseen subtopics enter the list only when the MCAT is within 8 weeks. The unit is the **subtopic**, so items are specific (for example "Fluids", "Vision") rather than whole categories.

## 4.6 Recommendations

Each priority lists its reasons in plain words and links straight into a session:

| Link | What it opens |
|---|---|
| Review missed cards (N) | Cards last rated Struggled / Didn't know |
| Study overdue cards (N) | Cards past their due date |
| Practice this subtopic (N cards) | All of its cards |
| Revisit prerequisite: *concept* (N) | Only when that prerequisite concept has cards elsewhere |

Every link is built from real card IDs. An action with no cards isn't shown.

- **Study My Top Priorities** combines the top three, missed and overdue cards first.
- **How these sessions run:** they're a new "Focus review" session type, ordered like Weakest topics: missed first, then struggled, then known, then unseen. Normal rating rules apply.

## 4.7 Progress presentation

- **Tiles:**
  - cards mastered (with "almost there", meaning provisionally mastered);
  - MCAT concepts covered;
  - "held up after a day+" over the last 14 days, with its trend against the 14 days before;
  - cards due now and overdue.
- **Activity line:** sessions, card reviews and time studied stay on the dashboard, noted as reference rather than proficiency. Total Sessions Logged and Total Time Logged also stay on the home page.

## Kept from before

- Phase 3's Confidence check sits at the bottom.
- Old "Weakest topics" sessions still resume. The home page and session types are otherwise unchanged.

## Data changes and rollback

- **Data:** `open.focus` holds the focus session (card list and label), like other session types. No database change.
- **Rollback:** revert the commit or promote the previous deployment.

## Limitations

- **Self-ratings and spacing only:** all of this estimates from self-ratings and spacing. Thresholds are reasoned defaults, not fitted to real outcomes, because no aggregate student data is available by design. They should be revisited if practice-question data arrives.
- **Unreviewed classifications:** the concept classification of 98 cards is flagged for expert review (Package 1), so subtopic placement for those cards may change.

## Tests

| Suite | Result |
|---|---|
| `tests/phase4-dashboard.test.js` | 22 / 22 passed |
| `tests/phase4-browser.test.js` | 13 / 13 passed at 360 / 390 / 768 / 1280 px |
| Other logic suites | Pass, with the old weakness tests rewritten |
| Browser suites and layout audit | See commit |
