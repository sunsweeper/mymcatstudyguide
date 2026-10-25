# Package 2 · Phase 1.1 — Scheduler evaluation: fixed ladder vs FSRS

**Decision:** replace the fixed ladder with **FSRS-5 (default parameters), 90% target recall, 180-day maximum, the existing test-date cap, ±5% spread**. Keep the ladder in the code behind `RULES.scheduler` as the rollback.

**Limitation:** FSRS's *recall predictions* did **not** validate across memory models (see §4). The site therefore does **not** show predicted recall percentages to students. Mastery (Phase 1.2) needs actual delayed successes as well as FSRS memory strength.

## 1. Why a simulation, not real history

The package asks for "historical review simulations". By design no one, including the owner, can read students' review history (row-level security on `progress`). So the comparison replays simulated students through both schedulers. A simulation is only as good as its memory model. To avoid testing FSRS against its own assumptions, each comparison was run against **three different models of how students actually remember**:

| Model | What it assumes | Bias |
|---|---|---|
| **GT-EXP** | Exponential forgetting; gains from a successful review grow with the spacing (a different mathematical form from FSRS) | Neutral |
| **GT-ACTR** | ACT-R memory (Pavlik & Anderson 2005): power-law decay of every past exposure, faster decay for crammed exposures | Neutral, and the least like FSRS |
| **GT-FSRS** | FSRS's own model with each student's parameters randomly perturbed | Favors FSRS; reported separately |

Setup, applied the same way to both schedulers:
- Students and deck: 1,000 cards; studies on about 85% of days; sessions are due cards first, then new cards.
- Site rules: same-day second try for missed cards; the site's rating behavior (first sight is mostly Didn't know / Struggled); the test-date cap.
- Runs: 30 simulated students per configuration.
- Source: `tools/scheduler-eval/` (`node simulate.js`; set `EXAM=` and `SESSION=` to change the horizon and session size; `LEVELS=1` for the mastery check).

## 2. Results: main configuration (exam in 90 days, 50-card sessions)

| Model · scheduler | Cards known on exam day | Recall of cards seen | Cards introduced | Reviews | Known per 100 reviews |
|---|---|---|---|---|---|
| GT-EXP · ladder | 266.8 | 0.959 | 278 | 4,713 | 5.66 |
| GT-EXP · **FSRS 0.90** | **291.1** (+9%) | 0.931 | 312 | 5,066 | 5.75 |
| GT-ACTR · ladder | 158.7 | 0.833 | 190 | 4,905 | 3.24 |
| GT-ACTR · **FSRS 0.90** | **188.6** (+19%) | 0.795 | 236 | 5,151 | 3.66 |
| GT-FSRS · ladder | 341.6 | 0.976 | 350 | 4,261 | 8.02 |
| GT-FSRS · **FSRS 0.90** | **487.2** (+43%) | 0.964 | 504 | 4,489 | 10.85 |

Lower targets (0.85, 0.80) helped under GT-ACTR and GT-FSRS but **hurt under GT-EXP** (276 and 257 known). 0.90 is the only target that beat the ladder under all three models.

## 3. Robustness: does the win depend on the setup?

Cards known on exam day, ladder → FSRS 0.90:

| Exam in · session | GT-EXP | GT-ACTR | GT-FSRS |
|---|---|---|---|
| 45 days · 50 | 158.9 → 173.9 (+9%) | 105.6 → 127.6 (+21%) | 215.9 → 299.5 (+39%) |
| 90 days · 50 | 266.8 → 291.1 (+9%) | 158.7 → 188.6 (+19%) | 341.6 → 487.2 (+43%) |
| 180 days · 50 | 454.8 → 496.2 (+9%) | 238.2 → 283.5 (+19%) | 558.9 → 803.7 (+44%) |
| 90 days · 25 | 134.3 → 143.8 (+7%) | 80.3 → 96.3 (+20%) | 172.6 → 247.3 (+43%) |
| 90 days · 100 | 534.4 → 581.7 (+9%) | 315.0 → 376.1 (+19%) | 680.6 → 932.8 (+37%) |

FSRS won in **15 of 15** configurations. The two neutral models give the honest range, about **+7% to +21%**. The +40% figures assume students' memory works the way FSRS assumes, so they are not the expected result.

**What FSRS costs:**
- **Reviews:** 5–8% more in total. Each student introduces more new cards, because confidently known cards stop taking up session slots.
- **Recall of the cards a student has seen:** 1–4 points lower, because more cards are in rotation at a 90% target. The measure that matters, cards known on exam day, is higher in every case.
- **Efficiency:** known cards per review is higher in every case, but only slightly under GT-EXP (+1.6%).

**How FSRS meets the Phase 1.1 requirements:**
- **Difficult or forgotten cards come back sooner:** each card's difficulty and its misses lower its memory strength.
- **No credit for immediate repeats:** only the first rating of a day counts, so repeating a card the same day never lengthens its interval.
- **Mastered cards still come back:** the 180-day maximum and the test-date cap guarantee periodic reviews.
- **Workload stays even:** the ±5% spread keeps reviews from bunching on one day. Peak due backlog stayed at or below the number of cards introduced.

## 4. Retention prediction: did not validate

Brier score on each review's predicted recall (lower is better), compared with always predicting the actual average:

| Model | FSRS predictions | Constant average | Verdict |
|---|---|---|---|
| GT-EXP | 0.2139 | 0.2118 | Worse than constant |
| GT-ACTR | 0.2623 | 0.2224 | Worse than constant |
| GT-FSRS | 0.1174 | 0.1187 | Slightly better |

FSRS's default parameters order cards well enough to schedule better. But its predicted probabilities are only well calibrated when memory follows FSRS's own model. Consequences for this and later phases:
- No student-facing "you'll remember this X%" numbers.
- Mastery requires real delayed successes, not FSRS memory strength alone (MASTERY_CRITERIA.md).
- Phase 4 (assessment confidence) and Phase 7 (readiness readout) must not present FSRS recall as a calibrated measurement.
- A later improvement could fit FSRS parameters to each student's own history in the browser, after they have enough reviews (roughly 1,000 or more). That would need no new data access. It is not part of this phase.

## 5. How the site implements it

- **Memory comes from history:** FSRS memory (stability, difficulty) is recomputed from each card direction's review history every time it's needed. Nothing new is stored, and it always matches the history that syncs between devices.
- **Code parity:** the site's code and the simulated code give identical results on 3,000 random histories (`tests_p1_parity.js`).
- **Ratings map to FSRS grades:** Didn't know = Again, Struggled = Hard, Got it = Good. There is no "Easy" button, and none was added.
- **Didn't know** keeps the card due today, as before. It gets one optional second try after the session, and the next session that day can show it once more.
- **Struggled** schedules at 80% of the Good interval.
- **Existing cards:** due dates stay as they are, so nothing jumps at deploy time. Their history is replayed, so the next rating is scheduled from everything she has already done.
- **Each direction is scheduled separately**, as before. A session still shows each card in only one direction.
