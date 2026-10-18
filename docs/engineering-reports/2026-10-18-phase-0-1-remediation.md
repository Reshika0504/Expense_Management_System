# SpendWise Phase 0.1 — audit remediation and backend stabilization

Date: 18 October 2026. Source baseline: `33f7e7ef017ab8bd8c12cb4cd990ad96405e2013`.
Branch: `codex/phase-0-1-remediation-20261018`.
Implementation revision: `3b8d388847976e7c8eaeb763cb8650b949d65b08` (implementation commit; subsequent report-only commit changes no runtime source). This report describes this branch's implementation, not live production. No independent Claude review has occurred.

## 1. Executive summary

The three verified Phase0 functional/security defects are repaired with real MongoDB regression tests: owner/type-safe category metadata with deterministic single selection, correct owner casting and exact minor-unit financial summaries, and local active-account/version enforcement for existing application JWTs. Related endpoints use the same calculation and visibility policy. Existing API success fields and stored Number amounts remain compatible; necessary validation/date/session changes are documented before and after implementation.

Bounded session fixes add acknowledged server logout, password-change revocation, safe offline device cleanup, private-cache reset and protection from previous-account late responses. Persistent localStorage JWT architecture remains an explicit high-risk Phase1 design item, not a partially implemented cookie workaround. Safe same-major/direct and compatible transitive patches remove all known backend and critical frontend audit findings; 67 high frontend findings remain reviewed residuals in pinned tooling/unused SDK dependency paths. This is not production readiness or merge approval.

## 2. Requirements and acceptance criteria

| Requirement | Status and evidence |
| --- | --- |
| A: no tenant metadata exposure/duplicate sums; valid defaults/history/empty states | Satisfied with evidence: full-app two-user integration fixtures exercise category report, usage and top categories, defaults, duplicate names, type/owner boundaries, orphan/archive records and create/update authorization. |
| B: correct recorded summary, precision, ranges, empty/zero, edits/deletes, frontend rendering | Satisfied with evidence: Decimal128 minor-unit aggregation, UTC ranges, malformed data422; fixtures prove0.10+0.20=0.30 and10−0.30=9.70 in API and real dashboard. No planned income substituted. Missing API totals show unavailable/retry rather than zero. |
| C: active/disabled/deleted/expired/revoked policy across protected APIs | Satisfied with evidence for local account/app-token architecture. Local isActive must be boolean true; DB/version checked each request. Logout/password change invalidate app sessions. Firebase-console-only revocation is explicitly not promised. |
| D: complete session review and bounded high-risk repairs | Review satisfied; architecture replacement partially satisfied/deferred with explicit residual blocker. See session review for XSS/localStorage risk, cookie migration proposal and deployment constraints. |
| E: dependency review with scoped safe fixes | Review satisfied; security gate conditional because67 high frontend findings remain unaccepted residuals. Full inventory/owners/next steps recorded; no force fix, suppression or major downgrade. |
| F: original regressions fail before and pass after | Satisfied: original 12 new tests against archived baseline produced10 expected failures/2 passes; current full suites39 backend +22 frontend pass. |
| G: documented compatible API and actual schema | Satisfied: API_CONTRACT.md plus OpenAPI3.1, GET catalog and money fixture verification. Prose records semantic guarantees/limitations beyond structural schema. |
| H: tests/build/lint/clean reviewable branch | Satisfied locally; detailed evidence below. Branch ready for draft PR review, not main integration. |
| I: independent Claude review/human approval | Not satisfied yet; deliberately awaiting review. No VERIFIED status, merge or deployment. |

## 3. Initial findings and implementation decisions

Both requested documents were read before code edits; branch, clean initial status, relevant source/tests/dependency versions and consumers were inspected. The task plan is `docs/remediation/phase-0.1-plan.md`; the original task and master workflow are preserved. Remote main was fetched and confirmed at33f7e7e. The initially isolated branch was renamed to the user's requested convention after the later master workflow arrived; no existing user changes were reset/discarded.

