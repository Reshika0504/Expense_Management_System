# Claude independent review — Phase 0.1 remediation (PR #1)

Verdict: **CONDITIONAL PASS** (see §5). Review date: 2026-10-18 (Asia/Kolkata). Reviewer: Claude (independent review session; read-only with respect to implementation). This review does not authorize merge or deployment; the workflow's human approval gate still applies.

## 1. Task, revision pinning and access

| Item | Value | Source of observation |
| --- | --- | --- |
| Task | `phase-0.1` — audit remediation and backend stabilization (default application review in `docs/reviews/tasks.json`; explicitly selected by the human) | registry + user instruction |
| Repository / PR | https://github.com/Reshika0504/Expense_Management_System — Draft PR #1 "Stabilize SpendWise report isolation, money summaries and sessions", base `main`, head `codex/phase-0-1-remediation-20261018` | GitHub PR page (fetched read-only) |
| Reviewed head (full SHA) | `feb94f70efa58eaccdb91dea61a0e8c2d346b08d` | `git fetch origin refs/pull/1/head` resolved to this SHA; PR page shows the same latest commit; equals `origin/codex/phase-0-1-remediation-20261018`; equals the registry's `submittedHead` |
| Task baseline | `33f7e7ef017ab8bd8c12cb4cd990ad96405e2013` | registry / request.md; equals current `origin/main` |
| Live merge base | `33f7e7ef017ab8bd8c12cb4cd990ad96405e2013` (`git merge-base origin/main pr1`) — the baseline-to-head diff and the PR diff are identical | git |
| Commits in PR | `3b8d388` (implementation), `efe8ce1` (report), `136140b` (diagnostic fixture fix), `feb94f7` (report/verification.json only; `git diff --name-status 136140b feb94f7` touches only `docs/`) | git |
| CI | Workflow "Spendwise checks" run 39127433829 on `feb94f7` / PR #1, conclusion success, single job `test-and-build` (Node 24, npm 11.19.0: backend tests, client tests, client build) | Actions run page (fetched read-only) + `docs/testing/phase-0.1/ci-result.json` on the docs branch (headSha `feb94f70…`) |

Access limits (stated before relying on evidence):

- A fresh public clone of the repository was used in an isolated workspace, checked out at `feb94f7`. The connected local folder (`Spendwise`, checkout `7f1c1f3` on the docs branch) was used only to read the handoff documents; its working tree was not switched or modified.
- The GitHub API (`gh api`, GraphQL) is not enabled for this session; PR/CI metadata came from the public PR and Actions pages plus git refs. Check-run details beyond "success" were not retrievable.
- **Backend integration tests could not be executed here**: `mongodb-memory-server` must download a `mongod` binary from `fastdl.mongodb.org`, which the network policy refuses (HTTP 403 via proxy) both in the cloud workspace and in the VM on the reviewer's computer. No Docker daemon and no system `mongod` are available. Backend test results below are therefore **NOT RUN by the reviewer**; they rest on CI and supplied evidence (§2).
- No production database, deployment, or real Google identity was accessed.

## 2. What was inspected and what was actually run

### 2.1 Diffs and source read at `feb94f7`

`git diff --stat 33f7e7e feb94f7` (excluding lockfiles/docs): 35 files, +1792/−985. Fully read at the reviewed head: `app.js`, `server.js`, `middlewares/authMiddleware.js`, `middlewares/requireDb.js`, `config/connectDb.js`, `controllers/userController.js`, `controllers/transactionController.js`, `controllers/categoryController.js`, `controllers/dashboardController.js`, `services/categoryAccess.js`, `services/financeSummary.js`, `utils/finance.js`, `utils/apiError.js`, `utils/requestValidation.js`, `models/userModel.js`, `models/categoryModel.js` (schema + system list), `models/transactionModel.js`, `routes/userRoute.js`, `routes/transactionRoute.js`, `routes/categoryRoute.js`, `routes/dashboardRoute.js`, `tests/stabilization.test.js` (all 23 tests), diff of `tests/auth.test.js`, `client/src/redux/sessionGuard.js`, diffs of `client/src/Components/AppShell.js`, `client/src/Pages/Dashboard.js`, `client/src/Pages/Profile.js`, `client/src/redux/slices/authSlice.js`, `client/src/redux/slices/dashboardSlice.js`, `client/src/redux/store.js`, `client/src/utils/finance.js`, `client/src/services/api.js`, `client/package.json`, `.github/workflows/ci.yml`. Baseline (`33f7e7e`) versions of `controllers/transactionController.js` and `controllers/dashboardController.js` were compared for the root-cause claims.

