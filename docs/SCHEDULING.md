# Flashcard Scheduling Rules

How the study site decides which cards Sarah sees and when. All of these values live in the `LADDER` and `RULES` constants at the top of the script in `index.html`, so they can be tuned in one place.

## Two directions per card

Every card can be studied **question first**. Cards with a reverse version (231 of them, listed in `REVERSE` in `index.html` and in the Reverse columns of `flashcards.csv`) can also be studied **in reverse**.

Each direction has its **own schedule, its own history, and its own Writing Required status**, but both belong to the same card ID. Knowing a card one way doesn't count as knowing it the other way, and struggling in reverse doesn't reset the forward progress.

| Display mode | What she studies |
|---|---|
| Questions First | Forward direction of every card |
| Answers First | Reverse direction of cards that have one; forward for the rest |
| Random Mix | For cards with a reverse, whichever direction is due (a coin flip when both or neither are); forward for the rest |

A mode change made mid-session takes effect on the next card.

Reverse cards come in two styles:

- **Definition cards (199):** the front reads "Which term or concept is described by:" followed by the card's answer; the back is the term.
- **Rewritten cards (32):** a separately written reverse question and answer, for cards where the definition style would be ambiguous, broken, or give the answer away.

## Ratings

After revealing a card she rates it. A card cannot be rated until the answer is revealed.

| Button | What happens to that direction | Writing Required |
|---|---|---|
| Didn't know | Comes back **4 cards later in the same session**, up to **3 extra times** per session. After that it stops repeating for the session and stays due today. If she rates it Got it that day, it's due **tomorrow**. | On |
| Struggled | Due **tomorrow**. Its streak resets to zero. | On |
| Got it | Moves to the next step on the interval ladder (below). | Off |

Keyboard: Space reveals the card; 1, 2, 3 rate it (Got it, Struggled, Didn't know), matching the button order.

**Previous Card** (left of Reveal Answer, and on the end-of-session screen) takes her back to the card she just rated with the answer showing, so she can pick a different rating. The earlier rating is undone completely: that direction's schedule, history, Writing Required status, any repeat it added, and the session score all go back to how they were. It goes back one card, to the most recent rating in the current session. Starting a new session or using Change Topic clears it.

## My Notes

- After she reveals the answer, a **Write Card Note** button appears below the rating buttons, sharing the row with **What's on the MCAT?** (opens the AAMC content outline PDF, `3-2020_whats_on_the_mcat_content_outline.pdf` in the site's root, in a new tab). It opens a notes box (the button then reads "Hide Card Note"). It never appears before the answer is revealed, so it can't bypass Writing Required or give away the answer.
- Notes save automatically as she types, are kept per card (shared by both directions), and can be deleted with **Delete note** (or by clearing the box).
- If a card has notes, the box opens on its own after she reveals the answer, so her notes come back the next time she sees it.
- Notes don't affect scheduling and are included in Export/Import backups.
- **My Card Notes (N)**, under Bookmarks in the header on every screen, lists every card she has a note on, grouped by AAMC category in outline order. Each entry shows the question (tap to see the answer) and her note.
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
- **Struggled** or **Didn't know** opens a box: "Write the answer in your own words, and why it's correct." The answer stays visible. **Next card** stays disabled until she types at least 20 characters, then saves her entry with that rating (`w` in the history) and moves on. If she tapped the wrong rating, she can tap another one before submitting.
- **Skip reinforcement input** (toggle at the bottom of the card screen): when on, Struggled and Didn't know go straight to the next card. It lasts for the current session (including resuming it later that day) and is off whenever a new session starts.
- This is separate from Writing Required, which still asks her to write her answer *before* revealing a card she previously struggled with or didn't know.

## Report this card

- Every card has a small **Report this card** link under it. It opens an optional "What looks wrong?" note with Send and Cancel.
- Send emails the card ID, how it was shown (question first or reverse), the question, the answer, and her note to Aaron@sunsweeper.com through FormSubmit (formsubmit.co, no account). On success it shows "Thanks, flagged"; if it can't send, it says so and keeps the box open.
- The address is set in `REPORT_ENDPOINT` near the top of the script. The first report triggers an activation email from FormSubmit; reports only arrive after you click Activate. After activating, FormSubmit sends a private alias you can use instead of the email address.
- Reports can't be sent from the Claude preview, only from the real site.

## Interval ladder

Each consecutive Got it, made on a day the direction was due, moves it one step:

**1 → 3 → 7 → 14 → 30 → 60 → 90 days**, then stays at 90 days (shortened as her test approaches; see Test date).

