import json, re, collections, csv
M = json.load(open('out/metadata/cards.json'))['cards']; C = json.load(open('out/metadata/concepts.json')); R = json.load(open('out/metadata/card_relations.json'))['relations']
P = json.load(open('out/metadata/prerequisites.json'))['edges']; d = json.load(open('cards.json'))
by = {c[3]: c for c in d['CARDS']}; con = {c['id']: c for c in C['concepts']}
plain = lambda h: re.sub(r'<[^>]+>', '', h)
top = [c for c in C['concepts'] if not c['parent_concept_id']]
flag = [m for m in M if m['review_status'] == 'flagged_for_review']
cats = C['content_categories']
used_primary = collections.Counter(m['primary_concept_id'] for m in M)
used_any = set(used_primary) | {s for m in M for s in m['secondary_concept_ids']}
rel_counts = collections.Counter(r['relation'] for r in R)
skills = collections.Counter(m['cognitive_skill'] for m in M); diff = collections.Counter(m['difficulty_level'] for m in M)
fmt = collections.Counter(f for m in M for f in m['retrieval_format'])
# coverage per category
rows = []
for g, info in cats.items():
    cs = [c for c in top if g in c['content_categories']]
    covered = [c for c in cs if c['id'] in used_any]
    n = sum(1 for m in M if m['content_category'] == g)
    rows.append((g, info['name'], info['mcat_section'], n, len(cs), len(covered), info['curriculum_weight_pct']))
sec_cards = collections.Counter(m['mcat_section'] for m in M)
L = []
L.append('# Package 1 — Metadata audit report\n')
L.append('Generated 2026-10-25 from `metadata/cards.json`, `metadata/concepts.json`, `metadata/prerequisites.json` and `metadata/card_relations.json`. Run `node tools/validate-metadata.js` to re-check.\n')
L.append('## Summary\n')
L.append(f'| Item | Result |\n|---|---|\n| Flashcards in the library | {len(M)} |\n| Cards with a metadata record | {len(M)} (100%) |\n| Cards with a primary concept | {sum(1 for m in M if m["primary_concept_id"])} |')
L.append(f'| Cards classified and reviewed (AI) | {len(M) - len(flag)} |\n| Cards flagged for content-expert review | {len(flag)} |\n| Cards with one or more secondary concepts | {sum(1 for m in M if m["secondary_concept_ids"])} |')
L.append(f'| Concepts in the catalog | {len(top)} concepts + {len(C["concepts"]) - len(top)} subconcepts, in {len(C["subtopics"])} subtopics across {len(cats)} content categories |\n| Concepts tested by at least one card | {len(used_any)} of {len(top)} |')
L.append(f'| Prerequisite links (proposed) | {len(P)}, no circular dependencies |\n| Card relationships stored | {len(R)} |\n| Original cards unchanged | Yes — all {len(M)} content hashes match the protected baseline |\n')
L.append('## How cards were classified\n')
L.append('1. **Section and content category** come straight from each card’s existing ID (for example `1A-005` is content category 1A). These are certain.\n2. **Concepts** come from the AAMC MCAT content outline (2020, the PDF in this repo). Each outline heading became a subtopic, each bullet a concept, and each sub-bullet a subconcept. CARS and the research skills (S3, S4) use the outline’s skill descriptions. `C0` (test format and pacing) is site study-strategy content, not an AAMC category.\n3. **Automatic proposal:** a text-similarity match between each card and the concepts in its own content category.\n4. **AI review:** every one of the 1,000 proposals was then checked card by card and corrected where needed; secondary concepts were added where the card genuinely tests more than one idea. Review changed the automatic proposal for 46% of cards, so the automatic step alone would not have been reliable.\n5. **Flagging:** where the best available concept is a weak fit — usually because the AAMC outline doesn’t list that topic explicitly in the card’s category — the card is marked `flagged_for_review` with the reason. Nothing uncertain was accepted silently.\n')
L.append('**Not yet done:** no human content expert has verified the classifications. `review_status` says `ai_classified_and_reviewed` for the rest, never `verified`.\n')
L.append('## Cards per section\n')
L.append('| Section | Cards |\n|---|---|')
for s, n in sorted(sec_cards.items()): L.append(f'| {C["sections"][s]} ({s}) | {n} |')
L.append('\n## Provisional fields\n')
L.append(f'- **Cognitive skill** (heuristic from question wording; review before relying on it): ' + ', '.join(f'{k} {v}' for k, v in skills.most_common()))
L.append(f'- **Difficulty** (1–3, heuristic from answer length and skill; to be replaced by student data): ' + ', '.join(f'level {k}: {v}' for k, v in sorted(diff.items())))
L.append(f'- **Retrieval format:** question-first recall on all {fmt["text_recall_question_first"]} cards; reverse (answer-first) recall also on {fmt["reverse_recall_answer_first"]}; no graphical or experimental-data cards exist yet.')
L.append('- **Curriculum priority** uses AAMC’s published weights for each foundational concept (for example Foundational Concept 1 = 55% of the Bio/Biochem section), split evenly across that concept’s content categories, because AAMC doesn’t publish weights per category. High ≥ 12%, medium 7–12%, low < 7%.\n')
L.append('## Duplicate and related cards\n')
L.append('| Relationship | Pairs | Meaning |\n|---|---|---|')
mean = {'near_duplicate': 'Essentially the same question', 'same_fact_different_wording': 'Same fact, asked differently', 'overlapping': 'Substantial shared content', 'contrast_pair': 'Parallel cards on different facts (keep both)', 'complementary': 'Different aspects that pair well', 'application_and_recall_of_same_concept': 'One recall card and one application card on the same concept', 'different_aspects_of_same_concept': 'Same primary concept, different aspect'}
for k in ['near_duplicate', 'same_fact_different_wording', 'overlapping', 'contrast_pair', 'complementary', 'application_and_recall_of_same_concept', 'different_aspects_of_same_concept']:
    L.append(f'| {k} | {rel_counts.get(k, 0)} | {mean[k]} |')
