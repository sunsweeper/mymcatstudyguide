# Package 2 · Phase 3 release — confidence assessment

## 3.1 Pre-reveal confidence scale

- **Wording and placement:** "How confident are you in your answer?" sits under the card, above Reveal Answer, on the question side only. It's outside the card, so the card's design is unchanged.
- **The scale:** ten numbered choices, **1–10**, shaded **red (1) to green (10)**, with "1 = not confident" and "10 = very confident" under the ends.
- **No preselected value:** a native slider always starts on some value, so the scale is built as a row of buttons with nothing selected. It's marked "Optional", and tapping the chosen number again clears it.
- **When it's recorded:** before the reveal. Once the answer is showing, the scale is hidden and locked.
- **Where it's saved:** with that rating, as `c` (1–10) on the history entry. Every attempt keeps its own value. It survives a refresh before the reveal (part of the session draft).
- **Keyboard and screen readers:** a radio group with arrow keys, Home / End and Enter / Space, plus visible focus.
- **No effect on scheduling or mastery.** Confidence is never treated as correctness.

## 3.2 Calibration

- **Where:** a **Confidence check** section at the end of **My Weaknesses**, shown after 10 or more cards have a confidence rating.
- **The table:** for each band (Low 1–3, Middle 4–7, High 8–10), how often she then rated herself Got it or Didn't know.
- **Surprises:** felt sure (8–10) but didn't know it, and felt unsure (1–3) but knew it. These are counts with a non-judgmental line.
- **Trend:** after 40 or more ratings, whether confidence and ratings have lined up more or less closely lately. It compares the average gap between scaled confidence and her rating score, earlier half against recent half.
- **Labeling:** it says plainly that this compares confidence with her own self-ratings, not graded answers. Graded practice questions don't exist yet; when they do, they should be reported separately.

## Data changes and rollback

- **Data:** one optional field, `c`, on history entries, plus `c` in the session draft. No database change.
- **Rollback:** revert this commit or promote the previous deployment. Older builds ignore `c`.

## Tests

| Suite | Result |
|---|---|
| `tests/phase3-confidence.test.js` | 15 / 15 passed |
| `tests/phase3-browser.test.js` (Chromium) | 9 / 9 passed |
| All other logic suites | 445 passed |
| Browser suites | 113 + 16 + 17 + 48 + 25 + 29 passed |
| Layout audit | 0 findings |

## Protection

Card text unchanged (`check-cards`), and `visual-check` passes with no baseline change.