Cards are never retired. A 90-day card keeps coming back every 90 days.

## Test date

She enters her test date on the welcome screen (it can be changed or cleared anytime and is included in backups).

- **Interval cap:** while the test is ahead, no card is scheduled more than **half the remaining days** away. With 142 days left the cap is 71 days, which barely changes anything; with 20 days left it's 10 days; in the last few days cards come back daily. This guarantees every card she has learned comes up at least once more before the exam, and spreads those reviews out.
- When the date is set or changed, reviews already scheduled past the cap are pulled in to it.
- **Pace line:** under the counters, for example "To see every card by Jan 16 (8 weeks before your test): about 11 new cards a day." The goal date is **8 weeks before the test**, leaving time for reviews and practice exams. Inside those 8 weeks it counts down to the test itself. It counts cards unseen in either direction.
- After the test date passes, the cap and pace line turn off and scheduling goes back to normal.

## Slower progress for cards with a history of misses

Before setting the next interval, the site looks at that direction's last **8 review days** (the first rating on each day) and counts how many were Didn't know or Struggled:

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
- Rating a card Got it **before it was due** (early review) does not push it further out either. An early Struggled or Didn't know still reschedules it and turns writing on.

## Writing Required Mode

- Turns **on** for a direction whenever she rates it Didn't know or Struggled.
- While on, a text box appears under the question with "Write your answer before revealing the card." Reveal Answer stays disabled until she types something.
- After revealing, her answer is shown above the correct answer. Nothing is graded.
- Turns **off** the next time she rates that direction Got it. The other direction is unaffected.

## Session limits

| Limit | Value |
|---|---|
| Cards per session | **50** distinct cards (missed cards can repeat on top of that, up to 3 times each) |
| Next session | A **Next 50 cards** button at the end starts another 50 right away. There is no daily cap. |
| Suggested session length | **20 minutes**. After 20 minutes a note says it's a good place to stop. Nothing is cut off. |

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

## Sessions and study time

- **Total Sessions Logged** (welcome screen) counts a session once, when she reveals the first answer in it. Opening a session without revealing a card doesn't count, and resuming the same session later doesn't count again.
- **Total Time Logged** counts only active study time: while she's on a card screen, the tab is visible, and she has clicked, typed, or scrolled in the last 2 minutes. It pauses otherwise and resumes when she's active again. Shown in hours and minutes.
- Both are stored under `stats` and included in backups.

## Saving, backup, and restore

- Progress is saved in her browser for that web address only. It doesn't sync between devices, and clearing browser data erases it.
- If the browser refuses to save (private mode, blocked storage, or storage full), a notice appears at the top: "Your study progress could not be saved. Please check your browser storage settings." The site never says progress was saved unless the save worked.
- **Export Progress** (bottom of the welcome screen) downloads a backup file: `mymcatstudyguide-progress-YYYY-MM-DD.json`. It contains everything: both directions, schedules, ratings, writing status, history, notes, bookmarks, test date, sessions and study time, background choice, unfinished sessions, and display mode. Older backup files still import.
- **Import Progress** reads a backup file, shows how many cards each side has studied, and asks before replacing her current progress. Files not made by Export Progress are rejected.
- Export/import also moves progress between devices or from the `.vercel.app` address to the custom domain.
- Downloads are blocked in the Claude preview; Export works on the real site.

## What's stored for each card direction

Stored in the browser under `mcat-progress-v2`. The forward direction is keyed by the card's permanent ID (see `CARD_IDS.md`); the reverse direction adds `~r` (for example `1A-001~r`). Question, answer, subject, and topic come from the card itself in `index.html`.

| Field | Meaning |
|---|---|
| `status` | `learning` or `review`. No entry means that direction is new. |
| `writing` | Whether Writing Required Mode is on |
| `last` | Date last reviewed |
| `due` | Next scheduled review date |
| `interval` | Current interval in days (0 = due again today) |
| `reps` | Current streak of Got it on due days |
| `total` | Review days (first rating per day) |
| `good` | Review days rated Got it |
| `bad` | Review days rated Didn't know or Struggled |
| `retry` | Date a still-missed card last got its extra look in a later session |
| `history` | Each rating with its date and time, and `w` with her reinforcement writing after Struggled / Didn't know (latest 50) |

The welcome screen's scoreboard and "cards unseen by you" count **cards**, not directions: a card counts as seen once she's seen it either way, and the scoreboard uses her most recent rating in either direction.

Her notes are stored under `notes` and her bookmarks under `bookmarks`, both keyed by card ID. Her test date is `testDate`.

Progress saved by earlier versions loads as the forward direction.
