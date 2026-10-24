# Known limitations and decisions to review

These are places where the instructions conflicted with how the site already worked, or where I had to make a call. Each one is easy to change.

1. **In-session repeats of Didn't know cards are off.** The site used to bring a missed card back 4 cards later, up to 3 times. The new optional second try at the end replaces that, because keeping both would show a missed card up to 5 times and break "exactly one second attempt." To bring the old repeats back, set `maxRepeats: 3` in `RULES` near the top of the script.

2. **Active Recall is disabled on Writing Required cards.** Those cards (anything she last rated Struggled or Didn't know) already require her to write an answer before revealing, in the existing box. That includes every card in the second try, since they were all Didn't know. She still writes from memory first there, just in the existing box instead of the Active Recall box.

3. **The missed-card question appears as a full screen, not an overlay.** After the last card there's nothing left behind it, so it uses the same panel as the other end-of-session screens.

4. **Previous Card after the last card** is offered on the missed-card question and Congratulations screens. Once reinforcement starts, it's no longer available. Before, it was on the end screen.

5. **Card notes no longer save as she types.** Per the instructions, Save Note saves and Cancel discards. Confirmations ("Discard your unsaved changes?", "Delete this note?") appear inside the popup rather than as browser dialogs.

6. **The Study time display updates once per second.** It can read one second behind for a moment, for example 14:59 right at the 15-minute mark.

7. **Idle time includes the 2-minute threshold.** For example, 10 minutes of study, 15 idle and 5 more counts about 17 minutes, as in the instructions' example.

8. **Study time before this update.** Time she logged before was already active-time based and is kept as is. The old wall-clock `elapsed` value in an unfinished session is left untouched and no longer used.

9. **Progress is per browser and device.** There's no sync or accounts, by design. The safety copy kept before a restore covers only the most recent restore.

10. **How to Use Me video.** There's no video yet, so the popup shows a fallback message. The storage explanation is written in the popup, so it's there even without the video.

11. **Not verified on real devices, Safari/Firefox, or screen readers.** See TEST_REPORT.md, "Not tested."