Documents read: `CLAUDE_MASTER_REVIEW_PROMPT.md`, `CLAUDE_REVIEW_GUIDE.md`, `reviews/README.md`, `reviews/tasks.json`, `reviews/phase-0.1/request.md`, `reviews/phase-0.1/history.md`, the engineering report `2026-10-18-phase-0-1-remediation.md`, `remediation/phase-0.1-request.md` (findings A–E, §11, §13), `API_CONTRACT.md` (error table, sessions, report rows), `security/session-review-phase-0.1.md` (grep for storage/CSP/CSRF statements), `remediation/evidence/phase-0.1-before.txt` and `phase-0.1-backend.txt` summaries.

Not examined: `docs/api/openapi.json` content beyond its use by the contract test; `client/src/Pages/Transactions.js` beyond date handling; `scripts/audit-phase0.cjs`; `middlewares/frontendRedirect.js`; `services/firebaseAuth.js`; lockfile diffs line by line (audit tooling was used instead).

### 2.2 Checks the reviewer actually executed (cloud workspace, Node v22.22.0; CI uses Node 24)

| Check | Result |
| --- | --- |
| `node --check` on all backend `.js` under `app.js`, `server.js`, `controllers/`, `middlewares/`, `services/`, `utils/`, `models/`, `routes/` | PASSED (no syntax errors) |
| `npm ci` (root, npm 10.9.4) | PASSED |
| `npm test` (root) | **BLOCKED** — 4 pass / 35 fail, every failure is `hookFailed: Download failed … fastdl.mongodb.org … 403`; not a code failure |
| `npm audit --json` and `npm audit --omit=dev --json` (root) | PASSED — 0 findings (matches report) |
| `npm ci --prefix client` with npm 10.9.4 | FAILED — `Missing: yaml@2.9.1 from lock file` (see F-08) |
| `npx npm@11.19.0 ci` in `client/` (the version CI and `packageManager` pin) | PASSED |
| `npx npm@11.19.0 audit --json` in `client/` | 87 total: 0 critical / **67 high** / 15 moderate / 5 low — **independently reproduces the reported counts** |
| `npx npm@11.19.0 audit fix --dry-run` in `client/`, then applied in a scratch copy outside the repo | Non-breaking "fix" would change 40+ packages (several are downgrades, e.g. `eslint-plugin-testing-library 5.11.1→5.0.4`, `bfj 7.1.0→7.0.2`) and the result is **worse**: 100 total / 63 high / 34 moderate. Confirms the engineering decision not to run `npm audit fix` blindly |
| `CI=true npm test -- --watchAll=false --runInBand` in `client/` | PASSED — 8 suites, 22 tests (matches report/CI) |
| `CI=true npm run build` in `client/` | PASSED; source maps for both chunks contain **0** `firestore`/`grpc` module sources (confirms report §9 claim that the Firestore/gRPC advisory path is not in the shipped bundle) |
| Repository was left unchanged (`git status` clean at `feb94f7`); nothing pushed, no PR comments posted | — |

### 2.3 Supplied evidence inspected (not executed by reviewer)

- CI run 39127433829: success on `feb94f7` (Actions page; `ci-result.json`). Covers backend 39 tests, client 22 tests, client build. CI does **not** run lint, audit, or any browser/E2E step.
- `docs/remediation/evidence/phase-0.1-backend.txt`: 39/39 pass, matches the test file I read (23 stabilization + 16 auth/other).
- `docs/remediation/evidence/phase-0.1-before.txt`: 12 new tests vs. archived baseline → 10 fail / 2 pass. Note (informational): several of the 10 failures are caused by routes/validation that did not exist at baseline (e.g. `/users/logout` 404, new 400 rules), not only by the three defects; the defect-proving failures for A (category report/usage/top), B (summary 0.1+0.2, edit/delete) and C (disabled token, deleted user, logout) are present.

## 3. Findings

Severity scale: Critical / High / Medium / Low. "Verified" = confirmed by the reviewer in source at `feb94f7` and/or by a check the reviewer ran. "Inferred" = reasoned from source without runtime execution (backend runtime was BLOCKED).