| Finding | Root cause | Implemented remediation / regression result | Remaining risk |
| --- | --- | --- | --- |
| A | `$lookup` joined every category by name, without owner/type restriction; unwind multiplied totals. | Filter metadata inside lookup by local owner or genuine global default and transaction type, sort deterministically, limit1 without unwind multiplication. Validate active visible names on writes. Two-user reports/default/archive tests PASSED. | Legacy name references and non-unique category rows remain; referenced rename blocked rather than silently migrating history. Category check/write and archive/delete can race without referential transaction constraints. |
| B | Aggregation `$match` used JWT string owner ID against stored ObjectId; independent floating-point/report/date paths disagreed. UI rounded away cents and substituted planned income for zero recorded income. | Shared service casts owner, validates stored records, sums Decimal128 minor units and calculates net from integer units; UTC calendar/ISO range policy. API and frontend money tests PASSED. | No per-transaction currency or user timezone; legacy malformed records require reviewed repair, not auto rounding. Full-owner validation has performance cost. |
| C | Signature-only app JWT verification never loaded account state; local logout/password change did not invalidate old tokens. | Check actual active/existing user/current role/sessionVersion each protected request; atomic all-session version increment on logout/password change. Session/regression tests PASSED. | Existing requests already past auth are not canceled. Firebase-console disable alone is not app revocation. Re-enable without increment can restore still-valid tokens; operational policy documented. |

Existing tests concentrated on login/password/provider exchange/redirects and mocked provider identities; no real two-user report aggregation or old-token-after-disable test existed. Original invalid-signature mock now uses the Admin SDK error code; its401 intent is preserved, with a new separate unexpected-error500 assertion rather than weakening that test.

## 4. Detailed file-change table

