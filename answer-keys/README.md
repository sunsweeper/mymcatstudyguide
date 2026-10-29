# Answer keys (draft for review)

Layer 1 of answer checking: a forgiving key-concept match. Spelling, grammar, word order and punctuation don't count against the student.

- `src/keys00.txt` … `keys07.txt`: one line per card direction, written by hand from each card's answer.
  `ID: concept ; concept` means every concept is required. `a / b / c` lists acceptable phrasings of one concept. `ID~r` is the reverse direction.
- `match.js`: the matcher. It allows small typos, scaled by word length; numbers, symbols and short abbreviations must match exactly.
- `build.js`: compiles `keys.json` and checks it. Every card direction must have a key, and every card's own answer must pass its own key.
- `keys.json`: the compiled output. `confirmByAI` lists 146 comparison cards ("A vs. B", "differ", directional effects), where a full word match still goes to the AI layer, because word matching can't tell which side a term belongs to.

Verdicts: `right` (every concept found), `wrong` (blank, or a very short answer with no concept), `unsure` (everything else, sent to the AI layer).

Current status: 1,257 keys covering 1,000 cards plus 257 reverse sides. Every card's own answer contains every concept in its own key. Connected to the study app: a `right` is final, everything else goes to the AI (`/api/grade`).

## Accuracy (`node answer-keys/eval.js`, Oct 29, 2026)

A `right` from the matcher skips the AI, so the number that matters is how often a wrong answer gets `right`.

| Wrong answers graded `right` with no AI check | Before | After |
|---|---|---|
| Another card's answer from the same section | 0.86% | 0.30% |
| The card's answer with a key term flipped (increases/decreases, hyper/hypo, dominant/recessive...) | 70.6% | 9.4% |
| "Not" + the card's answer | 100% | 9.2% |

| Right answers sent to the AI anyway (cost, not a wrong grade) | Before | After |
|---|---|---|
| The card's own answer | 0.1% | 3.4% |
| The card's own answer with one typo | 0% | 3.9% |

What changed in `match.js`:
- Typo tolerance no longer bridges a different prefix: increases/decreases, hypertonic/hypotonic, afferent/efferent, mitosis/meiosis, intra/inter... (a typo in the first two letters now goes to the AI).
- A word isn't found inside its own opposite ("sympathetic" in "parasympathetic", "agonist" in "antagonist", "polar" in "nonpolar"). "non-polar" reads as "nonpolar".
- If the key asks for one side of an opposite pair and the answer names the other side, or negates a key term ("not", "isn't", "no" within 7 words before it), the answer goes to the AI.
- On a one-concept key: a tiny or generic phrasing ("a", "1", "same", "cap") only counts when it's (nearly) the whole answer, and an answer of more than 10 content words goes to the AI.
- Label letters must sit next to their word ("acid a", "cytochrome c"). "√" reads as "sqrt".

The previous 2.3% figure in this file counted keys differently; on the same measure the matcher was at 0.77% (all keys) / 0.86% (keys that can auto-pass). `tests/answer-match-accuracy.test.js` fails if these rates get worse.

Keys still need human scientific review, like the cards themselves.
