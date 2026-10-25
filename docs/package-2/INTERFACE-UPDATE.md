# Flashcard interface update — revised instructions (Oct 25, 2026)

This revises "Complete Flashcard Interface Update — Developer Instructions" with Aaron's decisions of Oct 25. Where the two differ, this document wins. **Change the layout, not the brand:** existing colors, fonts, themes and design language stay; the mockup is for positions only.

## Card (Changes 1–7, 17): as in the original document
- **Card header:** a centered Question/Answer label, with Bookmark at the right (same size and style).
- **Answer side:** the repeated question sits about 0.25 in below the header, slightly larger, but still secondary to the answer. The answer is centered in the remaining space.
- **Card footer:** the category at the lower left and the card ID at the lower right, with the same type as today. IDs are unchanged.
- **Under the card, one row:** "Write Card Note" at the left, "Report this card" at the right.
  - The Write Card Note icon is a small line-drawn **pencil** in the same size and style as the flag, so neither stands out. It is not an emoji.
  - The large Write Card Note button is removed.
- **What's on the MCAT?** becomes a plain text link: the same font as the switch labels, regular weight, slightly larger (about 15–16 px). It still opens the PDF in a new tab.

## Writing workspace (Changes 9–16, revised)
- **Layout:**
  - It is the same box as today's writing box, the same size and in the same place, with two tabs on its top-right edge: **Notes** and **My Written Answers**.
  - On desktop, My Written Answers splits that same box in two: **Current Answer** (left, editable) and **Previous Answers** (right, read-only, newest first, dated, scrolls inside).
  - On phones the two parts stack.
  - It is visible on every card.
- **Hidden until the card flips, on every card:**
  - Before the answer is revealed, a saved note and previous answers are covered by an opaque panel: "Your note appears after you reveal the card." / "Your previous answers appear after you reveal the card."
  - The hidden text is not in the page at all, so screen readers and inspecting the page can't reveal it.
  - Both appear when the card flips.
  - If the card has no note yet, she can start one before revealing.
- **Default tab:** Notes. The workspace switches to **My Written Answers** when writing is required: before the flip on a card that needs it, or after Struggled / Didn't know. **Active Recall** also opens My Written Answers and puts the cursor in Current Answer.
- **Saving written answers:** what she types in Current Answer is saved with that card's rating. This is a change: Active Recall text used to be thrown away.
  - Previous Answers lists everything written for that card direction that is still in its history: before-flip answers and after-rating answers.
  - History keeps the latest **50 ratings** per card direction (Aaron's choice: no database change). Older written answers drop off with them, and the tab says so.
- **Notes saving:**
  - If she only *adds* text (nothing already saved was deleted or changed), the note **saves automatically** after a short pause and when she moves on.
  - If she deleted or changed saved text, it doesn't autosave. A **Save note** link appears. If she moves to another card or leaves the session without saving, she's asked **"Save the changes to your note? Save / Discard"**.
  - Saving an empty note asks "Delete your note for this card?" first.
  - Notes never affect scheduling or mastery.
- **Old note popup:** the popup is no longer used on the card screen. My Card Notes still lists every note.

## Mandatory Response (replaces Change 12's skip rules and both existing switches)
- **Which cards:** a card direction needs a written answer before its flip **from the time it's rated Didn't know until it is Mastered**, as defined in MASTERY_CRITERIA.md. A later Didn't know starts it again.
- **After Struggled / Didn't know:** writing the answer in her own words (at least 20 characters) is required on every card, as today.
- **One switch, Mandatory Response,** sits where today's switches are and replaces both "Skip reinforcement input" and "Skip writing before flip".
  - It is **on** by default and remembered across sessions and devices.
  - If either old skip switch was on, it starts off.
- **Switch on:** Reveal stays disabled until something is typed when before-flip writing is required. Next card stays disabled until 20 characters after Struggled / Didn't know.
- **Switch off:** nothing blocks her, but leaving a card that needed writing without it shows a popup on every such card: **"You didn't type the mandatory response for this card. Continue anyway?" Yes / No**.
  - Yes moves on. The rating is saved and marked as a skipped response (`k`), and the requirement stays for next time.
  - No keeps her on the card with the cursor in Current Answer.
- **No grading:** there is no grading, matching or automatic correctness. She still compares her answer and rates herself.

## Removed
- **Keyboard shortcuts:** Space to flip and 1 / 2 / 3 to rate are gone, and the hints that mention them are updated.
  - Ordinary keyboard use stays: Tab between controls, Enter or Space on a focused button, Enter on the focused card to flip it, and Escape to close a popup.

## Unchanged
- Card wording and IDs, metadata, FSRS and its settings, the mastery criteria, the rating buttons, test-date rules, the missed-card second try, reinforcement and confidence insertions.

## Protection and approval
- The authorized card-layout changes are recorded in `protected/visual-approvals.json` (approved by Aaron Walch, Oct 25, 2026), and the visual baseline is regenerated for them only.
- Card text checks must still pass untouched.
- Rollback: promote the previous Vercel deployment. The new data fields are additive.

## Release record (Oct 25, 2026)

**Built as specified above, with these implementation details:**
- **Bookmark on phones:** on screens 480 px wide or less, the Bookmark button shows its icon only (same height, with an accessible label) so the label can stay exactly centered. Wider screens keep the full "Bookmark" button.
- **Mandatory Response switch colors:** its "on" color uses the site's pink in the dark theme. Before, an "on" switch looked the same as "off" there.
- **Focus at session start:** on the first card of a session, the cursor isn't placed in Current Answer automatically, so phones don't pop up the keyboard on arrival. On later cards that need writing, it is, as before.

**Tests:**

| Suite | Result |
|---|---|
| `tests/interface-update.test.js` (Mandatory Response, workspace, notes saving, hidden entries) | 46 / 46 passed |
| `tests/interface-browser.test.js` (positions at 360 / 390 / 440 / 768 / 1280 px, light and dark, both card sides; hidden entries not in the page; popup) | 110 / 110 passed |
| All existing logic suites, updated where they tested the removed boxes, switches and shortcuts | 437 passed |
| Existing browser suites (layout, tips, accounts, Phase 1) | 48 + 25 + 29 + 16 passed |
| Layout audit: every screen, 5 widths, light and dark | 0 findings, after the What's on the MCAT? link was made a 44 px touch target |

**Protection:**
- `check-cards`: all 1,000 protected cards unchanged.
- `validate-metadata`: valid.
- `visual-check`: it failed on the authorized markup change, as expected. The baseline was then regenerated with Aaron's approval, recorded in `protected/visual-approvals.json`, and passes.

**Also included:** a small Phase 1 fix that the previous deploy missed. A card limited by the test date now lands exactly on the limit, instead of sometimes a day earlier.

## Follow-up (Oct 25, 2026): card label

- **Label:** the Question / Answer label moved from the center to the card's **upper-left corner**, as plain cursive text with no pill border. It uses Dancing Script, the script already used for "My" in the logo, at about 34 px on desktop and 29 px on phones.
- **Card text** sits slightly lower.
- **Phone Bookmark:** the label is no longer centered, so on phones Bookmark shows its word again. The icon-only version is gone.
- **Approval and tests:** the visual baseline was regenerated with Aaron's approval (logged). Card text checks are unchanged, and all suites and the layout audit pass.
