# Regression checklist

Baseline: `4bd0a7743f118c2e4f5b815373906198a3093608`, 2026-10-25. Checked boxes mean this audit performed that specific check. Manual scenarios remain unchecked. Historical reports are preserved.

## Scope protection

- [x] Create local development branch; no push or deployment.
- [x] Preserve runtime, flashcards, metadata, scheduling, homepage, auth, progress, SQL and protected references.
- [x] Execute checks using synthetic/disposable local contexts without production login.
- [ ] Future changes: record initial branch/SHA/status and preserve unrelated changes.
- [ ] Before interaction, confirm backend blocked/mocked or separately verified isolated test project. Preview hostname is insufficient.
- [ ] Review final changed paths against scope; never regenerate references to conceal regressions.

## Existing commands

From repository root with Node on PATH:

```powershell
node tools/check-cards.js
node tools/validate-metadata.js
node tools/validate-graphics.js
Get-ChildItem tests -Filter '*.test.js' |
  Where-Object Name -NotMatch 'browser' |
  ForEach-Object { node $_.FullName; if ($LASTEXITCODE -ne 0) { throw $_.Name } }
```

Normal browser setup requires npm and an install-capable environment:

```powershell
Push-Location tools
npm install --no-audit --no-fund
npx playwright install chromium
Pop-Location
$env:NODE_PATH = Join-Path (Get-Location).Path 'tools/node_modules'
Get-ChildItem tests -Filter '*browser.test.js' |
  ForEach-Object { node $_.FullName; if ($LASTEXITCODE -ne 0) { throw $_.Name } }
node tools/visual-check.js
```

NODE_PATH matters: tests are siblings of tools, not children. Restore prior environment values afterward. Install can create a lockfile; exclude incidental artifacts from a documentation-only diff. Scripts are standalone Node programs, not `npx playwright test` suites. tools check-all covers card/metadata/visual only; run graphics and feature suites explicitly. Never use visual-check --update or make-baseline --first-time in routine verification.

This audit used the scratch exact-version archive workaround described in [BASELINE_AUDIT.md](BASELINE_AUDIT.md), because pnpm hit Windows symlink restrictions. No application/test code changed to accommodate the environment.

## Executed baseline outcomes

All entries below exited 0. Node: 207 assertions across seven suites plus scheduler parity (3,000 histories), detailed in the audit. All three non-browser validators passed.

| Chromium suite | Passed | Failed |
|---|---:|---:|
| tests/interface-browser.test.js | 113 | 0 |
| tests/phase1-browser.test.js | 16 | 0 |
| tests/phase2-browser.test.js | 17 | 0 |
| tests/phase3-browser.test.js | 9 | 0 |
| tests/phase4-browser.test.js | 13 | 0 |
| tests/phase6-browser.test.js | 29 | 0 |
| tests/phase7-browser.test.js | 13 | 0 |
| tests/phase8-browser.test.js | 16 | 0 |
| Total | 226 | 0 |

Visual protection: 2,514 rendered card sides, four computed-style sets and 16 screenshots matched approved references. No baseline update. Pinned Playwright 1.56.0 and Chromium 141/build 1194; no alternate browser engine used. Browser suites block the Supabase SDK and use synthetic local data. Phase 8 simulates publication only in a temporary HTML file, never in repository/application source. Logs are retained outside the repository in the audit workspace; summaries here are the durable repository record.

## Manual/integration scenarios still needed

Use synthetic fixtures, disposable profiles and isolated backend. None of these was executed against production.

- [ ] Signup/verification/resend/login errors/reload persistence; token refresh/expiry; reset and expired links; both email-change confirmations and pending resend.
- [ ] Account A/B switch, legacy migration, offline logout retention, successful logout removal, recovery isolation, admin/non-admin boundaries and RLS cross-user denial.
- [ ] Offline edits/reload/reconnect; simultaneous devices; timestamp ties; note/bookmark deletions; active-session pull suppression; pagehide loss and duplicate activity requests.
- [ ] Forward/reverse independence, daily-first/repeats, due/new/early priorities, retry, targeted early success, mastery downgrade/recovery, test-date caps/clearing and no history inflation.
- [ ] First reveal counts once; first card starts time; same-day resume across phases; new-day rebuild; drafts/notes/bookmarks; finish/skip summaries; Previous Card; Final 21 date/window changes.
- [ ] Home/hidden/idle exclusion, actual background throttling and long suspensions; persisted active time and no duplicate timers.
- [ ] Old/current import; malformed/newer backup rejection; confirmation/cancel; safety snapshot/undo; quota failure preserves prior progress.
- [ ] Homepage/card design, all view modes, notes/answer tabs, writing override, confidence hiding, reduced motion, focus/keyboard, light/dark, narrow/short screens.
- [ ] iOS Safari, Android keyboards, Firefox, screen readers, real tab/app backgrounding. Chromium emulation cannot certify these.
- [ ] External report delivery/help playback and isolated SMTP verification/reset/change delivery; no unsolicited messages during passive checks.

## Interpretation

Passing tests establish only exercised fixtures. Available browser suites bypass accounts; they do not certify auth, live RLS, SMTP or cloud sync. The harness is a minimal fake DOM/clock. Random queue/sparkle behavior and file URLs/fonts can vary by OS. Historical TEST_REPORT/release totals include absent files/suites and must not be added to this run. GitHub protect passes a narrower set than this checklist.

Scheduler simulations and metadata/graphics generators were not rerun: they overwrite reports/data, and simulations are experiments rather than pass/fail regressions. No production behavior was changed to obtain passing tests.