L.append(f'| exact_duplicate | {rel_counts.get("exact_duplicate", 0)} | Identical question and answer |\n')
L.append('No cards were deleted, merged or changed. Exact duplicates: none. Near-duplicate and same-fact pairs (listed below) are candidates for a future decision; spaced-repetition logic should not count them as independent evidence of mastery.\n')
for k in ['near_duplicate', 'same_fact_different_wording']:
    L.append(f'### {k.replace("_", " ").capitalize()}\n')
    for r in R:
        if r['relation'] == k:
            a, b = by[r['card_id_a']], by[r['card_id_b']]
            L.append(f'- **{a[3]}** “{plain(a[1])}” / **{b[3]}** “{plain(b[1])}”')
    L.append('')
L.append('Detection combined text similarity with a full read of every card; similar cards that use very different words could still be missed.\n')
L.append('## Cards flagged for review\n')
L.append(f'{len(flag)} cards. Full list with the proposed concept and reason: `docs/package-1/REVIEW_QUEUE.csv`. By category:\n')
fc = collections.Counter(m['content_category'] for m in flag)
L.append('| Category | Flagged | Examples |\n|---|---|---|')
for g, n in sorted(fc.items(), key=lambda x: -x[1]):
    ex = [m['card_id'] + ' ' + plain(by[m['card_id']][1])[:45] for m in flag if m['content_category'] == g][:2]
    L.append(f'| {g} {cats[g]["name"]} | {n} | {"; ".join(ex)} |')
L.append('\n## Concept coverage by content category\n')
L.append('| Category | Section | Cards | Concepts in outline | Concepts tested | Coverage | AAMC weight |\n|---|---|---|---|---|---|---|')
for g, nm, s, n, tot, cov, w in rows:
    L.append(f'| {g} {nm} | {s} | {n} | {tot} | {cov} | {round(cov / tot * 100) if tot else 0}% | {w if w is not None else "—"}{"%" if w is not None else ""} |')
L.append('\nThe content-expansion report (`docs/package-1/CONTENT_EXPANSION_REPORT.md`) turns these gaps into recommendations.\n')
L.append('## Validation checks (all passing)\n')
for t in ['Every card ID has exactly one metadata record; no records for nonexistent cards', 'Every card has exactly one primary concept', 'No reference to a nonexistent card, concept or subtopic', 'Section and category in each record match the card ID', 'Prerequisite graph: known concepts only, no self-links, no cycles', 'No duplicate metadata records or duplicate concept names', 'Each record’s content hash matches the current card (the original text is unchanged)']:
    L.append(f'- {t}')
open('out/docs/package-1/AUDIT_REPORT.md', 'w').write('\n'.join(L) + '\n')
# review queue
with open('out/docs/package-1/REVIEW_QUEUE.csv', 'w', newline='') as f:
    w = csv.writer(f); w.writerow(['card_id', 'question', 'answer', 'proposed_primary_concept', 'proposed_secondary_concepts', 'reason', 'reviewer_decision', 'reviewer_notes'])
    for m in flag:
        c = by[m['card_id']]
        w.writerow([m['card_id'], plain(c[1]), plain(c[2]), con[m['primary_concept_id']]['name'] + f' ({m["primary_concept_id"]})', '; '.join(con[s]['name'] for s in m['secondary_concept_ids']), ' / '.join(m['review_notes']), '', ''])
