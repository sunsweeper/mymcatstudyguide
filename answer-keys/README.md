# Answer keys (draft for review)

Layer 1 of answer checking: a forgiving key-concept match. Spelling, grammar, word order and punctuation don't count against the student.

- `src/keys00.txt` … `keys07.txt`: one line per card direction, written by hand from each card's answer.
  `ID: concept ; concept` means every concept is required. `a / b / c` lists acceptable phrasings of one concept. `ID~r` is the reverse direction.
- `match.js`: the matcher. It allows small typos, scaled by word length; numbers, symbols and short abbreviations must match exactly.
- `build.js`: compiles `keys.json` and checks it. Every card direction must have a key, and every card's own answer must pass its own key.
- `keys.json`: the compiled output. `confirmByAI` lists 146 comparison cards ("A vs. B", "differ", directional effects), where a full word match still goes to the AI layer, because word matching can't tell which side a term belongs to.

Verdicts: `right` (every concept found), `wrong` (blank, or a very short answer with no concept), `unsure` (everything else, sent to the AI layer).

Current status: 1,257 keys covering 1,000 cards plus 257 reverse sides. All 1,257 card answers pass their own key. Against other cards' answers from the same section, 2.3% falsely pass, mostly long answers that happen to contain a key term. Not yet connected to the study app. Keys need human scientific review, like the cards themselves.