| File path | Change type | Purpose | Implementation / key symbols | Before → after behavior | Verification |
| --- | --- | --- | --- | --- | --- |
| `AGENTS.md` | Created | Persist user workflow for later repository work | Repository instructions | Enforces branch/report/review handoff; no automatic next phase | Source review |
| `README.md` | Modified | Link active workflow/contracts | Current engineering roadmap | Historical endpoint examples superseded | Documentation link check |
| `app.js` | Created | Test actual application wiring without production bootstrap | createApp | Existing routes/static fallback plus explicit CORS, body limit, no-store, safe errors/logging | stabilization integration tests |
| `server.js` | Modified | Keep bootstrap separate and avoid raw initialization error disclosure | createApp bootstrap | Startup behavior preserved; safe top-level failure catch | Syntax + app integration tests; startup E2E not run |
| `controllers/categoryController.js` | Modified | Fix usage aggregation and category mutation validation | getCategoryStatsController | Shared owner-safe reports; escaped duplicate checks; in-use rename conflict | stabilization tests |
| `controllers/dashboardController.js` | Modified | Use authoritative shared exact-money reports | overview/monthly/category/top controllers | UTC ranges, safe metadata, no multiplied rows | stabilization + contract fixture tests |
| `controllers/transactionController.js` | Modified | Fix zero summary; validate category and query boundaries | CRUD/getTransactionStatsController | Cast owner via service; validated values, bounded literal searches, safe errors | stabilization tests |
| `controllers/userController.js` | Modified | Revoke app sessions and map auth errors safely | generateToken/logoutController/changePasswordController | Version claims, atomic revocation, safe provider failures, bcrypt byte bounds | auth + stabilization tests |
| `middlewares/authMiddleware.js` | Modified | Check authoritative account on every protected request | authenticate/protect/requireSigningKey | Reject inactive/deleted/version-mismatched sessions; pin algorithm; current role | auth + stabilization tests |
| `middlewares/requireDb.js` | Modified | Return safe dependency error | requireDb | 503 DATABASE_UNAVAILABLE without database setup details | DB outage integration test |
| `models/userModel.js` | Modified | Add backward-compatible revocation counter | sessionVersion | Default0, not returned in profile; no financial rewrite | legacy-token/revocation tests |
| `routes/userRoute.js` | Modified | Wire server logout and signing-config guard | POST /logout | Authenticated logout; no registration writes without key | auth + stabilization tests |
| `services/categoryAccess.js` | Created | Centralize visible category policy | visibility/permittedCategory/metadataLookup | Owner/type filtered before deterministic one-row selection | two-user/default/orphan/archived tests |
| `services/financeSummary.js` | Created | One financial calculation source | financeSummary | Decimal minor-unit sums, validity facet, safe output, no client totals | summary/report/date/precision tests |
| `utils/apiError.js` | Created | Safe compatible error mapping | ApiError/fail/validate | Preserves success:false/message, adds known codes, hides raw errors | validation/provider/bad-data tests |
| `utils/finance.js` | Created | Money/date policy | validAmount/minorToNumber/parseDate/dateWindow | Bounded cents, explicit UTC ISO ranges and integrity error | money/date-boundary tests |
| `utils/requestValidation.js` | Created | API boundary rules | reportQuery/listQuery/idParam | Scalar allowlists, limits, valid path IDs | query/NoSQL-shape/literal-search tests |
| `config/connectDb.js` | Modified | Keep credentials/metadata out of logs | connectDb | Removes raw URI/host/error text; fallback architecture unchanged | Source/syntax review; production DB not accessed |
| `client/src/Components/AppShell.js` | Modified | Call actual server logout | handleLogout | Await server attempt, disable repeat tap, show warning if revocation unconfirmed | logout thunk + build/lint |
| `client/src/Pages/Dashboard.js` | Modified | Display recorded totals correctly | metrics/report state | Use API net, no planned-income fallback, unavailable state instead of fake zero | Dashboard.contract.test.js |
| `client/src/Pages/Profile.js` | Modified | Explain revoked password-change sessions | commitPasswordChange | User is told to sign in again | authSlice/logout tests + build/lint |
| `client/src/redux/slices/authSlice.js` | Modified | Integrate server revocation and device cleanup | logoutUser/changePassword.fulfilled | Clear device even offline; no false server-logout claim | logout.test.js |
| `client/src/redux/slices/dashboardSlice.js` | Modified | Keep missing summary distinct from zero | getDashboardOverview/overviewStatus/overviewError | Validate numeric contract fields, independent overview failure state | Dashboard.contract.test.js |
| `client/src/redux/store.js` | Modified | Clear private account caches | rootReducer | Reset private data on session end; install session guard | logout/account-switch tests |
| `client/src/redux/sessionGuard.js` | Created | Drop late previous-account data/profile responses | createSessionGuard | Request-ID/token association in memory only | late finance/profile response tests |
| `client/src/utils/finance.js` | Modified | Do not hide cents/invalid values | formatCurrency | Two decimal places; malformed values are Unavailable | dashboard/formatter regression tests |
| `client/src/test-fixtures/finance-contract.json` | Created | Deterministic API-to-UI money fixture | stats/overview numeric fields | Shared 10 income,0.30 expense,9.70 net fixture; not a full HTTP snapshot | backend fixture + real dashboard rendering |
| `tests/auth.test.js` | Modified | Preserve auth intent and extend outage/revocation coverage | provider mocks/password change | Invalid mock now carries real SDK error code; unexpected error separately tests500 | 12 auth integration tests |
| `tests/stabilization.test.js` | Created | Real MongoDB + full application regressions | two-user fixtures/createApp | Isolation, cents, filters, auth state, contract, defaults and errors | 23 new integration tests |
| `client/src/Pages/Dashboard.contract.test.js` | Created | Render actual dashboard through Redux | fixture/API mock | Checks cents/net/zero-income/missing-data states | 4 frontend tests |
| `client/src/redux/slices/logout.test.js` | Created | Session/privacy regressions | logoutUser/rootReducer/sessionGuard | Online/offline logout, revocation, cache isolation and late responses | 5 frontend tests |
| `package.json` | Modified | Remove unused vulnerable root packages; scoped security versions | dependencies | No framework/SDK major upgrade | full backend/client/build per batch |
| `package-lock.json` | Modified | Lock reviewed backend dependency resolutions | npm lockfile | Legacy package tree removed; targeted compatible patches | npm audit + tests/build |
| `client/.env.development` | Created | Restrict vulnerable dev-server network exposure | HOST development-only setting | CRA defaults to all interfaces; local development binds loopback, production build unaffected | Installed start-script inspection and CRA env-loader check |
| `client/package.json` | Modified | Patch three relevant direct dependencies | axios/react-router-dom/postcss | Same-major security updates | frontend tests/build + backend regression suite |
| `client/package-lock.json` | Modified | Patch compatible vulnerable leaves | npm lockfile | Respect parent ranges, no force fix/override | audit/tests/build |
| `docs/API_CONTRACT.md` | Created | Authoritative frontend-facing contract | all implemented API groups | Real fields/types/examples/errors/empty states; limitations explicit | machine GET contract test + manual source review |
| `docs/api/openapi.json` | Created | Machine-readable structural contract | OpenAPI3.1 schemas/paths | Actual routes, shared error schemas, no planned endpoints disguised as implemented | GET catalog integration test; semantic rules in prose |
| `docs/ENGINEERING_WORKFLOW.md` | Created | Save exact user master workflow | user-authored workflow | Dedicated branches, independent Claude review and human merge gate | Byte-for-byte source copy check |
| `docs/remediation/phase-0.1-request.md` | Created | Preserve original acceptance criteria | user-authored Phase0.1 request | Review package retains original task | Byte-for-byte source copy check |
| `docs/remediation/phase-0.1-plan.md` | Created | Record pre-implementation contract impacts | finding/file/test plan | Scopes fixes, deferred architecture and behavior changes | Self-review against diff |
| `docs/remediation/phase-0.1-verification.json` | Created | Machine-readable verification results | checks/dependencies/review state | Explicit PASSED/NOT RUN/NOT APPLICABLE; no production claim | Evidence consistency review |
| `docs/security/session-review-phase-0.1.md` | Created | Complete session threat/data-flow review | token lifecycle/Phase1 design | LocalStorage residual and Firebase/local authority distinctions explicit | code + auth/privacy tests |
| `docs/security/dependency-review-phase-0.1.md` | Created | Triage actual advisories and compatibility | dependency review | Exploitability context, owners, residual blockers and patch decisions | npm audit/ls/explain + official changelogs |
| `docs/security/dependency-review-phase-0.1.json` | Created | Retain all residual advisory paths and version changes | audit inventory | No suppressed findings; point-in-time before/after counts | npm tooling outputs |
| `docs/api/current-endpoints.md` | Modified | Prevent stale API baseline confusion | historical notice | Original Phase0 text preserved, points to current contract | Link/source review |
| `docs/architecture/current-state.md` | Modified | Preserve historical audit with current pointer | historical notice | Original findings not silently rewritten | Link/source review |
| `docs/security/risk-register.md` | Modified | Preserve initial findings with remediation pointer | historical notice | Avoid implying old audit is current implementation | Link/source review |
| `docs/remediation/evidence/phase-0.1-*.txt` | Created | Actual verification output | Before/backend/frontend/build/lint/syntax evidence | Explicit expected initial failures and final passes | Commands/results below |
| `docs/engineering-reports/2026-10-18-phase-0-1-remediation.md` | Created | Review handoff | This report | Distinguishes implementation readiness from independent approval | Report/diff consistency check |

