# Turning on accounts (one-time setup)

Do these in order. Steps 1–3 take about 10 minutes.

## Updating the database after a site update
When a site update adds database fields (like last name and MCAT date), run the latest `docs/supabase-setup.sql` again the same way as step 1. It only adds what's missing; existing accounts and progress are untouched.

## 1. Create the database tables
1. Open your Supabase project → **SQL Editor** → **New query**.
2. Open `docs/supabase-setup.sql` from this zip, copy all of it, paste it in, and click **Run**.
3. You should see "Success. No rows returned." (It's safe to run again if you need to.)

This creates the tables and the security rules:
- each person can read only their own progress;
- you (the owner) can see everyone's name, email, last active time, cards reviewed and study time, but not their progress, answers or scores.

## 2. Tell Supabase your site's address
**Authentication → URL Configuration**
- **Site URL:** `https://mymcatstudyguide.vercel.app`
- **Redirect URLs:** add `https://mymcatstudyguide.vercel.app/**`

When you connect mymcatstudyguide.com later, change the Site URL to it and add `https://mymcatstudyguide.com/**` (and the `www.` version).

### If a verification link "doesn't work"
The usual cause is that step 2 wasn't done yet. The link then goes to Supabase's default address, `http://localhost:3000`, which doesn't exist. After setting the Site URL and Redirect URLs:
- On the site, click **Log in**, enter your email and password, then click **Resend the verification email**, and use the new link. Old links don't change.
- Or confirm the account directly: in the **SQL Editor**, run
  ```sql
  update auth.users set email_confirmed_at = now() where email = 'aaron@sunsweeper.com';
  ```
  then log in normally.

Some email services open links in advance to scan them, which can use up a one-time link. If the site says a link "has expired or was already used," request a new one.

## 3. Check the email settings
**Authentication → Sign In / Providers → Email**
- **Enable Email provider:** on
- **Confirm email:** on (this is what sends the verification link)
- **Minimum password length:** 8 (the site also requires 8)

## 4. Upload the site to GitHub
Upload everything in this zip to the root of the repo. The new files are `supabase.js` (the accounts library), `privacy.html` and `terms.html`, along with the updated `index.html`. Vercel redeploys in about a minute.

## 5. Make your own account and make yourself the owner
1. On the live site, click **Create an account** and sign up with **the same email you use to log in to Supabase**. Until step 6 is done, Supabase's built-in email only delivers to project team members.
2. Click the link in the verification email. You'll land on the welcome screen with your name.
3. In Supabase → **SQL Editor**, run this one line:
   ```sql
   update public.profiles set is_admin = true where email = 'aaron@sunsweeper.com';
   ```
   (Use whatever email you signed up with.)
4. Reload the site. **Owner Dashboard** appears next to **Account** at the bottom of the welcome screen.

## 6. Before inviting testers: set up an email sender
Supabase's built-in email sends only to your project's team members, and only a few emails an hour. Testers won't get verification or reset emails until you add your own sender. Resend is free for this volume.
1. Sign up at resend.com and **add a domain** you own. Add the DNS records it shows at your domain registrar. This could be mymcatstudyguide.com once you buy it, or a subdomain like `mail.sunsweeper.com`.
2. In Resend, create an **API key**.
3. In Supabase → **Authentication → Emails → SMTP Settings**, turn on **custom SMTP** and enter:
   - Host: `smtp.resend.com` · Port: `465`
   - Username: `resend` · Password: your Resend API key
   - Sender email: for example `no-reply@yourdomain.com` · Sender name: `MyMCATstudyguide`
4. In **Authentication → Rate Limits**, raise "emails per hour" (for example, to 100).
5. Optional: in **Authentication → Emails → Templates**, edit the subject and text of the "Confirm signup" and "Reset password" emails to mention MyMCATstudyguide.com.

## 7. Quick live check
Work through these on your phone:
- Sign up: the email arrives, and the link logs you in with "Welcome [your name]."
- Log out, then use **Forgot password?**: the email arrives, and the link lets you set a new password.
- Study a few cards, then log in on your laptop: the same progress is there.
- **Owner Dashboard** shows your account with cards and time.
- Optional, on a test account: **Account → Delete my account**. If it shows an error instead of deleting, tell me. Some Supabase projects need one extra permission for that step.

## What's stored where
- **Supabase `profiles`:** first name, email, sign-up date, terms acceptance, 18+ confirmation, owner flag.
- **Supabase `progress`:** each person's ratings, schedules, notes, bookmarks, test date, sessions and settings. Readable only by that person.
- **Supabase `activity`:** one row per person per day with cards reviewed, active seconds and last seen.
- **The browser:** a working copy of the logged-in person's progress, so studying keeps working on a weak connection. It's removed at logout once it has synced.
