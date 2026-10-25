# Package 2 · Phase 7 release — Final 21: Exam Readiness Mode

## 7.1 Activation

- **When it's offered:** from **21 calendar days** before the MCAT through the day before, an offer card appears on the home page. It reads: "Final 21: Exam Readiness Mode … Nothing in your history or schedule is reset, and you can turn it off anytime." The choices are **Turn on Final 21** and **No thanks**.
- **The choice is tied to the MCAT date:** a new date inside the window asks again. Declining leaves only a quiet "Final 21 is off · Turn on Final 21" line.
- **Alongside normal scheduling:** FSRS, due dates, mastery and history are untouched. Turning it on or off changes nothing about any card.
- **Rescheduling:** moving the MCAT beyond the window turns it off by itself, and today's Final 21 session is dropped so priorities are rebuilt. Normal scheduling simply continues.

## 7.2 Stages

| Days left | Stage | Today's review favors |
|---|---|---|
| 21–15 | Find the gaps | High-priority **unseen** cards (about 40%), missed cards in weak subtopics (about 30%), other missed cards |
| 14–8 | Fix what keeps slipping | **Repeated misses** (about 30%), **weak prerequisites** (about 15%), **harder conceptual / application / reasoning** or difficulty-3 cards (about 25%), missed cards |
| 7–4 | Lock it in | **Retention checks** on provisionally mastered and mastered cards (weakest memory first), weak subtopics, "needs attention" cards |
| 3–1 | Light, high-value review | "Needs attention", missed and developing cards. The session is **25 cards at most**, and due reviews can fill only 60% of it so a backlog can't swamp it |

**In every stage:**
- Due reviews come first.
- About 10% are mastered-card checks.
- At most 3 cards per concept, and never both cards of a near-duplicate pair.
- Interleaving follows Phase 5.

**Why it adapts:** priorities come from the student's own history (Phase 4 statuses, misses, mastery). There are no card quotas or "N cards a day" targets.

**Skill types:** the embedded concept index now also carries each card's cognitive skill and difficulty (from Package 1), to find the harder application questions.

## 7.3 Estimated Readiness Readout

Shown on the home page while Final 21 is on:
- **Curriculum covered:** in words ("most of it"), weighted by curriculum weight, with the concept count.
- **Concepts (nearly) mastered:** every studied card for the concept is provisionally mastered or mastered.
- **Holding up after a day+:** last 14 days, self-rated.
- **Significant gaps:** persistent or emerging subtopics, named.
- **Important material not seen yet:** heavily tested subtopics with no cards seen, named.
- **Overdue reviews.**
- **How clear the picture is:** the overall thermometer stage from Phase 4.

It's labeled: "An estimate from your study so far (your own ratings and review spacing). It is not an MCAT score prediction." No score or percentile is shown.

## 7.4 Today's session

**Begin Today's Final 21 Review** opens a "Final 21 review" session built as above.
- **Recalculation:** it's rebuilt each day, and whenever the MCAT date changes.
- **Practice rule:** as in Phase 5, a Got it on a card that isn't due yet doesn't move its schedule. A miss counts.

## Data changes and rollback

- **Data:** `final21` (`{ on, date, at }`) in progress and `open.f21` for the day's session. The embedded index gains two numbers per card (skill, difficulty) and still matches `metadata/`. No database change.
- **Rollback:** revert this commit or promote the previous deployment.

## Tests

| Suite | Result |
|---|---|
| `tests/phase7-final21.test.js` | 25 / 25 passed |
| `tests/phase7-browser.test.js` | 13 / 13 passed, at 360 and 1280 px |
| All other logic suites | 540 total passed |
| Browser suites | Pass |
| Layout audit, including offer and on states | 0 findings |
