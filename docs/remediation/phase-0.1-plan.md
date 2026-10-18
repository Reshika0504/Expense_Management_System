# Phase 0.1 remediation plan (18 October 2026)

Baseline: 33f7e7e, clean working tree, main. Existing stack/route/controller/model/tests and supplied roadmap + Phase 0 report read before implementation. Work is isolated on `codex/phase-0-1-remediation-20261018`; no main push or automatic production rollout.

| Finding | Minimal change and source | Regression / acceptance |
| --- | --- | --- |
| A: name-only category joins | Shared server metadata lookup constrained by owner OR genuine global defaults, matching type; choose one deterministic candidate. Validate active visible category on transaction create/change. Historical orphan/archived records retain their owned ledger amounts and neutral metadata. | Two real MongoDB users, overlapping names, distinct metadata/amounts, duplicate metadata candidates, defaults, inactive/missing/foreign category and empty reports across all three reporting routes. |
| B: JWT string used in aggregation, imprecise independent calculations | Shared MongoDB finance aggregation using cast owner ID, Decimal128-to-minor-unit calculations, validated UTC date windows; retain Number amounts in stored records/API. Reject malformed legacy financial data explicitly; no data rewrite. Frontend displays cents and actual recorded income. | Multiple income/expenses, exact decimal sums, zero/empty, date boundaries, edits/deletes, bad legacy amounts/types/dates and API-to-render fixture. |
| C: JWT signature only | Resolve active local user on every protected request. Add versioned application-token revocation using an additive user field, an authenticated logout route, and password-change revocation. Existing unversioned tokens are version 0 until a revocation. No Firebase network request per API call. | Active/disabled/deleted accounts, all protected route groups, old/revoked/expired/forged/missing token, re-login, provider outage and logout. |
| D: localStorage bearer sessions | Keep current architecture; bounded fixes above, safe error/log handling, explicit non-credentialed CORS. Document XSS risk and Phase 1 cookie migration constraints; no second session mechanism. | Logout frontend thunk calls server before local clear; failures do not claim server revocation. Existing sign-in/refresh tests remain. |
| E: vulnerable dependencies | Audit installed and lockfile versions, production vs tooling paths and npm explain; remove verified unused dependencies, apply reviewed same-major patches only when available. No force audit fix or major migration. | Relevant backend/frontend suites + build after each package batch; residual high/critical packages are explicit release blockers with owner/next step. |

## API impact declared before edits

- Existing response property names and major-unit numeric amounts remain; no schema migration of financial records.
- New category writes must reference an active visible category of the transaction's type (400 otherwise). Unchanged historical names can still be edited for non-category corrections. A referenced custom category cannot be renamed until a later reviewed reference migration; archive remains supported.
- New transaction amounts: finite positive number, at most two decimals and bounded maximum; invalid legacy records cause safe 422 `DATA_INTEGRITY_ERROR`, not successful zero totals.
- Reports use documented UTC calendar month/year windows (week and top categories retain rolling-day semantics), explicit date-only end includes that UTC day; timestamp end remains inclusive. This corrects the old rolling/calendar/server-time inconsistency. No user-timezone setting is invented.
- Query/path validation becomes 400 instead of accidental 500 or unbounded reads; list limits 1–100 and stable ID tie-breaker.
- New `POST /api/v1/users/logout` revokes all current application sessions for that user via atomic version increment. Password changes revoke existing sessions and require re-login. Local user `isActive` is authoritative; disabling Firebase alone is not an immediate app-session revocation.
- Error envelopes retain `success:false,message`, add stable `code` where changed; no arbitrary replacement of every success wrapper. Provider unavailability is 503, invalid provider credentials 401.

No new budgets, goals, scheduler, dashboard redesign, paid service or destructive migration. Known residual architecture/dependency blockers must remain visible in the final report. Later Phase 1 is not started automatically.
