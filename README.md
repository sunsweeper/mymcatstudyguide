# MyMCATstudyguide.com

Sarah's MCAT flashcard site: 895 cards, spaced repetition, written recall for missed cards, reverse cards, notes, bookmarks, a weakness dashboard, a test-date pace guide, and encouragement quotes.

## What's in this folder

| Path | What it is |
|---|---|
| `site/index.html` | **The whole website.** One file. This is the only thing Vercel needs. |
| `docs/CARD_IDS.md` | How card IDs work, card counts per group, and the next ID for each group |
| `docs/SCHEDULING.md` | The spaced-repetition rules and session limits |
| `docs/flashcards.csv` | **Master card list.** Every card with its ID, reverse question/answer where one exists, and a Detailed_Explanation column (filled in as explanations are written). Use this as the starting point for future edits. |
| `docs/new_cards_review.csv` | The review of the 500-card batch (what was added, changed, or skipped) |
| `docs/1200_review.csv` | The review of the 1,200-card list (what was added and skipped) |
| `docs/reverse_rewrites.csv` | The 32 reverse cards that were rewritten, with the old and new versions |

The `docs` folder is for you, not the site. Deploying only the `site` folder keeps those files off the public internet.

---

## Put it on Vercel (no coding needed)

You'll use GitHub to hold the files and Vercel to host them. Both are free for this.

### 1. Put the files on GitHub

1. Go to **github.com** and sign in (or create a free account).
2. Click **+** in the top right, then **New repository**.
3. Name it `mymcatstudyguide`. Choose **Private**. Click **Create repository**.
4. On the next page, click **uploading an existing file**.
5. Drag in the **`site`** folder and the **`docs`** folder from this zip (unzip it first). You can also drag in this README.
6. Click **Commit changes**.

### 2. Connect it to Vercel

1. Go to **vercel.com** and sign in. Choose **Continue with GitHub** so the two are linked.
2. Click **Add New…**, then **Project**.
3. Find `mymcatstudyguide` in the list and click **Import**. (If it isn't listed, click the link to adjust GitHub permissions and give Vercel access to that repository.)
4. On the setup screen:
   - **Framework Preset:** `Other`
   - **Root Directory:** click **Edit** and choose **`site`**
   - Leave the build settings empty.
5. Click **Deploy**. In under a minute you'll get a working link ending in `.vercel.app`.

### 3. Connect your domain

1. Buy the domain if you haven't (the site is labeled **MyMCATstudyguide.com**, so `mymcatstudyguide.com` matches it). You can buy it right inside Vercel under **Domains**.
2. In your project, open **Settings → Domains**.
3. Type the domain and click **Add**.
   - Bought through Vercel: it connects automatically.
   - Bought somewhere else: Vercel shows the DNS records to add at that registrar. It usually starts working within an hour.
4. Add the `www.` version too when Vercel offers to.

### Optional: password protection

Free option: keep the repository private and only share the link with her. Anyone with the link can open the site, but nothing links to it.

Paid option: Vercel's password protection (a Pro-plan feature) puts a password box in front of the whole site.

---

## Making changes later

Edit `site/index.html` on GitHub (open it, click the pencil icon, make the change, **Commit changes**). Vercel redeploys automatically within about a minute.

When adding cards, follow `docs/CARD_IDS.md`: give each new card the next ID in its group and never reuse an ID.

---

## Important: her progress

Progress (which cards she knows, her place in each section, her Writing Required cards) is saved **in her browser, for that web address only**.

- Progress from testing on the claude.ai preview **does not carry over** to the new site. She starts fresh there, which is what you want.
- The `.vercel.app` link and the custom domain count as **different addresses**. Have her use **only the custom domain** once it's connected.
- It doesn't sync between her phone and laptop on its own, and clearing browser data erases it.

**Backups:** the welcome screen has **Export Progress** and **Import Progress** links at the bottom. Export downloads a backup file of everything she's done; Import restores it (it asks before replacing anything). Use these to move progress to another device or browser, or to keep a backup. Export only works on the real site, not in the Claude preview.
