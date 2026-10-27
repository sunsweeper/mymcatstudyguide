# Application screen URLs

Adds screen-level browser URLs without changing layouts, card controls, content, scheduling or account storage. Public marketing routes remain unchanged.

Dashboard: /dashboard
Bookmarks: /bookmarks
Notes: /notes
Weaknesses: /weaknesses
Account: /account
MCAT date: /test-date
Owner dashboard: /owner-dashboard (existing owner role required)
Import confirmation: /import-progress (requires an already selected backup)
Auth screens: /login, /signup, /forgot-password, /reset-password, /check-email, /verify-email
Study: /study/bio-biochem, /study/chem-phys, /study/psych-soc, /study/cars, /study/all-topics, /study/weakest-topics, /study/focused-review
Study stages use /start, /missed-cards, /reinforcement/start, /reinforcement, /reinforcement/complete, /complete.

Refresh and direct private URLs pass through the existing authentication flow. A local, allowlisted next destination returns the user to the requested page after login. Browser Back/Forward use existing session persistence and note-save/discard confirmation. Study navigation resumes the saved phase rather than changing it to match a stale history entry. A study URL without a saved session opens that topic's introduction; it does not create or grade a session. Import confirmations without a selected file return to the dashboard. A recovery screen still requires the existing valid recovery session. Existing backend permissions are unchanged.

Files: app-router.js contains the routing adapter; index.html loads it and hooks screen rendering and account entry; vercel.json serves the existing application at the new routes; tests/screen-routing-browser.test.js tests mocked signed-in and signed-out journeys; .github/workflows/card-protection.yml runs those checks.

Validation: 54 desktop/mobile browser route checks passed with intercepted HTTP responses and mocked auth/database calls, without contacting real accounts. All non-browser study suites, card/metadata/graphics protection, seven existing browser suites and visual regression passed. Visual regression matched 2,514 card sides, four style sets and 16 screenshots. The remaining existing interface-browser suite reached its local HTTP refresh test but could not complete because this environment denies Chromium localhost network access (ERR_NETWORK_ACCESS_DENIED). No production account or email operation was exercised in the local checks.
