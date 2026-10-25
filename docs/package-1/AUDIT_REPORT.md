# Package 1 — Metadata audit report

Generated 2026-10-25 from `metadata/cards.json`, `metadata/concepts.json`, `metadata/prerequisites.json` and `metadata/card_relations.json`. Run `node tools/validate-metadata.js` to re-check.

## Summary

| Item | Result |
|---|---|
| Flashcards in the library | 1000 |
| Cards with a metadata record | 1000 (100%) |
| Cards with a primary concept | 1000 |
| Cards classified and reviewed (AI) | 902 |
| Cards flagged for content-expert review | 98 |
| Cards with one or more secondary concepts | 178 |
| Concepts in the catalog | 754 concepts + 605 subconcepts, in 156 subtopics across 37 content categories |
| Concepts tested by at least one card | 464 of 754 |
| Prerequisite links (proposed) | 60, no circular dependencies |
| Card relationships stored | 1624 |
| Original cards unchanged | Yes — all 1000 content hashes match the protected baseline |

## How cards were classified

1. **Section and content category** come straight from each card’s existing ID (for example `1A-005` is content category 1A). These are certain.
2. **Concepts** come from the AAMC MCAT content outline (2020, the PDF in this repo). Each outline heading became a subtopic, each bullet a concept, and each sub-bullet a subconcept. CARS and the research skills (S3, S4) use the outline’s skill descriptions. `C0` (test format and pacing) is site study-strategy content, not an AAMC category.
3. **Automatic proposal:** a text-similarity match between each card and the concepts in its own content category.
4. **AI review:** every one of the 1,000 proposals was then checked card by card and corrected where needed; secondary concepts were added where the card genuinely tests more than one idea. Review changed the automatic proposal for 46% of cards, so the automatic step alone would not have been reliable.
5. **Flagging:** where the best available concept is a weak fit — usually because the AAMC outline doesn’t list that topic explicitly in the card’s category — the card is marked `flagged_for_review` with the reason. Nothing uncertain was accepted silently.

**Not yet done:** no human content expert has verified the classifications. `review_status` says `ai_classified_and_reviewed` for the rest, never `verified`.

## Cards per section

| Section | Cards |
|---|---|
| Biological and Biochemical Foundations of Living Systems (BB) | 340 |
| Critical Analysis and Reasoning Skills (CARS) | 21 |
| Chemical and Physical Foundations of Biological Systems (CP) | 300 |
| Psychological, Social, and Biological Foundations of Behavior (PS) | 300 |
| Scientific Inquiry and Reasoning Skills (tested in all three science sections) (SIRS) | 39 |

## Provisional fields

- **Cognitive skill** (heuristic from question wording; review before relying on it): retrieval 686, conceptual_understanding 274, application 25, reasoning 15
- **Difficulty** (1–3, heuristic from answer length and skill; to be replaced by student data): level 1: 496, level 2: 404, level 3: 100
- **Retrieval format:** question-first recall on all 1000 cards; reverse (answer-first) recall also on 257; no graphical or experimental-data cards exist yet.
- **Curriculum priority** uses AAMC’s published weights for each foundational concept (for example Foundational Concept 1 = 55% of the Bio/Biochem section), split evenly across that concept’s content categories, because AAMC doesn’t publish weights per category. High ≥ 12%, medium 7–12%, low < 7%.

## Duplicate and related cards

| Relationship | Pairs | Meaning |
|---|---|---|
| near_duplicate | 11 | Essentially the same question |
| same_fact_different_wording | 18 | Same fact, asked differently |
| overlapping | 63 | Substantial shared content |
| contrast_pair | 33 | Parallel cards on different facts (keep both) |
| complementary | 3 | Different aspects that pair well |
| application_and_recall_of_same_concept | 134 | One recall card and one application card on the same concept |
| different_aspects_of_same_concept | 1362 | Same primary concept, different aspect |
| exact_duplicate | 0 | Identical question and answer |