## 5. Backend implementation

`server.js` retains bootstrap/DB/category initialization; `createApp()` exposes the actual middleware/routes for integration tests, not a fake controller-only app. Corrected routes retain requireDb/protect, use safe error mapping and body/query/path validation. Category lists and joins preserve shared defaults only when `isSystem:true,userId:null`; historical owned ledger names survive missing/archived categories with safe metadata. Write validation consumes Joi's validated values, pins ownership, and rejects unknown body properties.

`financeSummary()` is the single server calculation path for transaction summary, category usage, category/top reports, monthly summary and dashboard overview. It matches owner ObjectId first, validates numeric/type/date/category data, computes exact Decimal128 minor-unit sums, and formats safe major-unit numbers. Date-only UTC ranges and year end include the final millisecond. Unsupported refunds/transfers are rejected, not reinterpreted; there are no account/transfer/investment/goal features added.

Authentication continues to exchange verified Firebase Google identity or bcrypt credentials for a7-day app JWT. Protected routes pin HS256, load local active account and current role, check sessionVersion and fail safely if auth DB is unavailable. Missing signing configuration blocks public auth before writes. Known provider infrastructure failure503 is distinct from invalid token401/unexpected500; no raw exception is returned. Request IDs/full startup validation/readiness are deferred Phase1 work.

## 6. API contract changes

Authoritative details, examples and statuses: `docs/API_CONTRACT.md`; machine-readable `docs/api/openapi.json`. Covered implemented APIs: health; register/login/Firebase/profile/password/delete/logout; transaction CRUD/list/summary; category CRUD/defaults/usage; dashboard overview/monthly/category/top reports. Planned domains are explicitly not implemented.

