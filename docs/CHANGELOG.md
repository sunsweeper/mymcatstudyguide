# Changelog: development instructions update (Oct 24, 2026)

Only `site/index.html` changed on the website. Saved progress uses the same storage key and loads as before.

## Active Recall (Change 1)
- Button row under the card is now **Previous Card | Reveal Answer | Active Recall**, with Reveal Answer centered. On phones the outer two labels wrap to two lines so all three stay on one row and inside the screen.
- **Active Recall** opens an inline box under the card ("Type what you remember...") with **Reveal Answer** and **Cancel**; the buttons below move down. Focus goes into the box. No character limit.
- Revealing keeps the box open (read-only, "Your response") so her words and the correct answer show together, then the normal Got it / Struggled / Didn't know. Exactly one rating per attempt.
- Cancel discards the text and records nothing. Moving to another card closes and clears it. It's never saved as a note.
- Only available when the question is shown first (not on reverse cards in Answers First or Random Mix). Also disabled on Writing Required cards, which already make her write first (see KNOWN_LIMITATIONS.md).

## Missed-card second try (Change 2)
- After all of a session's original cards have their first rating, if any were **Didn't know**: "Want to give the cards you had trouble with one more try?" (**Yes, Let's Try Again** / **No, Finish Session**). Not shown if nothing was missed.
- Yes: each of those cards exactly once more, in original order. No third tries. Struggled cards excluded.
- Both ratings kept in history; the second sets the next review. The card still counts once.
- The in-session repeats of Didn't know cards (4 cards later, up to 3 times) are turned off (`RULES.maxRepeats: 0`), so missed cards aren't repeated before the second try. Setting it back to 3 restores the old repeats.
- Refreshing mid-way resumes at the next unfinished second try without rebuilding the list.

## End-of-session reinforcement (Change 3)
- After the second try (or No, or no misses): **Congratulations!** with the exact text from the instructions, plus **Begin Reinforcement** / **Skip Reinforcement**.
- Three different cards picked at random from original positions 4–10, saved so a refresh doesn't change them. Short-session fallback as specified; under 3 cards, skipped.
- One question at a time: hidden answer, "Type your answer from memory...", Reveal Answer, her answer beside the correct one, Next Question. Then **Reinforcement Complete** and **Finish Session**.
- Not graded; no effect on ratings, schedules or card counts. Completed/skipped is tracked separately. Resumes mid-way, including what she'd typed.

## Card Notes popup (Change 4)
- **Write Card Note** opens a centered popup: the card's question, the note box (with any saved note), **Save Note**, **Cancel**, and **Delete note** when a note exists.
- Save closes with "Note saved."; no rating change, no advancing. Cancel or Escape asks before discarding unsaved changes. Delete asks first; saving an empty note counts as delete and asks first.
- Escape closes it; Tab stays inside; the page behind is inert (no clicks, no rating keys); focus returns to Write Card Note; tapping outside doesn't close it; scrolls on small screens and with the phone keyboard up.
- Notes no longer autosave while typing (Save Note is the save). A saved note shows under the buttons after reveal, as notes used to reappear before.

## Study timer and stop message (Change 5 and your timer spec)
- Removed the "N minutes in. This is a good place to stop" message and its code (`softMinutes`, `minutesIn`, `sessionStart`).
- **Why it said 94 minutes:** it measured wall-clock time since the session was opened (`Date.now() - sessionStart`, carried over in `elapsed`), so hidden-tab time, idle time and time on other screens all counted. The Total Time Logged counter was already active-time based and wasn't the cause.
- New per-session **Study time** under the card count. It starts automatically on the first card of a new session, never on the homepage, intro or topic picking, and starts once per session. It counts through cards, Active Recall, notes, the second try and reinforcement. It pauses immediately when the tab is hidden and after 120 seconds of inactivity, and resumes on interaction. It stops at Finish Session / Skip Reinforcement with the final time saved. Leaving early saves it; resuming continues from the saved total.
- Activity is clicks, key presses, typing, touches and mouse-wheel scrolling. Page-caused scroll events no longer count as activity.
- One timer only (adds the same time to the session and the lifetime total). Earlier saved times are untouched.

## Motivational introduction (Change 6)
- Proofread the quote intros ("Before you start: a word from the dungeon.", "Before you start: a word from someone who sat right where you're sitting. Not better than you, just earlier.", "A quote from someone who will someday be quoting you... if they're still alive."). No changes needed; they were corrected in the previous round.

## Local storage and backups (Change 7)
- Import now validates the file's structure (card records, notes, bookmarks, stats, session log) and rejects anything malformed or from a newer version with "nothing was changed."
- Before a restore, a safety copy of current progress is kept in the browser; **Undo Last Restore** on the welcome screen switches back (with confirmation).
- Welcome screen note: progress is saved in this browser on this device, doesn't sync, can be erased by clearing data or private browsing; use Export.
- No cloud sync or accounts added.

## How to Use Me (Change 8)
- **How to Use Me** link next to Export/Import opens a popup with a video player for `how-to-use-me.mp4` (optional captions `how-to-use-me.vtt`) in the site root. Loads only when opened, no autoplay, normal controls, Close/Escape. Until the video is uploaded, it shows "The How to Use Me video isn't available yet." The required device-storage explanation is written in the popup.

## Other
- Each finished session is recorded in `sessionLog` (unique cards, total review attempts, first ratings, cards missed the first time, second-try results, reinforcement status, study time). The end screen shows a one-line summary of it.
- `SCHEDULING.md` updated to match.