No cards were deleted, merged or changed. Exact duplicates: none. Near-duplicate and same-fact pairs (listed below) are candidates for a future decision; spaced-repetition logic should not count them as independent evidence of mastery.

### Near duplicate

- **8B-017** “What are the key conditions of Allport’s contact hypothesis?” / **8B-013** “Contact hypothesis?”
- **4B-016** “What is hydrostatic gauge pressure at depth h in a uniform liquid?” / **4B-002** “Pressure at depth in a fluid?”
- **5A-018** “When does a weak-acid buffer have pH = pKa?” / **5A-032** “A buffer has pH equal to the pKa of its weak acid. What is the ratio of conjugate base to weak acid?”
- **5E-025** “What is the first law of thermodynamics using chemistry sign conventions?” / **5E-009** “First law of thermodynamics?”
- **7A-039** “What is the Yerkes–Dodson law's general claim?” / **7A-031** “Yerkes–Dodson law?”
- **5C-011** “Size-exclusion chromatography: which elutes first?” / **5C-028** “In size-exclusion chromatography, which elutes first: a large protein or a small protein, assuming neither interacts with the beads?”
- **1A-026** “Why does proline often disrupt an alpha helix?” / **1A-006** “Which amino acid tends to break α-helices?”
- **1A-038** “How can an enzyme accelerate a reaction without changing equilibrium?” / **1A-009** “Do enzymes change ΔG or equilibrium?”
- **2A-017** “What is the principal structural role of cholesterol in animal membranes?” / **2A-001** “How does cholesterol affect membrane fluidity?”
- **4E-024** “How much parent nuclide remains after three half-lives?” / **4E-016** “Fraction left after n half-lives?”
- **1D-026** “What enzyme converts fructose-1,6-bisphosphate into fructose-6-phosphate?” / **1D-017** “Rate-limiting enzyme of gluconeogenesis?”

### Same fact different wording

- **1D-020** “Where does beta-oxidation of long-chain fatty acids mainly occur?” / **1D-010** “Where does β-oxidation occur?”
- **3B-038** “Why does surfactant prevent alveolar collapse?” / **3B-007** “Role of surfactant?”
- **4D-022** “How many decibels correspond to a tenfold rise in sound intensity?” / **4D-017** “Sound level in decibels?”
- **5A-017** “What is pOH at 25 °C when pH is 4?” / **5A-003** “Kw at 25 °C?”
- **5B-017** “What shape results from four electron groups with one lone pair?” / **5B-007** “Shape of NH3?”
- **6A-018** “How do rods differ from cones in dim light?” / **6A-006** “Rods vs. cones?”
- **6A-029** “What is the difference between absolute threshold and difference threshold?” / **6A-002** “Absolute threshold?”
- **1B-029** “What does telomerase use as its template?” / **1B-009** “Telomerase?”
- **1B-037** “Why is the genetic code called degenerate?” / **1B-014** “Wobble position?”
- **2C-017** “What is the role of cyclin-dependent kinases?” / **2C-010** “Cyclins and CDKs?”
- **2C-018** “What does p53 do after substantial DNA damage?” / **2C-002** “Role of p53?”
- **3B-035** “What triggers the Bohr effect?” / **3B-020** “What shifts the hemoglobin–O2 curve to the right?”
- **4A-017** “How does doubling speed affect kinetic energy at fixed mass?” / **4A-014** “Kinetic and gravitational potential energy?”
- **4A-028** “How is instantaneous power related to force and velocity?” / **4A-015** “Power?”
- **4D-020** “What is the critical-angle relation for n1 greater than n2?” / **4D-008** “Total internal reflection?”
- **3A-017** “Why does myelination speed axonal signaling?” / **3A-002** “Saltatory conduction?”
- **2C-020** “When does homologous recombination occur in meiosis?” / **1C-001** “When does crossing over happen?”
- **2C-022** “Why is meiosis II described as equational division?” / **1C-010** “Meiosis I vs. meiosis II: what separates?”

