# MyMCATstudyguide.com

MCAT flashcard study site: 1,000 cards, spaced repetition, Active Recall, end-of-session review, study timer, notes and bookmarks, with accounts so progress follows you to any device.

## Files

| File | What it is |
|---|---|
| `index.html` | The website (required) |
| `supabase.js` | The accounts library (Supabase, version 2.117.3), loaded by `index.html` (required) |
| `privacy.html`, `terms.html` | Privacy Policy and Terms of Service, linked from every page (required) |
| `3-2020_whats_on_the_mcat_content_outline.pdf` | Opened by the "What's on the MCAT?" button (required) |
| `README.md` | This file |
| `docs/` | For you. `SETUP-ACCOUNTS.md` covers the one-time Supabase setup, and `supabase-setup.sql` is the database script. Also: the master card list, card IDs, scheduling rules, changelog, test report and known limitations. The site doesn't use these. |

## Vercel settings
- Framework Preset: **Other**
- Root Directory: **./**
- No build command

## Accounts
Accounts run on Supabase. The first time, follow `docs/SETUP-ACCOUNTS.md`: run the database script, set the site address, sign up, and make yourself the owner. Before inviting testers, add an email sender (step 6).