Necessary behavior changes: POST `/users/logout` is added, all prior app sessions revoke on acknowledged logout/password change, disabled/deleted sessions fail; category writes require active visible matching type, in-use rename409; query limit1–100 and stable tie-breaker, literal search, malformed IDs/ranges400; transaction amount finite positive<=1e9 with<=2 decimals; malformed existing finance data422; UTC month/year/range windows and date-only inclusive end; frontend cents and recorded income/net. Existing success wrappers/field names and Number storage remain. Legacy message-only errors remain supported while corrected paths add stable codes. No arbitrary global wrapper conversion.

Averages round positive half-up to minor units. Yearly reports may include explicitly selected future-dated records; default month/year-to-now excludes future records. Date-only end uses exclusive next midnight, timestamp end inclusive. Local ledger currency metadata/label mismatch is a residual design issue, not silently converted money. Profile budgets/income remain planned settings, not authoritative totals.

## 7. Database and data integrity

Only schema addition: user sessionVersion Number, default0/min0/select:false. Old missing-version app tokens are version0; no destructive migration/backfill or new financial model/index was applied. Single-document `$inc`/password update atomicity works without multi-document transaction topology assumptions. No MongoDB transactions were introduced or unsupported atomicity claimed.

Finance records are never rewritten by reports. Invalid owned amount/type/date/category or unsafe sums yield422 with no raw record data. Manual repair must start with a backup and read-only inventory/dry run, explicit policy and approval; preserve original amounts/history, counts and rollback plan. Categories still store transaction references by name; archive is safe for history, delete/check and concurrent duplicate category creation are not fully atomic. Transaction retries remain non-idempotent and concurrent edits last-write-wins. Account deletion remains a three-write cascade with partial-failure risk. These are explicit future release gates, not hidden fixes or new goals/features.

Rollback: financial records unchanged. **Do not deploy the old signature-only verifier as a rollback after sessionVersion revocation**, since it ignores versions and can revive tokens. An emergency rollback must preserve current account/version checks or rotate the JWT secret deliberately (forcing all logins) with human approval. No such rollback/rotation was executed. See review questions for safe operational acceptance.

## 8. Security and privacy

See `docs/security/session-review-phase-0.1.md` for full credential sequence and threat review. App JWT remains in localStorage (high residual XSS risk); Firebase persistence is in-memory/signs out after exchange. No cookie/refresh-token/sessionStorage architecture added, so conventional ambient-cookie CSRF is not introduced. Explicit non-credentialed CORS and no-store apply; React text rendering avoids intentional raw HTML. UI clears local token/private state after logout even if offline and warns if server revocation cannot be confirmed. Late old-account data/profile completions cannot populate a new identity's cache.

Authoritative disable is local isActive boolean true; deleting a local user denies its tokens. Firebase status/revocation checks per API request were not added. Local disable/re-enable and all-device logout semantics are explicitly documented. Provider outages do not interrupt already valid active app sessions. New passwords/register passwords are bounded by bcrypt's72-byte input limit; existing password verification is retained.

No production database/financial data was used. All fixtures are synthetic, integration databases disposable. Raw URI/host/provider/token error logging was removed from affected paths; HTTP log omits query/body/identity, startup failures are generic. Targeted new-file/diff secret checks are limited review, not a guarantee of secret absence. Prior tracked masked logs are historical and not included in the review ZIP; no credential rotation or history rewrite was performed.

## 9. Dependencies and technology decisions

Full package/advisory/path/version review: `docs/security/dependency-review-phase-0.1.md` and JSON companion. Before backend26 findings (5 critical/8 high); final0 known findings including omit-dev. Before frontend110 (4 critical/84 high); final87 (0 critical/67 high/15 moderate/5 low). Counts include inherited/tooling findings, not proven independent production exploits. No zero-security-risk claim.

Removed root unused antd, direct lodash declaration, mock-mongoose, moment and nedb-promises; frontend antd retained. Root Express5.3.0/CORS2.8.6/Joi18.3.0/Mongoose8.24.5/Morgan1.12.1 and client Axios1.20.0/Router7.18.4/PostCSS8.5.30 remain on their existing major lines. Targeted compatible leaf patches removed critical form-data/proxy-addr/shell-quote/websocket-driver and patched reachable parser/router/validation packages. Npm audit fix force/major SDK downgrade/unsafe override were not used. Package inventories and exact old/new lockfile versions are retained.

Remaining CRA and unused Firestore/gRPC chain advisories are assigned to maintainer + independent reviewer with next steps; no implicit acceptance. Build source maps contain Firebase Auth modules and no Firestore/gRPC sources, supporting the limited current-browser reachability assessment, not package certification. A major toolchain/SDK migration requires its own reviewed plan; no dependency was changed merely because newer exists.