Detection combined text similarity with a full read of every card; similar cards that use very different words could still be missed.

## Cards flagged for review

98 cards. Full list with the proposed concept and reason: `docs/package-1/REVIEW_QUEUE.csv`. By category:

| Category | Flagged | Examples |
|---|---|---|
| 5D Biological molecules and reactions | 10 | 5D-031 What does a Fischer projection represent?; 5D-032 What distinguishes SN1 from SN2 kinetics? |
| 5C Separation and purification | 8 | 5C-022 What is a Western blot used to detect?; 5C-023 What is an ELISA commonly used to measure? |
| 9B Demographics | 8 | 9B-023 What is epidemiological transition?; 9B-024 What is the difference between incidence and  |
| 8A Self and identity | 7 | 8A-009 What is role engulfment?; 8A-016 What is self-discrepancy theory? |
| 7B Social influence on behavior | 7 | 7B-014 What is minority influence?; 7B-015 What is the lowball technique? |
| 5A Water and solutions | 6 | 5A-023 How does added nonvolatile solute affect solv; 5A-024 What does boiling-point elevation depend on f |
| 1C Heredity and genetic diversity | 5 | 1C-013 Why does mitochondrial inheritance usually fo; 1C-014 What is heteroplasmy? |
| 2B Prokaryotes and viruses | 5 | 2B-022 What is the function of bacterial restriction; 2B-023 What does CRISPR–Cas provide in many prokaryo |
| 4A Motion, forces, and energy | 5 | 4A-018 When is linear momentum conserved in a system; 4A-019 What does angular momentum conservation predi |
| 8C Social interactions | 4 | 8C-016 What is social penetration theory?; 8C-017 What does reciprocity of self-disclosure mean |
| 3B Organ systems | 4 | 3B-031 What does the P wave represent on an ECG?; 3B-032 What does the QRS complex represent on an ECG |
| 4C Electrochemistry and circuits | 4 | 4C-030 What does Faraday's law state?; 4C-031 What does Lenz's law determine? |
| 6C Emotion and stress | 3 | 6C-018 What is reappraisal as an emotion-regulation ; 6C-019 How does expressive suppression differ from r |
| 5B Molecular structure and interactions | 3 | 5B-026 What is the bond-order formula in molecular o; 5B-027 Why is O2 paramagnetic? |
| 7A Biology, personality, motivation, and disorders | 3 | 7A-040 What does learned helplessness describe?; 7A-010 Locus of control? |
| 9A Social structure and culture | 3 | 9A-016 What is a social institution?; 9A-010 Major social institutions? |
| 8B Social thinking | 3 | 8B-011 Optimism bias?; 8B-015 Primacy effect in impressions? |
| 6B Cognition, memory, and consciousness | 2 | 6B-037 What is the spacing effect?; 6B-023 Language components? |
| 4D Light, sound, and spectroscopy | 2 | 4D-003 Wave speed?; 4D-013 Photoelectric effect? |
| 7C Learning and attitude change | 2 | 7C-008 Foot-in-the-door vs. door-in-the-face?; 7C-014 Cognitive dissonance? |
| 4B Fluids and gases | 1 | 4B-027 What is an adiabatic process? |
| 4E Atoms and nuclear decay | 1 | 4E-018 What is the de Broglie wavelength of a partic |
| 10A Social inequality | 1 | 10A-010 Individual vs. institutional discrimination? |
| 1B Gene to protein | 1 | 1B-020 Frameshift mutation? |

## Concept coverage by content category