### F-01 — High — Application JWT persists in `localStorage` (open engineering risk, not introduced by this PR)

- Where: `client/src/redux/slices/authSlice.js` lines 8–9 (initial state reads `localStorage.getItem("token")`), 36, 49, 63 (`setItem("token")` after Firebase/login/register), plus `removeItem` on logout/revocation paths. Token lifetime: `controllers/userController.js` line 16 `expiresIn: "7d"`. No `Content-Security-Policy` is set anywhere (`client/public/index.html`: 0 matches; `app.js` sets only `nosniff`/`Referrer-Policy`/`no-store`).
- Observed: Verified. Any same-origin script execution on the frontend can read a 7-day bearer token. This PR bounds the damage (server-side revocation on logout/password change, F-05 notwithstanding) but does not change the storage model, and the session review (`docs/security/session-review-phase-0.1.md` lines 44, 57) says so honestly.
- Impact: full account takeover for the token lifetime from any XSS; no CSP to reduce injection reach.
- Recommendation: keep as the documented Phase 1 blocker (cookie/HttpOnly design per session review §"Phase 1"). Bounded interim steps Codex can take without an architecture change: (a) add a CSP (at least `script-src 'self'` plus the Firebase auth origins) via the static host or a `<meta http-equiv>` and test it against the real login popup; (b) consider shortening `expiresIn` (e.g. 24h) now that server revocation exists, after confirming the UX impact; (c) ensure 401 `SESSION_REVOKED` from any slice clears local state (see F-05).
- Verification expected: CSP present in a deployed preview with Google popup login still working; a unit test that a 401 from a non-profile thunk clears `auth.token`.
- Disposition: **still open**; not a Phase 0.1 merge blocker because the task text (§7) allowed documenting a larger architectural change instead of a partial workaround, which is what happened.

### F-02 — Medium — One legacy record with more than two decimals (or any invalid field) makes every report for that user fail with 422

- Where: `services/financeSummary.js` lines 39–52 (`_valid` requires numeric type, `0 < amount ≤ 1e9`, minor units integral, `date` of BSON date type, type ∈ {income, expense}, non-empty string category), lines 56–60 (`invalid` facet matches the **whole owner history**, not the requested window), line 113 (`throw invalidData()` → 422 `DATA_INTEGRITY_ERROR`). Baseline validation at `33f7e7e` `controllers/transactionController.js` line 7 was `Joi.number().positive()` — so amounts such as `33.333` were accepted into production before this PR.
- Observed: Verified by reading; runtime behaviour covered by the supplied test "malformed financial records fail safely" (`tests/stabilization.test.js` lines 166–181), which I could not run.
- Impact: after deployment, a user with a single legacy 3-decimal amount (or any out-of-range/malformed record) loses `/transactions/stats/summary`, `/categories/stats/usage`, all four `/dashboard/*` endpoints and therefore the entire dashboard, with no in-app way to find or fix the record (the list endpoint still works). The behaviour is intentional and documented (report §7), but the deployment precondition is not yet an explicit gate.
- Recommendation: before merge approval, run a **read-only** inventory on the production database (e.g. count by user of `{amount: {$not: numeric-2dp}}`, `type ∉ [income, expense]`, `date` not a Date, empty category) and record the result; if non-zero, prepare the approved repair plan described in report §7 and sequence it with deployment. Optionally make the 422 message identify *how many* records need attention (not their contents) so support can act.
- Verification expected: inventory output (counts only) recorded under `docs/testing/phase-0.1/`; a decision recorded in history.
- Disposition: **open — condition of this verdict** (see §5).

### F-03 — Medium — 67 high-severity frontend advisories remain; classification verified, not resolved

