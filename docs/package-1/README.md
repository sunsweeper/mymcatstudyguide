# Package 1 — Foundational card intelligence and content protection

What was built, where it lives, and how to check it. Nothing here changes what students see: the site doesn't load any of these files.

| Requirement | Where |
|---|---|
| 1. Existing cards preserved | No card text, ID, formatting or layout changed. Proved by `node tools/check-cards.js` and `node tools/visual-check.js`. |
| 2. Separate metadata structure | `metadata/cards.json`, one record per card, keyed by the existing card ID. Field reference: `METADATA_SCHEMA.md`. |
| 3. Concept catalog | `metadata/concepts.json`: Section → Content Category → Subtopic → Concept → Subconcept, built from the AAMC content outline in this repo. |
| 4. Card-to-concept links | `concept_links` in each card record: one primary, plus secondary, prerequisite and related-but-not-assessed links. |
| 5. Prerequisites | `metadata/prerequisites.json`: 60 curated links with a reason for each; checked for cycles. |
| 6. Duplicates and related cards | `metadata/card_relations.json`; summary in `AUDIT_REPORT.md`; future cards in `CONTENT_EXPANSION_REPORT.md`. |
| 7. Student performance data design | `STUDENT_EVENTS_DESIGN.md` and `review_events_draft.sql` (design only; nothing was run against the database). |
| 8. Classification and validation | `AUDIT_REPORT.md`, `REVIEW_QUEUE.csv` (98 cards for a content expert), `node tools/validate-metadata.js`. |
| 9. Content protection | `protected/` (baseline, corrections log, visual baseline), `tools/check-cards.js`, `tools/visual-check.js`, `CARD-CORRECTIONS.md`, the GitHub check in `.github/workflows/card-protection.yml`, and the Vercel build step in `vercel.json`. |

## Running the checks

```
node tools/check-cards.js          # original cards unchanged (no installs needed; Vercel runs this before every deploy)
node tools/validate-metadata.js    # metadata complete and consistent (no installs needed)
cd tools && npm install && npx playwright install chromium && node visual-check.js   # card interface looks the same
```

## What still needs a person

- A content expert should go through `REVIEW_QUEUE.csv` (98 cards) and spot-check the rest. Classifications are AI-proposed and AI-reviewed, not expert-verified.
- `cognitive_skill`, `difficulty_level` and the prerequisite links are provisional and say so in the data.