## 10. Frontend integration

Clients keep the current base URL and Bearer headers; use real typed fields in API_CONTRACT.md. Dashboard consumes recorded `overview.currentMonth.netBalance`, preserves two decimals, never swaps configured income into a valid zero. Missing/malformed overview produces unavailable/retry, not success0. Independent overview status avoids other chart requests masking that failure. Existing loading/empty/auth-refresh flows remain.

Logout calls `/users/logout`, prevents repeat clicks, clears local data and handles server failure honestly. Password changes revoke tokens and prompt re-login. Root state and session guard prevent stale finance/profile responses from crossing sessions. The shared numerical fixture checks API monetary fields and actual rendered dashboard through Redux; it is not a complete direct HTTP-browser E2E snapshot. No pink/purple aesthetic redesign or new dashboard feature was performed.

## 11. Tests and actual results

| Command / check | Status | Evidence |
| --- | --- | --- |
| `node --test tests/stabilization.test.js` against archived baseline source | FAILED AS EXPECTED | Initial12 tests:10 failures/2 passes proving defects; `evidence/phase-0.1-before.txt`. |
| `npm test` | PASSED | 39 backend tests,0 failures; real isolated MongoDB and full app integration plus prior auth/redirect/real-verifier negative tests. |
| `CI=true npm test --prefix client -- --watchAll=false --runInBand` | PASSED | 8 suites,22 tests,0 failures; prior13 + new9 meaningful rendering/session tests. |
| `CI=true npm run build --prefix client` | PASSED | Production build, no suppressed ESLint error. Node tooling deprecation warning remains. |
| `./client/node_modules/.bin/eslint client/src/Components/AppShell.js client/src/Pages/Dashboard.js client/src/Pages/Profile.js client/src/Pages/Dashboard.contract.test.js client/src/redux/slices/authSlice.js client/src/redux/slices/dashboardSlice.js client/src/redux/slices/logout.test.js client/src/redux/store.js client/src/redux/sessionGuard.js client/src/utils/finance.js` | PASSED | No findings, exit0. No separate backend lint script exists. |
| `node --check` all changed/new backend JS | PASSED |18 files, recorded syntax evidence. |
| `npm audit --json`; `npm audit --omit=dev --json`; `npm audit --prefix client --json` | PASSED for execution; residual risks open | Root0 known; client87 with67 high. Audit exit1 for residual findings is recorded, not misrepresented as a clean scan. |
| TypeScript checks | NOT APPLICABLE | JavaScript project; no configured type-check script. |
| Interactive Google login/browser E2E on this revision | NOT RUN | No remediation-branch deployment or configured local real-provider session. Mock-provider exchange/outage tests and actual Admin verifier forged-token rejection run. Prior live login from Phase0 is not evidence for this revision. |
| Production DB explain/load/backup-restore/browser viewport suite | NOT RUN | No production data access or new topology/scale claims. No browser E2E runner exists in repository. |
| GitHub CI | Pending at report creation | Final response/review package records actual PR check result and latest SHA after push; do not infer it from local pass. |

Dependency batches were followed by backend/frontend suites and a production build: unused root removal + root direct patches; client direct security patches; root vulnerable leaf patches; client critical leaves; compatible client security leaves; client dev-server Express patch. No major framework changes were used to silence audit warnings. Intermediate fixture/error-state test failures were corrected and final results above supersede them. No existing test intent was weakened.

Full outputs: `docs/remediation/evidence/phase-0.1-backend.txt`, frontend/build/lint/syntax counterparts; structured statuses: `docs/remediation/phase-0.1-verification.json`. New-file/diff review and whitespace checks run before commit.

## 12. Performance and scalability

User-status lookup adds one database read per protected request; no provider network call/cache was added. Finance aggregation validates all owned records before date filtering to avoid hiding malformed data; this intentionally scans owner history, and overview currently calls the shared service three times. Facets can grow with category/day cardinality and hit MongoDB output/memory limits. This is a documented performance tradeoff requiring measured Phase2 optimization that preserves the integrity check, not a scale guarantee.