- Where: `client/package-lock.json` at `feb94f7`; direct deps in `client/package.json` (`react-scripts 5.0.1`, `firebase ^13.0.0`, `tailwindcss ^4.1.18`).
- Observed (Verified, reproduced with npm 11.19.0): 87 findings, 67 high, 0 critical. Of the 67 high: **64** have `react-scripts` as their only fix path and are build/dev-time toolchain packages (jest, webpack-dev-server, svgo/nth-check, postcss<8.5.23 nested under resolve-url-loader, node-forge, serialize-javascript, micromatch/braces, etc.); **3** are the `firebase → @firebase/firestore → @grpc/grpc-js` chain, and the production source maps contain no Firestore/gRPC modules (verified in §2.2), so that chain is not shipped to browsers. The only npm-offered fix for the CRA set is semver-major (`react-scripts@0.0.0`, i.e. no real fix), and non-breaking `npm audit fix` makes the count worse (§2.2).
- Impact: not demonstrated to be exploitable in the deployed app; the realistic exposure is developer machines/CI (e.g. webpack-dev-server source exposure when a dev server is running and a malicious site is visited — `client/.env.development` `HOST` binding reduces LAN exposure but not the browser-side vector), plus audit noise that hides future real findings.
- Recommendation: (1) record an explicit, owner-signed risk acceptance for the 64 CRA toolchain findings with an expiry tied to a planned CRA→Vite (or equivalent) migration task; (2) for the firebase chain, either keep the documented "not bundled" evidence as a repeatable check (a small script that asserts no `firestore`/`grpc` sources in build maps) or move Firebase auth to the modular `firebase/auth` package without the umbrella dependency if feasible; (3) hygiene: move `@testing-library/*` from `dependencies` to `devDependencies`.
- Verification expected: acceptance record in `docs/security/`, the bundle check added to CI or to the verification JSON.
- Disposition: **open residual, not accepted**; not a merge blocker on the evidence above, but the acceptance decision is the human's, not the reviewer's.

### F-04 — Medium — No real-browser or real-Google end-to-end run on this revision

- Where: repository has no Playwright/Cypress/Puppeteer configuration (`ls client/e2e tests/e2e cypress playwright.config.*` → none; no such packages in either `package.json`); `.github/workflows/ci.yml` has no browser step. Google login is tested only with a mocked verifier (`tests/auth.test.js`) and a mocked SDK (`client/src/Components/Auth/SocialLogin.test.js`).
- Observed: Verified absence. The PR changes the logout contract, password-change behaviour (forced re-login), dashboard rendering states and date handling — all user-visible flows.
- Impact: untested integration points include the Firebase popup/redirect flow against the real project, the `/users/logout` call from the real `AppShell`, `SESSION_REVOKED` handling on a second device, and date-only transaction creation across timezones (client sends `new Date("YYYY-MM-DD").toISOString()` → UTC midnight, which `parseDate` accepts; verified by reading `client/src/Pages/Transactions.js` line 68 and `utils/finance.js` lines 20–40).
- Recommendation: before merge, a **documented manual smoke test on a preview deployment of `feb94f7`** (matched backend+frontend) covering: Google login, email login, create/edit/delete a transaction with cents, dashboard totals vs. summary, logout from device A invalidating device B, password change forcing re-login, disabled account denied. Record results with the exact SHA under `docs/testing/phase-0.1/`. Automated browser E2E can remain a Phase 1 task.
- Disposition: **open — condition of this verdict**.

### F-05 — Low — Revoked sessions are only cleared client-side on the profile request

- Where: `client/src/redux/slices/authSlice.js` lines 205–215 (`getProfile.rejected` with 401/403/404 clears token); `client/src/redux/slices/transactionSlice.js`, `dashboardSlice.js`, `categorySlice.js` have no 401 handling (grep `401|403|status`: no matches); `client/src/services/api.js` has no response interceptor. Server side, logout increments `sessionVersion` for **all** devices (`controllers/userController.js` line 410).
- Observed: Verified by reading. After logout on another device, this device keeps `isAuthenticated: true` and shows generic "Failed to fetch…" errors until the app reloads and `getProfile` runs.
- Impact: confusing UX and a stale token lingering in `localStorage` (ties to F-01); no security bypass (server rejects).
- Recommendation: add an axios response interceptor (or a shared rejected-case) that dispatches `logout()` on 401 with code `SESSION_REVOKED`/`UNAUTHENTICATED` or 403 `ACCOUNT_DISABLED`; unit test it.
- Disposition: open, non-blocking.

### F-06 — Low — Re-enabling a disabled account silently revives previously issued tokens; no admin path exists

