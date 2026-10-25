# Correcting a protected card

The original 1,000 cards are protected. Routine development can't change their text, IDs or appearance:

- `tools/check-cards.js` compares every card with `protected/cards-baseline-v1.json`. Vercel runs it before every deploy, so a site with a changed card is never published. GitHub runs it on every push.
- `tools/visual-check.js` compares the rendered card interface with `protected/visual/`.
- The baseline itself is never edited; the check detects edits to it.

## Fixing a genuine factual error

Only for real errors (wrong fact, misleading wording), and only with Aaron's explicit written approval for that specific card.

1. Write down the card ID, the current text, the corrected text, the reason, and the source supporting the correction.
2. Get Aaron's approval for that exact change.
3. Change the card in the site file.
4. Add an entry to `protected/corrections.json`:
   ```json
   {
     "correction_id": "CC-0001",
     "card_id": "1A-005",
     "field": "answer",
     "old_text": "…",
     "new_text": "…",
     "new_content_hash": "<printed by: node -e \"const {readCards,cardHash}=require('./tools/card-data');const d=readCards('index.html');const c=d.CARDS.find(x=>x[3]==='1A-005');console.log(cardHash(c,d.REVERSE))\">",
     "reason": "…",
     "source": "…",
     "authorized_by": "Aaron Walch",
     "approved": true,
     "date": "YYYY-MM-DD"
   }
   ```
5. Update that card's metadata record (`content_hash`, `content_version`) and run `node tools/validate-metadata.js`.
6. If the change alters how the card looks, rerun `node tools/visual-check.js --update --approved-by "Aaron Walch" --reason "CC-0001"`.
7. Commit with the message `card-correction: CC-0001 <card ID>`.

The check accepts a changed card only when `corrections.json` has an approved entry whose `new_content_hash` matches the card exactly. Any further edit to that card fails again until it gets its own approved entry.

## Changing how cards look (not their text)

The card interface may be restyled when Aaron asks for it. After the change, update the visual baseline with `node tools/visual-check.js --update --approved-by "Aaron Walch" --reason "<what changed>"`; the approval is logged in `protected/visual-approvals.json`. The card text stays protected either way.

## New cards

New cards always get new IDs that were never used before (for example the next free number in a category, or a new prefix for graphical cards). Reusing a retired ID is not allowed. The check lists new cards as notes and doesn't block them.

## What protection doesn't block

Scheduling, performance tracking, account features and the metadata files can change freely. The checks only look at card content and the card's rendered appearance.
