# Flashcard Scheduling Rules

How the study site decides which cards Sarah sees and when. All of these values live in the `RULES` constant (and `LADDER`, for the earlier scheduler) at the top of the script in `index.html`, so they can be tuned in one place. Since Package 2 the spacing between reviews is set by **FSRS**; see *How intervals are set* below, and `docs/package-2/` for the evaluation and the mastery criteria.

## Two directions per card

Every card can be studied **question first**. Cards with a reverse version (257 of them, listed in `REVERSE` in `index.html` and in the Reverse columns of `flashcards.csv`) can also be studied **in reverse**.

Each direction has its **own schedule, its own history, and its own Mandatory Response status**, but both belong to the same card ID. Knowing a card one way doesn't count as knowing it the other way, and struggling in reverse doesn't reset the forward progress.

| Display mode | What she studies |
|---|---|
| Questions First | Forward direction of every card |
| Answers First | Reverse direction of cards that have one; forward for the rest |
| Random Mix | For cards with a reverse, whichever direction is due (a coin flip when both or neither are); forward for the rest |

A mode change made mid-session takes effect on the next card.

Reverse cards come in two styles:

- **Definition cards (199):** the front reads "Which term or concept is described by:" followed by the card's answer; the back is the term.
- **Written reverse cards (58):** a separately written reverse question and answer. 32 were rewritten because the definition style would be ambiguous, broken, or give the answer away; 26 came with the 1,000-card deck.

## Ratings

After revealing a card she rates it. A card cannot be rated until the answer is revealed.

| Button | What happens to that direction | Before-flip writing |
|---|---|---|
| Didn't know | Stays due today and its memory strength drops. It doesn't repeat during the session; instead it can get **one optional second try** after the session's cards (see Missed-card second try). If she rates it Got it that day, it's due **tomorrow**. | Required from now until the card is Mastered |
| Struggled | Scheduled at 80% of what Got it would have given (1 day for a new or weak card, longer for a well-known one). Its streak resets to zero. | Unchanged |
| Got it | Scheduled for when she's expected to still remember it 90% of the time (below). | Ends only when the card reaches Mastered |

There are no keyboard shortcuts (Space and 1 / 2 / 3 were removed on Oct 25, 2026). Ordinary keyboard use works: Tab between controls, Enter or Space on a focused button, Enter on the focused card to flip it, Escape to close a popup.

**Previous Card** (left of Reveal Answer, and on the missed-card question and Congratulations screens) takes her back to the card she just rated with the answer showing, so she can pick a different rating. The earlier rating is undone completely: that direction's schedule, history, Mandatory Response status, any repeat it added, and the session score all go back to how they were. It goes back one card, to the most recent rating in the current session. Starting a new session or using Change Topic clears it.

## Active Recall

- Under the card are three buttons: **Previous Card | Reveal Answer | Active Recall**.
- **Active Recall** switches the writing box below to **My Written Answers** and puts the cursor in **Current Answer**. The answer stays hidden until she reveals it. It works on any card, either direction.
- What she typed stays on screen (read-only) after the reveal, next to the answer, and is saved with her rating (`p` in the history). It never becomes a card note.

## Writing box: Notes and My Written Answers

- A writing box sits under the rating buttons on every card, with two tabs on its top edge: **Notes** and **My Written Answers**. It opens on Notes, and switches to My Written Answers when writing is required, after Struggled / Didn't know, or from Active Recall.
- **Hidden until the flip, on every card:** before the answer is revealed, a saved note and any previous answers are covered ("…appear after you reveal the card") and are not in the page at all. They appear when the card flips. If the card has no note yet, she can start one before revealing.
- **Notes:** her own note for the card (shared by both directions). **Write Card Note** (pencil icon, left, under the card) jumps to it.
  - Only *adding* text saves automatically, after a short pause and when she moves on.
  - If she deleted or changed saved text, it doesn't autosave: **Save note** appears, and moving to another card or leaving the session asks **Save the changes to your note? Save / Discard**.
  - Saving an empty note asks "Delete your note for this card?".
  - Notes never affect scheduling. **My Card Notes (N)** in the header still lists every note, grouped by AAMC category.