List pagination caps100 and uses stable sort plus owner scoping; large offset pages still cost work. Existing owner/date/type indexes are reused; no random new index, production explain or load benchmark is claimed. Category lookup chooses1 deterministic row after visibility/type filtering; grouping uses category+type so no join fanout inflates sums. Multiple overview reads/count queries are not a point-in-time snapshot under concurrent mutations. Idempotency, uniqueness and multi-record atomicity need future design/tests.

## 13. Deployment and configuration

No production deployment, merge, settings change, paid infrastructure or financial migration. Existing server/public auth env names (plus development-only HOST): NODE_ENV,PORT,MONGO_URL,MONGO_LOCAL_URL,JWT_SECRET,FIREBASE_PROJECT_ID,FRONTEND_URL and client REACT_APP_API_URL/REACT_APP_FIREBASE_API_KEY/REACT_APP_FIREBASE_AUTH_DOMAIN/REACT_APP_FIREBASE_PROJECT_ID/REACT_APP_FIREBASE_APP_ID. Development-only HOST is a loopback binding and not a secret; no secret values or private service-account key are needed in this report. FRONTEND_URL must be exact trusted origin. Keep strong JWT key and matching Firebase project.

After independent review and explicit approval, deploy matched backend/frontend commits together because logout/password/session contracts changed. Root/frontend builds remain npm install/start and static build; free Render cold starts remain. Deploy only reviewed commit, smoke test active Google/email/refresh/logout, verify no token/private data in logs and record safe rollback. Current branch is not live; existing production issues are not claimed fixed there.

Read-only GitHub protection check: main returned404 Branch not protected, repository rulesets[]. No setting modified. Recommend PR-required main, required CI/review, stale approval dismissal, force-push/deletion restrictions and secret/dependency alerts where supported, but only after user authorizes settings changes. Written workflow does not enforce GitHub protection.

## 14. Known issues and residual risks

Explicit release blockers/owner: (1) localStorage XSS/session architecture — maintainer + Phase1 security reviewer; design/migrate one coherent session mechanism and test Safari/CSRF/CORS. (2)67 high frontend dependency findings — maintainer + independent reviewer; inspect exact pinned paths and approved parent/toolchain fixes, no blanket acceptance. (3) independent Claude review and human merge approval — user/reviewer; not performed.

Other documented future work: currency/transaction semantics and timezone settings; precision-safe historical data repair with approval; category uniqueness/stable references and check/write races; non-idempotent transaction retries; last-write-wins edits; account-deletion atomicity/retention/export and backup restore; readiness/request IDs/config validation/observability; report query optimization/load/explain testing; real provider/deployed browser E2E on this revision. Existing frontend CSV formula safety and financial-health heuristics are not hardened by this phase. No later roadmap phase starts automatically.

## 15. Independent review package

Provide Claude the final report, actual base-to-head patch and source ZIP with SHA256 manifest, original Phase0.1 request, master workflow, roadmap, relevant source/models/routes, current API/OpenAPI and test evidence. A report alone is not proof. The ZIP excludes node_modules/build/secrets and historical logs; reproducible dependencies come from lockfiles. Final response supplies draft PR, actual commits and the output paths. Do not assume Claude can access local paths or GitHub; attach the ZIP/patch/report or supply accessible copies.

Review questions: Does every aggregation stage enforce owner/type visibility before selection? Can duplicates, corrupted legacy money/date/type or unsupported transactions distort totals? Are UTC/precision/average/zero policies correct? Does legacy version0 compatibility preserve intended access without bypassing logout/password/disable? Can any previous-account async response repopulate another account? Are localStorage and Firebase-only disable limitations honestly gated? Are dependency risk classifications/pinned paths and no-major decisions justified? Are API schemas/examples and all reported test outcomes supported by actual code? Do failure states ever display invented successful totals? Is rollback safe for revocation? What measured optimization is needed before larger data volumes?

Self-review is complete; Claude review is **not** claimed. No merge/main push/deployment is authorized by the presence of this report or a green CI badge.

## 16. Final status

**IMPLEMENTATION COMPLETE — AWAITING CLAUDE REVIEW**

Phase0.1 engineering assessment: **CONDITIONAL PASS** — the three defects have tested remediations and the review/documentation work is delivered, with explicit residual security/release blockers and unavailable real-provider/deployment evidence. This is not VERIFIED, full production readiness or permission to begin Phase1. User's next action: supply the review package to Claude, return its findings, then authorize any required fixes. Final merge approval is requested only after required review/security gates are actually met.
