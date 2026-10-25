# Card metadata — field reference

`metadata/cards.json` holds one record per existing card. Records describe the card, never a student.

| Field | Meaning | How it was set |
|---|---|---|
| `card_id` | The card's existing, permanent ID (e.g. `1A-005`) | Copied; never changes |
| `mcat_section` | `BB`, `CP`, `PS`, `CARS`, or `SIRS` (research skills, tested in all three science sections) | From the card ID |
| `content_category` / `content_category_name` | AAMC content category (e.g. `1A`); `C0`–`C3` are CARS, `S3`/`S4` are research skills | From the card ID |
| `primary_concept_id` | The main concept tested | AI-proposed, AI-reviewed; uncertain ones flagged |
| `secondary_concept_ids` | Other concepts the card genuinely tests | AI review |
| `subtopic_ids` | Outline subtopics of those concepts | Derived from the catalog |
| `cognitive_skill` | `retrieval`, `conceptual_understanding`, `application`, or `reasoning` | Provisional heuristic from the question wording |
| `retrieval_format` | `text_recall_question_first`; plus `reverse_recall_answer_first` when the card has a reverse side | From the card data |
| `difficulty_level` | 1 (easier) to 3 (harder), provisional | Heuristic; to be replaced by student performance data |
| `curriculum_priority` / `curriculum_weight_pct` / `curriculum_priority_basis` | high / medium / low, from AAMC's published section weights | See the basis text in each record |
| `prerequisite_concept_ids` | Concepts needed first | From the curated prerequisite graph |
| `related_card_ids` | Up to 10 related cards, closest first | From `card_relations.json` |
| `concept_links` | All card-to-concept links with `role` (`primary`, `secondary`, `prerequisite`, `related_not_assessed`) and `confidence` | Combined from the above |
| `content_version` / `content_hash` | Which version of the card text this metadata describes (`cards-v1`) and its SHA-256 | Computed; validation fails if the card text no longer matches |
| `metadata_version` | Version of this metadata (`1.0.0`) | Bumped when metadata changes |
| `review_status` / `review_notes` | `ai_classified_and_reviewed` or `flagged_for_review`, with the reason | AI review |
| `classified_by` / `classified_on` | Who/what classified it, and when | — |

## Avoiding double-counting

One answer to one card is one piece of evidence. Secondary and prerequisite links say what else the card touches; they must not be counted as separate mastery demonstrations. Near-duplicate and same-fact pairs in `card_relations.json` should be treated as overlapping evidence when estimating concept mastery.

## Other files

- `metadata/concepts.json`: sections, content categories (with AAMC weights), subtopics, concepts and subconcepts. Each concept has an ID, name, section(s), category(ies), parent, related concepts, prerequisites and source.
- `metadata/prerequisites.json`: `prerequisite_concept_id → dependent_concept_id`, with the reason; all `proposed` until an expert reviews them.
- `metadata/card_relations.json`: card pairs with a relation type. Types: `near_duplicate`, `same_fact_different_wording`, `overlapping`, `contrast_pair`, `complementary`, `application_and_recall_of_same_concept`, `different_aspects_of_same_concept`.