- **My Written Answers:** **Current Answer** (left, editable) and **Previous Answers** (right; stacked on phones). Previous Answers lists what she wrote for that card direction, newest first, with dates: before-flip answers and after-rating answers.
  - Only answers from the card direction's latest 50 ratings are kept (the history limit), and the box says so when that limit is reached.
- **What's on the MCAT?** is a text link under the writing box that opens the AAMC content outline PDF in a new tab.
- Prewritten explanations are not shown on the site yet. The `EXPLAIN` data and the `Detailed_Explanation` column in `flashcards.csv` are kept for later.

## Bookmarks

- Every card has a **☆ Bookmark** toggle in its top corner (it doesn't flip the card). Bookmarks are saved by card ID and shared by both directions.
- A **Bookmarks (N)** button in the header on every screen opens **My Bookmarks**: a list of bookmarked cards (tap one to see its answer, or Remove it) and a **Study My Bookmarks** button.
- A bookmark session uses the bookmarked cards regardless of due date (due ones first), up to 50. Ratings follow the normal rules; same-day and early reviews never push a card further out.
- Back returns to wherever she was, including the same card mid-session. Bookmarks are included in backups.

## My Weaknesses

- **View My Weaknesses** on the welcome screen shows a score for each section and each topic (AAMC category): each studied card counts once by its most recent rating in either direction (Got it = 100%, Struggled = 50%, Didn't know = 0%), with the number of cards reviewed. Topics with no reviews show **Not Studied Yet**.
- **Weakest topics** are the 3 lowest-scoring topics below 100%, preferring topics with at least 3 studied cards. They're shown in bold.
- **Study My Weakest Topics** builds a session from those topics: cards she rated Didn't know first, then Struggled, then Got it, then unseen cards, up to 50. Building the session doesn't change any schedules; ratings follow the normal rules.

## Rating flow and reinforcement writing

- After the answer is shown, three buttons appear: **Got it**, **Struggled**, **Didn't know**.
- **Got it** goes straight to the next card.
- **Struggled** or **Didn't know** switches the writing box to **My Written Answers** with the cursor in **Current Answer**. **Next card** saves her entry with that rating (`w` in the history) and moves on. If she tapped the wrong rating, she can tap another one before submitting.
- With **Mandatory Response** on, Next card stays disabled until she types at least 20 characters. With it off, Next card always works, but leaving with less asks "You didn't type the mandatory response for this card. Continue anyway?" (see Mandatory Response).

## Report this card

- Every card has a small **Report this card** link under it. It opens an optional "What looks wrong?" note with Send and Cancel.
- Send emails the card ID, how it was shown (question first or reverse), the question, the answer, and her note to Aaron@sunsweeper.com through FormSubmit (formsubmit.co, no account). On success it shows "Thanks, flagged"; if it can't send, it says so and keeps the box open.
- The address is set in `REPORT_ENDPOINT` near the top of the script. The first report triggers an activation email from FormSubmit; reports only arrive after you click Activate. After activating, FormSubmit sends a private alias you can use instead of the email address.
- Reports can't be sent from the Claude preview, only from the real site.

## Missed-card second try

- When all of a session's original cards have their first rating, any card she first rated **Didn't know** can get one more try. She's asked: "Want to give the cards you had trouble with one more try?" with **Yes, Let's Try Again** and **No, Finish Session**. If nothing was missed, this is skipped.
- **Yes**: each of those cards comes up exactly once more, in the order she first saw them, shown the same way. She reveals (or uses Active Recall, where available) and rates it as usual. A card missed again doesn't get a third try. Struggled cards aren't included.
- **No**: goes straight to reinforcement. Nothing is held against her.
- Both ratings stay in the card's history. The second rating sets the next review (Got it: tomorrow; Didn't know: still due today), and the card still counts once (review totals only count the first rating of a day). A card that had its second try doesn't get yet another look in a later session that day.
- If she leaves or refreshes during the second try, it picks up at the next unfinished card with the same list.

## End-of-session reinforcement

- After the second try (or after declining it, or if nothing was missed), a **Congratulations!** screen offers **Begin Reinforcement** or **Skip Reinforcement**.
- Three different cards are picked at random from **positions 4–10** of the session's original order (shown the same direction as before). The pick is saved, so a refresh doesn't change it. Sessions with fewer than 10 cards use positions 4 onward when that leaves at least 3 cards, otherwise any 3; with fewer than 3 cards, reinforcement is skipped.
- Each question shows with the answer hidden and a box ("Type your answer from memory..."). **Reveal Answer** shows her answer next to the correct one, then **Next Question**. After the third: **Reinforcement Complete** and **Finish Session**.
- Nothing is graded. Reinforcement never changes ratings or schedules and doesn't count as studying more cards. Skipping is fine and isn't recorded as a failure.
- If she leaves mid-way, it resumes at the same question (with what she'd typed); she can still skip.

## How intervals are set (FSRS)

- **Memory model:** each card direction has an estimated **memory strength** and **difficulty** (FSRS-5, default parameters). They are worked out from its whole review history every time, so nothing extra is stored and they always match the history that syncs between devices.
- **Next review:** after a Got it, the card is scheduled for when her predicted recall falls to **90%** (`RULES.targetRecall`).
- **What changes the next gap:** cards she has missed, struggled with, or that are hard for her come back sooner. Cards she keeps getting right after longer and longer gaps come back less often.
- **A perfect run with no test date:** **3 → 11 → 35 → about 100 → 180 days**.
- **Limits:** the longest gap is **180 days** (`RULES.maxInterval`), and the test-date cap still applies.
- **Spread:** gaps of 4 days or more vary by ±5% so reviews don't bunch up on one day. The limits are applied after the spread, so a capped card lands exactly on the cap.
- **Never retired:** a mastered card keeps coming back.
- **Mastery levels** (Unseen, Learning, Developing, Provisionally mastered, Mastered, Previously mastered – needs attention) are defined in `docs/package-2/MASTERY_CRITERIA.md`.
- **Confidence insertions:** after 3 Struggled / Didn't know in a row, the next card is one of her mastered cards. A correct answer on it changes nothing about that card's schedule.
- **Sparkle:** a brief sparkle shows after some correct answers on mastered cards.
- **Rollback:** setting `RULES.scheduler` to `"ladder"` brings back the earlier fixed steps (1 → 3 → 7 → 14 → 30 → 60 → 90 days, then every 90). The review history is the same under both, so switching either way loses nothing.

## Test date

She enters her test date on the welcome screen (it can be changed or cleared anytime and is included in backups).

- **Interval cap:** while the test is ahead, no card is scheduled more than **half the remaining days** away. With 142 days left the cap is 71 days, which barely changes anything; with 20 days left it's 10 days; in the last few days cards come back daily. This guarantees every card she has learned comes up at least once more before the exam, and spreads those reviews out.
- When the date is set or changed, reviews already scheduled past the cap are pulled in to it.
- **Pace line:** under the counters, for example "To see every card by Jan 16 (8 weeks before your test): about 11 new cards a day." The goal date is **8 weeks before the test**, leaving time for reviews and practice exams. Inside those 8 weeks it counts down to the test itself. It counts cards unseen in either direction.
- After the test date passes, the cap and pace line turn off and scheduling goes back to normal.

## Slower progress for cards with a history of misses (earlier ladder scheduler only)

With FSRS, misses are already part of the memory model. This rule applies only if the ladder is switched back on. Before setting the next interval, the site looks at that direction's last **8 review days** (the first rating on each day) and counts how many were Didn't know or Struggled:

| Misses in last 8 review days | Interval used |
|---|---|
| 0 | Full ladder step |
| 1 | 60% of the step (rounded, at least 1 day) |
| 2 or more | 40% of the step (rounded, at least 1 day) |

As successful reviews pile up, old misses fall out of the 8-day window and the card speeds back up to the full ladder.

Example, with each card reviewed on its due date:

- **Card A** (Didn't Know, Struggled, then Knew It every time): 1, 1, 1, 1, 3, 6, 12 days
- **Card B** (Knew It every time): 1, 3, 7, 14, 30, 60, 90 days

## No inflation from repeats

- Only the **first rating of a direction each day** counts toward its long-term schedule and its review totals.
- Rating a card Got it a second time on the same day never pushes it further out.
- Rating a card Got it **before it was due** (early review) counts, but strengthens memory much less than an on-time review, because she was very likely to remember it anyway. An early Struggled or Didn't know reschedules it and turns writing on. (Under the earlier ladder, an early Got it never pushed a card further out.)

## Mandatory Response

- **When it applies:** a card direction needs a written answer before its flip from the moment it's rated **Didn't know** until it reaches **Mastered** (`docs/package-2/MASTERY_CRITERIA.md`). A later Didn't know starts it again. The box opens on My Written Answers for those cards.
- After Struggled / Didn't know, a written answer of at least 20 characters is needed before the next card.
- **The switch:** **Mandatory Response**, under the writing box, replaces the old "Skip reinforcement input" and "Skip writing before flip" switches.
  - It is **on** by default and remembered across sessions and devices (`mandOff` in her progress).
  - Anyone who had "Skip writing before flip" on starts with it off.
- **On:** Reveal Answer stays disabled until she types something on a card that needs it, and Next card stays disabled until 20 characters.
- **Off:** nothing is blocked. On every card where the required writing is missing, leaving the card asks **"You didn't type the mandatory response for this card. Continue anyway?" Yes / No**.
  - **Yes** saves the rating marked `k` (skipped). It isn't counted as a written retrieval, and the requirement stays for next time.
  - **No** stays on the card with the cursor in Current Answer.
- Nothing is graded; she still compares and rates herself.

## Session limits

| Limit | Value |
|---|---|
| Cards per session | **50** distinct cards, plus an optional second try for the ones she didn't know and three reinforcement questions |
| Next session | A **Next 50 cards** button at the end starts another 50 right away. There is no daily cap. |

How the 50 are chosen, in order of priority. Each card appears in at most one direction per session.

1. **Due reviews** not yet studied today, most overdue first.
2. **Cards still missed today**: anything whose last rating today was Didn't know gets **one more look** in a later session that day, then waits until tomorrow.
3. **New cards** (or a new direction of a card she has only seen the other way).
4. If those don't fill 50, **early reviews**: cards coming due soonest. These follow the early-review rule above.

**Cards she already reviewed today are left out** of later sessions that day (except the one extra look in step 2). Due reviews are never dropped; they stay in line for the next session.

If every card in a topic was already studied today, the session reviews them again so she can keep going; these repeats don't change long-term schedules.

Due reviews and missed cards are shown first; the rest are mixed together.

## Stopping and resuming

- Every rating is saved the moment she taps it.
- She can leave at any time with Change Topic or by closing the page. Each topic remembers its place in that day's session.
- A saved session only resumes on the same day. On a new day she gets a fresh session built from that day's schedule.
- This includes the missed-card second try and reinforcement: she comes back to the same step.
- A session ends when she finishes or skips reinforcement (or right after the cards, if there's nothing to reinforce). The end screen shows her score, study time, how many reviews of how many cards, how many she missed the first time, and how the second try went.

## Sessions and study time

- **Total Sessions Logged** (welcome screen) counts a session once, when she reveals the first answer in it. Opening a session without revealing a card doesn't count, and resuming the same session later doesn't count again.
- **Study time** (shown under the card count in the header during a session) starts automatically when the first card of a new session appears. It doesn't run on the welcome screen, while picking a topic, or on the quote screen, and there's no start button. It starts once per session; moving between cards never resets it.
- It keeps counting through the cards, Active Recall, card notes, the missed-card second try and reinforcement, as long as the tab is visible and she has clicked, typed or touched something in the last **2 minutes**. It pauses right away when the tab is hidden and after 2 minutes without activity, and picks up when she's back. Time is measured from the clock, not by counting timer ticks.
- It stops when the session ends (Finish Session or Skip Reinforcement) and the final time is saved with the session. If she leaves early (Change Topic or closing the page), the time is kept and continues from there when she resumes; time away isn't counted.
- **Total Time Logged** (welcome screen) adds up the same active time across all sessions, in hours and minutes.
- There's no "good place to stop" message any more. The old one used the wall-clock time since the session was opened, including time with the tab hidden, idle, or on other screens, which is why it could say "94 minutes in."
- Sessions, time and reinforcement counts are stored under `stats`; each finished session is recorded in `sessionLog`. Both are included in backups.

## Saving, backup, and restore

- Progress is saved in her browser for that web address only. It doesn't sync between devices, and clearing browser data erases it.
- If the browser refuses to save (private mode, blocked storage, or storage full), a notice appears at the top: "Your study progress could not be saved. Please check your browser storage settings." The site never says progress was saved unless the save worked.
- **Export Progress** (bottom of the welcome screen) downloads a backup file: `mymcatstudyguide-progress-YYYY-MM-DD.json`. It contains everything: both directions, schedules, ratings, writing status, history, notes, bookmarks, test date, sessions and study time, background choice, unfinished sessions, and display mode. Older backup files still import.
- **Import Progress** reads a backup file, checks it (made by Export Progress, card records in the right shape), shows how many cards each side has studied, and asks before replacing her current progress. Anything else is rejected and nothing changes.
- Before restoring, a safety copy of her current progress is kept in the browser (`mcat-progress-v2-before-restore`). **Undo Last Restore** appears on the welcome screen while that copy exists, and asks before switching back.
- The welcome screen says that progress stays in this browser and doesn't sync between devices. **How to Use Me** (next to Export/Import) opens a popup for the help video (`how-to-use-me.mp4` in the site's root, with optional captions `how-to-use-me.vtt`) and the same explanation. The video only loads when the popup opens and never autoplays; until it's uploaded, a short "not available yet" message shows instead.
- Export/import also moves progress between devices or from the `.vercel.app` address to the custom domain.
- Downloads are blocked in the Claude preview; Export works on the real site.

## What's stored for each card direction

Stored in the browser under `mcat-progress-v2`. The forward direction is keyed by the card's permanent ID (see `CARD_IDS.md`); the reverse direction adds `~r` (for example `1A-001~r`). Question, answer, subject, and topic come from the card itself in `index.html`.

| Field | Meaning |
|---|---|
| `status` | `learning` or `review`. No entry means that direction is new. |
| `writing` | Older flag kept for compatibility; Mandatory Response now works from the history (a Didn't know since the card was last Mastered) |
| `last` | Date last reviewed |
| `due` | Next scheduled review date |
| `interval` | Current interval in days (0 = due again today) |
| `reps` | Current streak of Got it on due days |
| `total` | Review days (first rating per day) |
| `good` | Review days rated Got it |
| `bad` | Review days rated Didn't know or Struggled |
| `retry` | Date a still-missed card last got its extra look in a later session |
| `history` | Each rating with its date and time; `w` her writing after Struggled / Didn't know; `p` what she wrote before the reveal; `k` when a required response was skipped; `b` on a confidence insertion (latest 50) |

The welcome screen's scoreboard and "cards unseen by you" count **cards**, not directions: a card counts as seen once she's seen it either way, and the scoreboard uses her most recent rating in either direction.

Dates of confidence insertions are in `boosted` (card ID → date), so the same card isn't inserted again within 14 days. Her notes are stored under `notes` and her bookmarks under `bookmarks`, both keyed by card ID. Her test date is `testDate`. Finished sessions are in `sessionLog` (date, topic, unique cards, review attempts, first ratings, cards missed the first time, second-try results, reinforcement completed/skipped, study time). An unfinished session (under `open`) keeps its original card order, the direction each card was shown, first ratings, the second-try list and position, the reinforcement picks and step, and its study time.

Progress saved by earlier versions loads as the forward direction.
