# How the Package 1 metadata was generated

Kept for traceability; not needed to run the site or the checks.

1. `pdftotext -layout 3-2020_whats_on_the_mcat_content_outline.pdf outline.txt`, then `parse_outline.py` → `outline.json` (topics, bullets, sub-bullets per content category).
2. `node dump_cards.js index.html` → `cards.json` (reads the cards without running the site; uses `pkg1_extract.js`).
3. `build_catalog.py` → concept catalog (adds CARS and research-skill concepts from the outline's skill descriptions).
4. `classify.py` → automatic concept proposals by text similarity, limited to each card's own category.
5. `review_view.py <categories>` printed each category's candidates and proposals for review. **`decisions.txt` is the item-by-item review record**: `card:primary[,secondary…]`, indexes into that category's candidate list, `?` = flagged as uncertain, `S4.1` = a concept from another category.
6. `prerequisites.py` (curated prerequisite links) and `pair_labels.py` (reviewed duplicate/overlap labels).
7. `build_metadata.py` → `metadata/*.json`; `reports.py` → audit report, review queue, content-expansion report.