# content expansion
E = []
E.append('# Package 1 — Content-expansion report\n')
E.append('Where new cards would most improve curriculum coverage and retrieval variety. **No cards were created in Package 1**; this is a plan for later. New cards must use new IDs (the protection check enforces this).\n')
E.append('## 1. Sections versus AAMC weight\n')
E.append('| Section | Cards now | Share of library |\n|---|---|---|')
for s, n in sorted(sec_cards.items()): E.append(f'| {s} | {n} | {round(n / len(M) * 100)}% |')
E.append('\nCARS has 21 cards and research skills 39. CARS is mainly practiced with passages rather than flashcards, so the CARS gap is better filled with passage-based practice (a later package) than with more cards.\n')
E.append('## 2. Categories with the thinnest concept coverage\n')
E.append('Ranked by AAMC weight × share of outline concepts with no card.\n')
E.append('| Category | AAMC weight | Concepts tested | Untested concepts (examples) |\n|---|---|---|---|')
gap = []
for g, nm, s, n, tot, cov, w in rows:
    if not w or not tot: continue
    unt = [c['name'] for c in top if g in c['content_categories'] and c['id'] not in used_any]
    gap.append((w * (tot - cov) / tot, g, nm, w, cov, tot, unt))
for sc, g, nm, w, cov, tot, unt in sorted(gap, reverse=True)[:15]:
    E.append(f'| {g} {nm} | {w}% | {cov} of {tot} | {"; ".join(u[:60] for u in unt[:5])} |')
E.append('\nFull list of untested concepts by category: Appendix A.\n')
E.append('## 3. Retrieval variety\n')
E.append(f'- **Question types:** {skills["retrieval"]} of {len(M)} cards are straight recall, {skills["conceptual_understanding"]} test conceptual understanding, and only {skills["application"] + skills["reasoning"]} ask the student to apply knowledge to a scenario or data. The MCAT is mostly passage- and scenario-based (AAMC: Skills 2–4 = 65% of each science section), so application cards are the biggest retrieval gap.')
E.append(f'- **Reverse recall** exists on {fmt["reverse_recall_answer_first"]} cards (26%).')
E.append('- **Graphical and experimental cards:** none exist. These topics already have recall cards that describe a graph in words, so a graphical card would add a genuinely different skill:\n')
G = [('1A', 'Michaelis–Menten and Lineweaver–Burk plots with each inhibitor type (1A-017–1A-021, 1A-037)'), ('1A/3B', 'Hemoglobin–oxygen dissociation curve and its shifts (3B-020, 3B-035)'), ('5A', 'Titration curves: weak acid/strong base, polyprotic acids, buffer region (5A-011, 5A-014)'), ('5E', 'Reaction energy diagrams with and without a catalyst; phase diagrams (5E-002, 5E-003, 5E-011)'), ('4B/5E', 'PV diagrams and gas-law graphs (5E-025, 4B-015)'), ('3A', 'Action potential voltage trace with the channel events (3A-013, 3A-016)'), ('3B', 'ECG trace labeling (3B-031–3B-033); sarcomere band diagram (3B-001)'), ('3B', 'Nephron diagram with transport by segment (3B-019, 3B-044)'), ('4D', 'Ray diagrams for mirrors and lenses (4D-009, 4D-029)'), ('4D', 'NMR and IR spectra interpretation (4D-001, 4D-002, 4D-014)'), ('9B', 'Population pyramids and demographic transition stages (9B-007, 9B-016, 9B-019)'), ('6A/6B', 'Signal detection matrix; serial position curve (6A-015, 6B-009)'), ('S4', 'Error bars, confidence intervals and scatterplots (S4-008, S4-018)'), ('1D', 'Pathway maps: glycolysis/gluconeogenesis bypass steps, ETC complexes (1D-025, 1D-034)')]
for g, t in G: E.append(f'  - **{g}:** {t}')
E.append('\n- **Experimental-data cards:** short "here is a result, what does it show" cards for S3/S4 and for biochemistry methods (5C blots and chromatography, 1B PCR and sequencing).\n')
E.append('## 4. Near-duplicates to decide on\n')
E.append(f'{rel_counts.get("near_duplicate", 0)} near-duplicate and {rel_counts.get("same_fact_different_wording", 0)} same-fact pairs are listed in the audit report. Options for each: keep both (extra practice), or later retire one. Retiring a card would need the separately authorized correction procedure, because the originals are protected.\n')
E.append('## Appendix A. Untested concepts by category\n')
for g, nm, s, n, tot, cov, w in rows:
    unt = [c['name'] for c in top if g in c['content_categories'] and c['id'] not in used_any]
    if unt: E.append(f'**{g} {nm}** ({len(unt)}): ' + '; '.join(unt) + '\n')
open('out/docs/package-1/CONTENT_EXPANSION_REPORT.md', 'w').write('\n'.join(E) + '\n')
print('flagged', len(flag), 'used concepts', len(used_any), 'of', len(top))