- Where: `middlewares/authMiddleware.js` line 28 (`isActive !== true` → 403) and lines 29–30 (version check). Nothing increments `sessionVersion` when `isActive` flips back to `true`; `isActive` is not writable through any API (`profileSchema` excludes it), so disable/enable is a direct DB operation.
- Observed: Verified; documented in report §3 ("Re-enable without increment can restore still-valid tokens").
- Recommendation: either a Mongoose pre-save/update hook that `$inc`s `sessionVersion` whenever `isActive` changes, or a written runbook step ("re-enable = set isActive true **and** $inc sessionVersion") in `docs/security/`. Also restate that Firebase-console disable leaves the app JWT valid for up to 7 days (already documented).
- Disposition: open, non-blocking.

### F-07 — Low — Legacy baseline evidence overstates "defect-proving" failures

- Where: `docs/remediation/evidence/phase-0.1-before.txt`.
- Observed: 10 of 12 failures; at least 3 (query/ID validation 400s, logout route, malformed-record 422) fail because the endpoints/rules did not exist at baseline. The A/B/C defect failures are genuinely present. Informational; no action beyond a one-line clarification in the report if it is revised.

### F-08 — Low — `client/package-lock.json` is not installable with npm 10.x

- Observed (Verified): `npm ci --prefix client` under npm 10.9.4 fails with `Missing: yaml@2.9.1 from lock file`; succeeds with npm 11.19.0 (pinned by `packageManager` and installed explicitly in CI). Root `package.json` `engines` requires Node ≥24.12 <25.
- Impact: contributors on older npm get a confusing failure; CI is unaffected.
- Recommendation: add the npm requirement to README/engines (`"npm": ">=11"`), or regenerate the client lockfile so npm 10 and 11 agree.

### F-09 — Low — `GET /transactions?category=` is a case-insensitive substring match

- Where: `controllers/transactionController.js` line 70 (`$regex: escapeRegex(category), $options: "i"`).
- Observed: Verified. `category=Food` also matches "Fast Food". Regex characters are escaped (ReDoS/NoSQL-shape safe), so this is a semantics note only; the contract's "literal search" wording should say "case-insensitive substring" for `category` and `search`.

### Concerns examined and found acceptable (no finding)

- Category isolation (Finding A): `services/financeSummary.js` line 19 casts owner to `ObjectId` and line 23 matches it first; metadata is joined per `{category,type}` group via `services/categoryAccess.js` lines 23–80 with owner/type/system filtering **inside** the `$lookup` sub-pipeline (lines 31–70), deterministic sort and `$limit: 1` (lines 71–72), then `$arrayElemAt` instead of `$unwind` (line 78), so joins cannot multiply sums or borrow foreign metadata. Writes go through `permittedCategory` (lines 10–22) with `isActive: true` and the same visibility rule. Category list uses `visibility()` (`categoryController.js` lines 34–41). Tests at `stabilization.test.js` lines 77–124, 308–323, 408–416 exercise two users with overlapping names, duplicates, wrong-type and mis-owned "system" rows. Inferred correct; CI green.
- ₹0 summary (Finding B): root cause (string owner in `$match` on the stats aggregation at baseline) is fixed by the shared service; sums use `$convert`→Decimal128 ×100 and integral-minor-unit checks (`financeSummary.js` lines 25–38, 44); net and averages are computed from integer minor units (lines 132–139). The frontend no longer substitutes `user.monthlyIncome` and uses `overview.currentMonth.netBalance` (Dashboard.js diff); `formatCurrency` shows two decimals and "Unavailable" for non-numbers; `dashboardSlice` rejects an overview whose numeric fields are missing rather than rendering 0. Fixture test ties API fields to the rendered dashboard. Inferred correct; CI green.
- Disabled accounts (Finding C): every protected route group mounts `protect` (`routes/*.js`), which pins HS256 (`authMiddleware.js` lines 13–15), loads the account on each request (line 23), fails closed on DB error (503, line 25), missing account (401, line 27), non-boolean-true `isActive` (403, line 28) and version mismatch (401, lines 29–30), and takes role from the DB, not the token (lines 31–35; test at lines 263–282 proves a forged `admin` claim yields `user`). Logout and password change `$inc` the version atomically (`userController.js` lines 371–374, 410). Legacy unversioned tokens map to version 0 and remain valid for active accounts until the first revocation — a deliberate, documented compatibility choice.
- CORS is non-credentialed with an allowlist (`app.js` lines 25–40), `trust proxy` is set to 1 (line 16) so the login rate limiter keys on the real client IP behind Render, bodies are capped at 100 kB, JSON parse errors map to 400 and oversize to 413 (lines 73–93), and raw errors are never echoed (`utils/apiError.js` lines 8–30).
- Rollback hazard (report §7) is real and correctly stated: redeploying the baseline signature-only verifier would revive revoked tokens.

