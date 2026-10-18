# Manual browser smoke checklist — proposed, not executed

Status: **PARTIALLY EXECUTED**. Exact application SHA tested in the local browser follow-up: `e8cd35688f870e90379362c1e1ccad1575aa9cf4` (application runtime identical to reviewed feb94f7). See [actual results](2026-10-18-browser-smoke-results.md), including real Safari Google sign-in/refresh/logout. The original template rows below retain NOT RUN placeholders; use the dated result record for actual outcomes. Candidate: PR #1 `feb94f70efa58eaccdb91dea61a0e8c2d346b08d`; assessment branch `codex/phase-0-1-post-review-20261018` adds no runtime auth/finance changes. A different candidate requires its exact new full SHA, CI and applicable re-review. No preview was deployed or real identity used in this task.

## Operator header — complete before execution

Record operator/date, browser+version/OS, frontend and backend immutable full build SHAs, preview URLs (no query credentials), actual timezone, fixture identifier without personal identity, and test start/end. Both services must run the same reviewed application candidate. A current main deployment is not evidence for the candidate. Use an authorized **nonproduction** environment, throwaway synthetic accounts/ledger and a consented test Google identity. Do not create paid infrastructure, expose passwords/tokens/DevTools Authorization headers or touch production data. If a prerequisite is missing, record BLOCKED rather than PASS.

Confirm preview DB separation and fixtures, HTTPS/API base, exact CORS origin, Firebase Google enabled/project match/authorized preview domain, popup permission, and API/DB availability. These are checks for an authorized operator; this task changed none of the settings. Test latest supported Chrome and Safari, desktop and narrow viewport; note timezone explicitly, including UTC/Asia-Kolkata/non-UTC boundary if available. Browser coverage not executed here.

## Steps, expected and actual

Every row's Actual is initially NOT RUN. Replace it only after execution with observed result, PASS/FAIL/BLOCKED, time, exact SHA and sanitized evidence. Do not copy expected into actual.

| ID | Reproducible steps using isolated fixtures | Expected outcome | Actual / evidence |
| --- | --- | --- | --- |
| B01 | Open direct `/login`; register/login synthetic A by email/password; refresh | Route loads, login succeeds, owned profile restored; no token in URL/logs | NOT RUN |
| B02 | Submit wrong password, then simulate preview API network/503 and retry | Generic credential error; temporary network/503 gives retry, not invented success or confirmed server logout | NOT RUN |
| B03 | Start A with no ledger rows; separately set planned monthly income in preview profile if needed | Dashboard/summary show recorded income 0.00, expense 0.00, net 0.00; planned income never replaces a valid zero | NOT RUN |
| B04 | Create current-period income 100.00 and expense 33.33 in visible matching categories; reload dashboard and call/read summary for same window | Income 100.00, expense 33.33, net 66.67, 2 transactions; category total matches; cents retained | NOT RUN |
| B05 | Edit expense to 33.34; reload; delete expense then income | Net 66.66 after edit; then income 100.00 / expense 0.00 / net 100.00; finally genuine empty 0.00 summaries | NOT RUN |
| B06 | In same UTC window create income 0.30, expenses 0.10 and 0.20; compare dashboard, summary and category report; clean up only preview fixtures | Expense 0.30 and net 0.00; 3 records; zero net distinguished from empty; no floating display residue | NOT RUN |
| B07 | Synthetic A/B each create own same-name/type category with distinct icon/color; A expense12.34, B expense91.23; inspect report/usage/top while switching accounts | Each sees own total12.34 or91.23 and own metadata; no doubled sums/foreign metadata or late previous-account data | NOT RUN |
| B08 | Attempt foreign transaction GET/PUT/DELETE through authorized preview test tooling; invalid ID and unsupported amount/type via preview API | Foreign valid ID404; malformed ID400; zero/negative/>2-decimal write400; no unauthorized change | NOT RUN |
| B09 | Two independent browser profiles sign in as A; logout on device A, then fetch transactions/report on B before reload, then reload B | A acknowledged logout; B server rejects SESSION_REVOKED; **known F-05** may retain authenticated UI/stale token until profile reload. Record actual behavior as open finding, do not mark desired auto-logout PASS | NOT RUN |
| B10 | Log in again; change A password in one profile; use old session on the other; sign in with new password | Old sessions rejected; change-password client requires re-login; new password works; old password fails | NOT RUN |
| B11 | Authorized operator prepares a synthetic locally disabled account in preview, then tests its preexisting session across APIs; re-enable only using separately approved version-bump policy | Disabled response403 ACCOUNT_DISABLED, no protected data; no old session revival after the approved version bump. Firebase-only disable is not app revocation | NOT RUN |
| B12 | Prepare an expired application token privately using the existing JWT library and **throwaway preview signing key** in authorized test tooling, or wait for actual server expiry; exercise UI restoration and resource call | Server401 UNAUTHENTICATED; restoration clears session. Record non-profile stale UI as F-05 if observed. Do not change production JWT key/lifetime or client clock as a substitute | NOT RUN |
| B13 | Click Continue with Google from actual click event, select consented test identity, refresh, logout; test popup cancel/blocked | Verified Google exchange signs in, refresh restores app session, logout revokes it; cancel/block is actionable error; no phone/SMS flow | NOT RUN |
| B14 | In a **synthetic preview only**, operator seeds one invalid historical record outside selected dates, e.g. amount33.333; open each affected report | Reports422 DATA_INTEGRITY_ERROR; UI unavailable/retry, never successful0; list remains accessible. Capture counts/status only, no raw record/token | NOT RUN |
| B15 | Create date-only transaction around UTC day/month boundary in chosen browser timezone; filter inclusive end date and compare selected-year monthly rows | Stored occurrence follows documented UTC midnight; final UTC day included; next month excluded; UI expectations/date labels recorded explicitly | NOT RUN |
| B16 | Turn network off and logout, then reconnect in preview and inspect other session | Device data cleared, warning server revocation unconfirmed; do not claim other devices revoked without acknowledgement | NOT RUN |

Expiry/disable/invalid-history setup may need authorized fixture tooling; if unavailable mark the corresponding row BLOCKED. No fixture setup described above is permission for production writes. The 44 backend/22 frontend tests and local build are separate evidence and do not mark any browser row passed.

## Result and gate

No browser rows executed; no preview URLs/credentials or invented results. F-04 stays OPEN. Required critical smoke rows must actually pass (with documented accepted findings) on matched reviewed SHA before merge approval; real Google must pass when offered as a supported configured login. Save a new dated result record beside this checklist, preserve failed attempts and request independent re-review. A screenshot alone cannot prove server session revocation or data isolation.
