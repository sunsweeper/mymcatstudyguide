# Test report (Oct 24, 2026)

Every result below came from a test that was actually run. Full output is in `tests/results.txt`; the scripts are in `tests/`.

- **Logic tests (Node, simulated browser, controllable clock):** 13 suites, **291 checks, 291 passed, 0 failed.** `tests_v2.js` is the new suite for these instructions (97 checks). The other 12 are the existing regression suites.
- **Real-browser tests (Chromium via Playwright, the deploy build `site/index.html`):** **44 checks, 44 passed, 0 failed.** Run at 360, 390, 768 and 1280 px wide, plus a 390×460 viewport standing in for a phone with the keyboard up, and a controlled clock for the timer.
- **Baseline before changes:** all existing suites passed on the previous version (backup kept).

## Required tests (Change 10)

| # | Test | Result | How |
|---|---|---|---|
| 1 | Active Recall: type, reveal, both stay visible | Pass | Node + browser at 4 widths |
| 2 | One rating = exactly one review event | Pass | Node |
| 3 | Cancel before reveal: no rating, no note | Pass | Node |
| 4 | Reveal Answer works without Active Recall | Pass | Node |
| 5 | Active Recall unavailable when the answer side shows first (Answers First); Random Mix only on question-first cards | Pass | Node |
| 6 | Panel on mobile without overlap | Pass | Browser 360 and 390 px (and 768, 1280): panel below card, buttons pushed down, no overlap, no sideways scroll |
| 7 | 50 × Got it: no popup | Pass | Node |
| 8 | Five Didn't know: popup appears | Pass | Node; browser with 2 misses (CARS) |
| 9 | Yes: exactly five second attempts | Pass | Node; browser: exactly 2 for 2 misses |
| 10 | Didn't know again: no third attempt | Pass | Node |
| 11 | No: goes to reinforcement | Pass | Node |
| 12 | Refresh during second tries: no duplicates | Pass | Node (reload from saved storage) |
| 13 | Struggled cards excluded | Pass | Node |
| 14 | Three unique cards from positions 4–10 | Pass | Node; browser |
| 15 | Selection unchanged after refresh | Pass | Node; browser (real page reload) |
| 16 | No extra unique cards counted | Pass | Node |
| 17 | Skip keeps the session saved | Pass | Node |
| 18 | Reinforcement doesn't change schedules | Pass | Node (card records byte-identical before/after) |
| 19 | Note saves and persists | Pass | Node (incl. reload); browser |
| 20 | Edit persists | Pass | Node |
| 21 | Cancel unsaved keeps saved note | Pass | Node; browser |
| 22 | Popup with a mobile keyboard | Pass (emulated) | Browser: touch/mobile emulation, viewport shrunk to 460 px tall; note box and Save Note reachable on screen |
| 23 | Pauses after inactivity threshold | Pass | Node and browser with a controlled clock: 10 idle minutes add only the 2-minute threshold |
| 24 | Hidden tab stops time immediately | Pass | Node; browser (visibility change simulated) |
| 25 | Resumes without resetting | Pass | Node; browser |
| 26 | 94-minute stop message gone | Pass | Node: message text and its code absent; nothing shown at 94 minutes |
| 27 | Refresh keeps ratings, notes, bookmarks | Pass | Node |
| 28 | Export and restore | Pass | Node (plus safety copy and Undo Last Restore) |
| 29 | Malformed backup rejected safely | Pass | Node: 7 bad files (not JSON, wrong app, wrong shapes, newer version), progress unchanged |
| 30 | Interrupted session resumes | Pass | Node |
| 31 | Study modes still work | Pass | Node: full sessions in all three modes |
| 32 | Scheduling intact except second-try handling | Pass | Node + the existing scheduling suites |
| 33 | Repeated clicks: no duplicate records | Pass | Node (double answer, double submit) |
| 34 | Usable on desktop and mobile sizes | Pass | Browser at 360/390/768/1280 with screenshots reviewed |
| 35 | No JavaScript errors | Pass | Browser: no page errors or console errors in any run (the font request and the not-yet-uploaded video file were excluded as expected network misses) |

## Your timer spec

| Step | Result |
|---|---|
| 3 minutes on the homepage: stays at 0:00 / not shown | Pass (Node and browser) |
| First flashcard: starts automatically at 0:00 | Pass (Node and browser) |
| 15 minutes of study: 15:00 | Pass (Node exact; browser within the 1-second display tick) |
| Another tab for 10 minutes: paused | Pass (Node and browser) |
| 10 more minutes: about 25:00 | Pass (Node exact; browser within 1 second) |
| Second try and reinforcement still counted; stops and saves at Finish Session | Pass (Node) |
| Leaving early saves the time; resuming continues from it; time away not counted | Pass (Node and browser) |
| Moving between cards doesn't restart it; only one timer | Pass (Node) |

## Also tested
- An unfinished session saved by the previous version resumes and finishes; a backup exported by the previous version restores.
- Card notes popup: focus trap with Tab/Shift+Tab, page behind inert, Escape, focus returns to Write Card Note (browser).
- How to Use Me: no autoplay, controls on, fallback message when the video file is missing, Escape closes, focus returns (browser).
- 1,000-card deck checks from the previous round still pass.

## Not tested (could not be done here)
- Real phones and tablets (iPhone Safari, Android Chrome) with a real on-screen keyboard. Emulated in Chromium only.
- Safari and Firefox engines. Chromium only.
- Screen readers (VoiceOver, NVDA). Labels, roles and focus behavior were checked in code and in the browser, but no screen reader was run.
- A real tab switch or app backgrounding on a device, and real multi-minute waits. The timer was tested with a controlled clock and a simulated visibility change.
- Video playback. There's no video file yet; only the fallback was tested.
- The live Vercel site. This workspace can't reach vercel.app, so the deploy build was tested from the file.
- Sending a card report (FormSubmit). Not changed in this update.
