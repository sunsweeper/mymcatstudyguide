# Deployment relationship and rollback

Observed 2026-10-25. This is a future procedure, not an executed rollback. No push, PR, deployment, promotion, rollback, database query or modification occurred.

## Confirmed relationship

- GitHub repository: sunsweeper/mymcatstudyguide; default branch main.
- Source baseline: 4bd0a7743f118c2e4f5b815373906198a3093608.
- Vercel project: mymcatstudyguide (prj_JhHQW05ADQfvYIbcK8dnZ1GVbApy).
- Account/team: team_TqTHjlfsd6jfC4dtC62QgNkB.
- Current production: dpl_FK2hz34Cvfgdg8Kz4qnrfJo4xYDQ; READY, source git, target production.
- Deployment metadata: sunsweeper/mymcatstudyguide, main, matching baseline SHA.
- Immutable URL: https://mymcatstudyguide-8nm203kzf-sunsweepers-projects.vercel.app.
- Aliases: mymcatstudyguide.vercel.app, mymcatstudyguide-sunsweepers-projects.vercel.app and mymcatstudyguide-git-main-sunsweepers-projects.vercel.app.
- Framework null (static/Other), Node 24.x; README specifies root ./.
- vercel.json runs card protection and graphics validation with Node; output directory is the repository root.
- SSO protection is enabled for all_except_custom_domains; check preview access before use.

Read-only deployment metadata confirms GitHub-to-Vercel production delivery from main at this SHA. Responses do not expose all settings. Recheck Production Branch, ignored-build rules, build overrides and required gates before future pushes. No custom .com domain was confirmed. README's no-build-command statement conflicts with vercel.json; existing documentation is preserved.

GitHub protect succeeded, covering card/metadata/graphics/visual checks, not feature suites. Production readiness preceded completion of protect, so release gating is unproven. Branch-protection read returned 403; required reviews/checks remain unknown. A successful Supabase Preview check exists; its branching/migration policy was not inspected. No tracked Supabase migration project exists here.

## Local development isolation

Local development/baseline-audit was created from this SHA, without push or upstream. Four deliverables remain working-tree additions. No equivalent docs/development directory existed; historical reports were preserved.

1. Inspect initial status, branch, HEAD and remote. Preserve uncommitted work and use a scoped branch from a chosen baseline.
2. Run existing Node/Chromium checks in REGRESSION_CHECKLIST.md locally; no push required. Use synthetic progress and disposable contexts.
3. Block/mock SDK/backend for UI inspection as existing tests do. A static server alone does not isolate the hardcoded production Supabase endpoint.
4. Authenticated integration testing needs a separate verified test project, fixtures, SQL/RLS and redirect settings. This requires separately scoped setup. Vercel environment variables alone cannot replace embedded constants.
5. Before any branch push/PR, inspect Vercel Git/Production Branch and Supabase Git integration. Non-production branches normally receive previews, conditional on project settings. A preview can still write production records using the existing endpoint. Keeping this audit local avoids automatic branch/PR deployment effects.
6. Release only after exact-diff review, tests and production authorization. A main push/merge, manual deployment, promotion or alias change can affect production; none belongs to this package.

The branch name is a convention, not enforced isolation. No branch rules, CI or infrastructure settings changed.

## Rollback preparation

Before future release, record current production ID, immutable URL, SHA, domains, configuration and test results. Confirm a working deployment is retained/eligible and compatible with current progress/auth/SQL. Old code may drop optional fields when saving; verify synthetic backup compatibility first. Preserve student progress and schedules; frontend recovery requires no setup SQL.

The baseline is a reference, not a guarantee of future retention, health or eligibility. Plan/permissions/retention can limit targets. Frontend rollback cannot undo database writes, recover deleted accounts or reconcile caches. Database recovery requires separately scoped work and verified backups; backup/PITR coverage was not confirmed.

## Future incident procedure

1. Record incident/current ID/SHA and symptoms; pause releases. Check older frontend compatibility with current data.
2. In the correct Vercel team/project, open production tile or Deployments. Select Instant Rollback and an eligible previously production-aliased build. Verify SHA/domains/compatibility before confirmation. This requires authorization for a production action.
3. Confirm readiness and aliases reference the selected build. Smoke-check static loading without production study writes. Use isolated integration tests unless a specific production check is authorized.
4. Record restored ID/SHA/results. Prepare a reviewed source inverse change/fix separately so the next release does not reintroduce the incident.

[Vercel Instant Rollback](https://vercel.com/docs/instant-rollback) documents eligibility and retained build/configuration. Rollback disables automatic production-domain assignment; deliberate promotion of a validated deployment/undoing rollback restores it. Check that state before assuming later pushes go live. Database/auth state is separate from frontend deployment.

## Source rollback

Use a dedicated branch from the reviewed current remote tip. Inspect offending commits and create an auditable inverse commit using Git's revert operation. For merge commits choose the mainline only after inspecting history. Resolve scoped conflicts, rerun checks and use the review/release workflow. Local inverse changes do not affect production; a main merge can trigger Vercel.

Preserve history and uncommitted work. Avoid destructive branch rewriting, broad replacement or mass deletion. Preserve student records, SQL and protected references. Never regenerate baselines to make recovery checks pass.

For this documentation-only package, undo only its four additions after preserving later edits. No application/schema/account/progress rollback is needed.

## Scheduler fallback

RULES.scheduler supports ladder instead of fsrs using retained history. Switching changes behavior and requires a separately authorized change and regression run. It was not switched. Shared history shape does not certify every older build against newer optional progress fields.

## Evidence

- [Baseline source](https://github.com/sunsweeper/mymcatstudyguide/tree/4bd0a7743f118c2e4f5b815373906198a3093608), vercel.json, README and workflow.
- Read-only Vercel project/deployment responses for the identifiers above; no credentials or environment-variable values fetched.
- [Baseline Actions run](https://github.com/sunsweeper/mymcatstudyguide/actions/runs/40247657978).
- [Vercel GitHub behavior](https://vercel.com/docs/git/vercel-for-github); future project preview settings remain unverified.
