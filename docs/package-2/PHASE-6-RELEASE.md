# Package 2 · Phase 6 release — MCAT countdown

## The countdown

- **Where:** at the far right of the header on every page (home, study sessions, side screens), as a compact two-line badge: **37** over "Days Until Your MCAT". It uses the same layout on desktop and phones.
- **What it says:**
  - "1 Day Until Your MCAT" when one day is left.
  - **"MCAT Day"**, highlighted, on the exam date.
  - After the exam date it shows **"Update your MCAT date"** instead of counting.
- **When it shows:** only when the student has a valid MCAT date. It's hidden when there's no date, when she chose "My MCAT date isn't scheduled yet" (at sign-up or later), on the log-in screen, and when signed out.
- **How days are counted:** calendar dates (local date to local date), not 24-hour periods. 11:59 pm and 12:01 am differ by a day (tests C10–C11).
- **Keeping it current:** it rolls over at midnight without a reload (checked every minute and when she returns to the tab). It updates immediately when the date changes.
- **Opening the settings:** tapping the countdown opens **MCAT date** settings. Screen readers hear "37 Days Until Your MCAT. Open MCAT date settings."
- **Privacy:** it shows only her own date, from her own progress. It never shows anyone else's.

## MCAT date settings (new)

Before this release, the date could only be set at sign-up, and the home page's "Add your test date" line had no way to do it.

**Where to open it:**
- the countdown;
- a **MCAT date** item in the header menu (signed in, or in local mode);
- an **"Add your MCAT date"** link on the home page when no date is set. The link doesn't show if she said her date isn't scheduled.

**What it does:**
- A date field (today to 3 years out), a "not scheduled yet" checkbox, and Save. Bad dates get a clear message.
- Saving re-caps review intervals to the new date (existing test-date rule) and updates the countdown immediately.

**Where the date is stored:** with her study progress (`testDate`, plus `mcatNone` for "not scheduled"). It syncs between devices like the rest of her progress.
- The database doesn't allow students to edit the sign-up MCAT date in their profile (column permissions). So this release makes **no database change**, and the profile keeps the sign-up value.

**For Aaron:**
- **Stale dates on the Owner Dashboard:** it reads each person's sign-up MCAT date from their profile, so it won't reflect later changes.
- **Possible conflict with the package:** the package says not to expose another user's exam date. The owner dashboard currently shows each person's sign-up date to the owner. Whether to keep showing it is your call; nothing was changed.

## Header fit

The countdown adds width to the header. To keep everything on one line without overlaps:
- Between 761 and 1010 px wide, Bookmarks and My Card Notes show their icon and count. The words stay in the tooltip and are read aloud.
- Phones are unchanged; they already use the menu.

Checked at 761–1600 px, signed in and out, with large Bookmark and Note counts (test CD8). This also fixes a crowding overlap that already existed at around 901–1010 px when signed in.

## Data changes and rollback

- **Data:** `mcatNone` (optional) in progress. No database change.
- **Rollback:** revert this commit or promote the previous deployment.

## Tests

| Suite | Result |
|---|---|
| `tests/phase6-countdown.test.js` | 18 / 18 passed |
| `tests/phase6-browser.test.js` | 29 / 29 passed, at 360 / 390 / 768 / 1280 px, both themes |
| Other logic suites | Pass. The header-count tests were updated for the new label markup. |
| Browser suites | Pass |
| Layout audit, including the MCAT date screen | 0 findings |