| Category | Section | Cards | Concepts in outline | Concepts tested | Coverage | AAMC weight |
|---|---|---|---|---|---|---|
| 1A Proteins and amino acids | BB | 56 | 22 | 14 | 64% | 13.75% |
| 1B Gene to protein | BB | 40 | 59 | 27 | 46% | 13.75% |
| 1C Heredity and genetic diversity | BB | 23 | 30 | 18 | 60% | 13.75% |
| 1D Bioenergetics and metabolism | BB | 43 | 42 | 29 | 69% | 13.75% |
| 2A Cells and membranes | BB | 28 | 29 | 20 | 69% | 6.67% |
| 2B Prokaryotes and viruses | BB | 31 | 28 | 18 | 64% | 6.67% |
| 2C Cell division and development | BB | 29 | 24 | 18 | 75% | 6.67% |
| 3A Nervous and endocrine systems | BB | 29 | 32 | 15 | 47% | 12.5% |
| 3B Organ systems | BB | 61 | 76 | 36 | 47% | 12.5% |
| 4A Motion, forces, and energy | CP | 29 | 21 | 14 | 67% | 8.0% |
| 4B Fluids and gases | CP | 29 | 18 | 17 | 94% | 8.0% |
| 4C Electrochemistry and circuits | CP | 32 | 19 | 15 | 79% | 8.0% |
| 4D Light, sound, and spectroscopy | CP | 29 | 29 | 18 | 62% | 8.0% |
| 4E Atoms and nuclear decay | CP | 28 | 38 | 18 | 47% | 8.0% |
| 5A Water and solutions | CP | 32 | 14 | 9 | 64% | 12.0% |
| 5B Molecular structure and interactions | CP | 29 | 13 | 11 | 85% | 12.0% |
| 5C Separation and purification | CP | 28 | 10 | 9 | 90% | 12.0% |
| 5D Biological molecules and reactions | CP | 33 | 53 | 26 | 49% | 12.0% |
| 5E Thermodynamics and kinetics | CP | 31 | 32 | 18 | 56% | 12.0% |
| 6A Sensation and perception | PS | 30 | 15 | 14 | 93% | 8.33% |
| 6B Cognition, memory, and consciousness | PS | 41 | 22 | 13 | 59% | 8.33% |
| 6C Emotion and stress | PS | 19 | 8 | 7 | 88% | 8.33% |
| 7A Biology, personality, motivation, and disorders | PS | 40 | 19 | 10 | 53% | 11.67% |
| 7B Social influence on behavior | PS | 22 | 14 | 10 | 71% | 11.67% |
| 7C Learning and attitude change | PS | 14 | 11 | 7 | 64% | 11.67% |
| 8A Self and identity | PS | 18 | 5 | 3 | 60% | 6.67% |
| 8B Social thinking | PS | 18 | 9 | 6 | 67% | 6.67% |
| 8C Social interactions | PS | 32 | 20 | 12 | 60% | 6.67% |
| 9A Social structure and culture | PS | 19 | 22 | 12 | 55% | 7.5% |
| 9B Demographics | PS | 30 | 11 | 9 | 82% | 7.5% |
| 10A Social inequality | PS | 17 | 8 | 6 | 75% | 5.0% |
| C0 Test format and pacing | CARS | 4 | 1 | 1 | 100% | — |
| C1 Foundations of comprehension | CARS | 6 | 2 | 2 | 100% | 30.0% |
| C2 Reasoning within the text | CARS | 9 | 2 | 2 | 100% | 30.0% |
| C3 Reasoning beyond the text | CARS | 2 | 2 | 1 | 50% | 40.0% |
| S3 Research design and ethics | SIRS | 21 | 7 | 6 | 86% | 10.0% |
| S4 Data and statistical reasoning | SIRS | 18 | 6 | 6 | 100% | 10.0% |

The content-expansion report (`docs/package-1/CONTENT_EXPANSION_REPORT.md`) turns these gaps into recommendations.

## Validation checks (all passing)

- Every card ID has exactly one metadata record; no records for nonexistent cards
- Every card has exactly one primary concept
- No reference to a nonexistent card, concept or subtopic
- Section and category in each record match the card ID
- Prerequisite graph: known concepts only, no self-links, no cycles
- No duplicate metadata records or duplicate concept names
- Each record’s content hash matches the current card (the original text is unchanged)
