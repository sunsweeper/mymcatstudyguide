# Known limitations and decisions to review

These are places where the instructions conflicted with how the site already worked, or where I had to make a call. Each one is easy to change.

1. **In-session repeats of Didn't know cards are off.** The site used to bring a missed card back 4 cards later, up to 3 times. The new optional second try at the end replaces that, because keeping both would show a missed card up to 5 times and break "exactly one second attempt." To bring the old repeats back, set `maxRepeats: 3` in `RULES` near the top of the script.

2. **Write before flip, and Active Recall, on Didn't know cards.** A card she last rated Didn't know asks her to write an answer before revealing (cards rated Struggled don't). She can turn this off with the "Skip writing before flip" switch under the card; it stays off until she turns it back on. While the write box is showing, Active Recall is unavailable on that card, since she's already writing from memory.

3. **The missed-card question appears as a full screen, not an overlay.** After the last card there's nothing left behind it, so it uses the same panel as the other end-of-session screens.

4. **Previous Card after the last card** is offered on the missed-card question and Congratulations screens. Once reinforcement starts, it's no longer available. Before, it was on the end screen.

5. **Card notes no longer save as she types.** Per the instructions, Save Note saves and Cancel discards. Confirmations ("Discard your unsaved changes?", "Delete this note?") appear inside the popup rather than as browser dialogs.

6. **The Study time display updates once per second.** It can read one second behind for a moment, for example 14:59 right at the 15-minute mark.

7. **Idle time includes the 2-minute threshold.** For example, 10 minutes of study, 15 idle and 5 more counts about 17 minutes, as in the instructions' example.

8. **Study time before this update.** Time she logged before was already active-time based and is kept as is. The old wall-clock `elapsed` value in an unfinished session is left untouched and no longer used.

9. **Progress sync.** Logged in, progress is saved to her account and follows her to any device; a copy on the device keeps studying working offline and syncs when she's back online. Without an account (local preview only), progress stays in that browser. The safety copy kept before a restore covers only the most recent restore.

10. **How to Use Me video.** There's no video yet, so the popup shows a fallback message. The storage explanation is written in the popup, so it's there even without the video.

11. **Not verified on real devices, Safari/Firefox, or screen readers.** See TEST_REPORT.md, "Not tested."

## Sync between devices sends a whole copy (kept by decision, Oct 25, 2026)

- **How it works:** each device sends its entire progress to the account about 4 seconds after a change. It picks up other devices' work only at login, or when returning to the tab outside a study session (at most once a minute).
- **The risk:** studying on two devices close together can replace one device's recent study in the account. That's usually repaired the next time the other device syncs, but it's lost for good if that device logs out or its browser data is cleared first.
- **Fix, if wanted later:** fetch and merge before every send.