## 4. Previous findings

`docs/reviews/phase-0.1/history.md` records **no prior Claude review** and no prior findings; this is the first. The three engineering-identified defects (A, B, C) are dispositioned above as fixed-with-tests (inferred from source + CI; not executed by reviewer). The three engineering-declared open risks (localStorage, 67 high, no real E2E) are F-01, F-03, F-04 — all confirmed still open, none invented or resolved by this review.

## 5. Acceptance criteria and verdict

| Criterion (request §13 / report §2) | Assessment |
| --- | --- |
| 1. Three defects: root cause + tested remediation | Met on inspection: root causes are visible in the baseline diff; regression tests exist and pass in CI. Reviewer could not execute them (BLOCKED). |
| 2. Session-storage review documented | Met; residual F-01 honestly stated. |
| 3. Dependency review documented | Met; counts reproduced exactly (F-03). |
| 4. Regression tests cover original defects | Met (`tests/stabilization.test.js`, `tests/auth.test.js` additions). |
| 5. Existing tests and builds run | Met in CI on `feb94f7`; frontend tests and build reproduced by reviewer. |
| 6. No known unresolved regression | Partially: F-02 is a deliberate behaviour change that can regress report availability for users with legacy data; needs the pre-deploy inventory. |
| 7. `API_CONTRACT.md` accurate | Spot-checked (errors table, logout, summary/report rows) and consistent with code; F-09 wording nit. |
| 8. Risks/breaking changes documented | Met. |
| 9. Reviewable diff, no unrelated changes | Met; `feb94f7` vs `136140b` touches docs only. |

**Verdict: CONDITIONAL PASS.**

Reasons: the implementation correctly addresses Findings A, B and C at the right layers, with meaningful full-application regression tests and an honest residual-risk record; CI is green on the exact reviewed SHA and the reviewer reproduced every non-MongoDB check. The verdict is conditional because (i) the reviewer could not execute the MongoDB-backed backend suite and so relies on CI/supplied evidence for runtime behaviour, (ii) F-02 needs a recorded production-data inventory before deployment, and (iii) F-04 needs a recorded real-browser/Google smoke test on this revision. F-01 and F-03 remain open engineering risks requiring an explicit human acceptance decision; they are not resolved by this review and must not be treated as resolved by a merge.

A merge still requires explicit human approval per `docs/ENGINEERING_WORKFLOW.md`; green CI plus this review is not that approval.

## 6. Actionable tasks for Codex and re-review scope

1. **F-02 (blocking for deploy, not for code):** run and record a read-only inventory of production records failing the `_valid` rule, counts only; attach the repair plan if non-zero.
2. **F-04 (blocking for merge approval):** execute and record the manual preview-deployment smoke checklist on `feb94f7` (or the re-reviewed head), including Google login and cross-device logout.
3. **F-05:** add a shared 401/403 handler (axios interceptor or thunk helper) that clears auth state; add a `logout.test.js` case.
4. **F-06:** add a `sessionVersion` bump on `isActive` false→true (hook) or a runbook entry; add a test if implemented in code.
5. **F-03:** write the owner-signed residual acceptance (with expiry/migration task) for the 64 CRA findings; add the "no firestore/grpc in build maps" assertion to CI or the verification JSON; move `@testing-library/*` to devDependencies.
6. **F-01:** add CSP and evaluate a shorter token lifetime as interim mitigations; keep the cookie migration as the Phase 1 design item.
7. **F-08 / F-09 / F-07:** engines/README note for npm ≥11; contract wording for substring filters; one-line clarification of the "before" evidence.

Re-review needed for: any new commit on the PR beyond `feb94f70efa58eaccdb91dea61a0e8c2d346b08d` (this verdict applies only to that head); the diffs for items 3–5 if implemented in code; and the recorded evidence for items 1–2. If PR #1 is squashed/rebased, PR #2's base and diff must be recomputed as `docs/reviews/README.md` already notes.

---
Saved by the reviewer as `docs/reviews/phase-0.1/2026-10-18-claude-review-feb94f7.md` in the connected working folder (uncommitted). The registry (`tasks.json`) and `history.md` were **not** edited; the authorized workflow should record this path and reviewed SHA there.
