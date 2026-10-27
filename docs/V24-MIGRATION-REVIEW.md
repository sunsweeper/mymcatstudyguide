# V24 website migration review

## Scope and source
Implemented from MCAT_V24_Work_Handoff_2026-10-26.zip. Its homepage source is named homepage_concept_v23_review_only.html despite the V24 handoff name; the supplied design and five-card interaction were used, with a mobile overflow correction. No production deployment or merge is authorized.

## Changed files
- homepage.html: supplied homepage, normalized internal links, real signup navigation, legacy auth forwarding, mobile illustration fit.
- why-it-works.html, community.html, free-trial.html, contact.html, privacy-policy.html, terms-of-use.html: supplied pages and working local route links. Legal draft notices remain visible.
- site-pages-v24.css: supplied supporting-page styles.
- index.html: only two routing changes: canonical email redirect to /login and unauthenticated /signup entry screen. Study UI, scheduling, content, IDs, storage keys, synchronization, reporting, and account IDs untouched.
- vercel.json: homepage at /, existing application at /login and /signup, six supporting routes.
- legacy-auth-redirect.js: preserve original query and fragment when old root auth links arrive, including hash changes.
- api/contact.js and contact-form.js: validated server-side webhook submission, disabled duplicate submissions, accurate success and failure status.
- tools/preview-server.js: local server reproducing configured static routes and contact endpoint for tests.
- tests/website-browser.test.js and tests/contact.test.js: website/browser and API regression coverage.
- .github/workflows/card-protection.yml: run new website and contact checks with existing protected-card checks.

## Tests
Passed: three card/metadata/graphics checks; eight existing non-browser suites; nine existing browser suites; scheduler parity over 3,000 randomized histories; new website suite (198 checks at 390 and 1440 pixels); contact API (six checks, mocked webhook). Existing visual regression passed 2,514 card sides, four style sets, and 16 screenshots. No baseline was updated. All 1,000 protected cards unchanged. Browser screenshots cover every page, login/signup, and demo completion at both widths.

Authentication entry screens and legacy-link routing were tested with a stub session client. Real account creation, verification email delivery, password recovery, login/logout, account changes, owner dashboard data, and remote progress synchronization have NOT been verified end to end. No real user account or progress data was changed.

## Contact configuration still needed
No existing contact service or deployed Supabase edge function was found. Configure CONTACT_WEBHOOK_URL (HTTPS) in Vercel Preview and, after approval, Production. The destination must accept JSON fields name, email, topic, message and acknowledge only accepted submissions with 2xx. Optional CONTACT_WEBHOOK_TOKEN is sent as a Bearer token. Do not put either value in frontend source. Confirm the actual helpdesk/inbox, message retention, access controls and spam/rate-limiting policy, then submit and receive a real test message. Until then the endpoint returns 503 and the form explicitly reports that delivery is unavailable. Contact delivery is incomplete, not falsely represented as working.

## Supabase configuration review
The bundled application still uses production project kwvcflbzocmalhlekxjv. A separate development project exists; this migration did not switch projects, create users, or mutate either database. Connected tools enumerate projects and edge functions but do not expose Auth URL Configuration or email templates. Dashboard settings were therefore not verified or changed.

In Supabase Authentication > URL Configuration, allow the exact approved domain /login URL and preview /login URL. Set the default Site URL to the intended app entry /login after approval; retain old allowed URLs while outstanding verification/recovery emails exist. Inspect verification, recovery and email-change templates for hard-coded root URLs and use the configured redirect appropriately. See https://supabase.com/docs/guides/auth/redirect-urls . Confirm SMTP/provider delivery and test the complete flows using a designated test account. Homepage forwarding preserves old implicit-flow root links.

## Policy and business confirmations
These are implementation findings, not finalized legal advice. Preserve draft notices until owner/legal approval.
- Privacy sections 2 and 6: existing signup collects first/last name, test date (or unscheduled status), email, 18+ and terms confirmations. The application uses localStorage for progress and Supabase session state. Homepage demo answers, notes and ratings are memory-only and separate from accounts. Confirm exactly what study data syncs and associated retention.
- Privacy sections 4 and 6: actual code uses Vercel, Supabase, Google Fonts and the future contact webhook provider. Confirm other email, analytics and payment vendors and their roles; no unsupported vendor or sharing guarantees were added.
- Privacy sections 5, 7, 8, 11 and 12: owner must provide retention/backups, security practices, rights workflow, official contact email/address and effective date. An account-deletion flow exists in app code, but backend deletion and backup retention were not tested.
- Privacy section 10 / Terms section 2: existing registration requires age 18+. Confirm eligibility policy and enforcement before finalizing drafts.
- Terms section 3 / marketing: supplied pages advertise a three-day free trial without a credit card. Confirm trial enforcement, feature access, expiry, price, renewal, cancellation and refunds. This migration deliberately does not alter study/account logic to invent trial enforcement.
- Community marketing: homepage community/help actions are illustrative demo interactions. Confirm actual community availability, anonymity, moderation, contributor rights and deletion behavior; do not treat the demo as evidence of a live community.
- Terms sections 6–8: ownership/licensing, availability remedies, warranties, liability, governing law and disputes require owner/legal confirmation.
- Existing registration continues to link privacy.html and terms.html (unchanged existing policies); new footer links the supplied draft policies. Reconcile and approve final legal documents before production so registration acceptance and public policies agree.
- Supplied ownership attribution is JSA Knowledge & Cattle LLC throughout new pages. No business email or postal address was invented.

## Local review
Install tools/package.json dependencies. Run node tests/website-browser.test.js and node tests/contact.test.js. The test server uses explicit ordered Vercel routes. Deployed-preview verification caught filesystem precedence overriding the initial root rewrite; explicit routes before the filesystem phase correct this while preserving index.html for card checks. Screenshots and raw test logs accompany the output handoff.
