# Phase 0.1 — audit access resolved and browser evidence

18 October 2026. Branch `codex/phase-0-1-post-review-20261018`, draft PR #3. Follow-up baseline `e8cd35688f870e90379362c1e1ccad1575aa9cf4`; original assessment baseline `7f1c1f3a3ef6d05cc8b3c78e0001fd63536fe7e2`; reviewed application PR #1 `feb94f70efa58eaccdb91dea61a0e8c2d346b08d`. Resolve current full PR #3 head for follow-up source/CI/re-review; this report does not invent its own future commit SHA. Local browser-tested application source is exactly e8cd356, whose runtime files equal feb94f7. New changes are audit/manual-test tooling and documentation, not application auth/finance code.

## 1. Executive summary

**The database-access blocker is resolved.** The owner clarified there are no real users and the existing SpendWise test database may be reset if needed. Using existing Google SSO, Atlas became accessible. Render's actual MONGO_URL was inspected privately only to attest the correct target, `expense_management` / Cluster0. The executed read-only inventory found **12 transactions, 0 invalid/overprecision records, 0 affected users**. No reset or data mutation was needed/performed. No paid upgrade, role/network change or credentials saved.

Additional actual browser smoke used compiled candidate UI and matching backend on a fresh disposable database: email register/login/refresh/logout, wrong password, cents create/edit/delete and genuine zero summaries passed. Real owner Google login/refresh/logout passed in Safari. In-app-browser Google attempt returned a network error; cause is unproven. F-05 stale second-tab UI remains reproducible. Full browser matrix/independent re-review/High-risk decisions remain open; no merge/deploy/Phase 1.

## 2. Acceptance criteria

| Requirement | Current evidence |
| --- | --- |
| Take over access/inventory without requiring user CLI work | Satisfied: existing Atlas account accessed; exact Render database privately verified; counts-only query executed |
| Preserve existing data unless reset required | Satisfied: current 12 records valid; optional reset authorization recorded, no destructive action needed |
| No raw financial records/identities/credentials in reports | Counts-only result, private URI metadata attestation, synthetic screenshots only; no Google identity screenshot/token retained |
| Executable audited procedure and genuine test results | JSON Atlas pipeline derived from same native driver predicate, compared over 18 real-Mongo cases; full 44 backend passed |
| Browser evidence at exact source revision | Actual local source e8cd356, runtime equal to reviewed feb94f7; subset executed and expected/actual recorded |
| No authentication/dependency implementation, merge/deploy/Phase 1 | Application files/manifests/locks unchanged; main/PR #1 not pushed or merged |
| Full release/security/independent review acceptance | Not satisfied; current evidence does not accept High risks or close every browser row |

## 3. Findings and decisions

Earlier local env/CLI access was absent; this was a real local limitation, not a requirement for the user to operate commands. Existing Safari Google SSO restored Atlas access. Render shell requested paid compute and was canceled. Multiple databases existed; Render config identified only `expense_management`, so no database name was guessed. No private URI was copied to reports, process arguments or files. Existing account access was reused; no permissions expanded.

The Atlas operation is read-only even though the existing web account is not certified as a dedicated read-only DB principal. Original CLI strict permission guard remains unchanged; no claimed CLI completion/bypass. Public browser Firebase config was read from the existing deployed static assets only for an isolated local build; no secret/service-account file was obtained.

Because all 12 financial records satisfy the candidate predicate, neither rounding/repair nor destructive reset is necessary. This snapshot satisfies both possible pre-merge/pre-deploy inventory sequencing readings. It does not certify future writes or unrelated record rules; rerun if data changes before deployment.

## 4. File changes

| Repository-relative path | Change / reason | Verification |
| --- | --- | --- |
| `scripts/read-only-legacy-inventory.cjs` | Add atlasInventoryPipeline: convert driver Decimal128 constants into JSON $convert expressions; no predicate or CLI permission change | 18 real-Mongo parity cases against driver and actual finance service |
| `tests/legacyInventory.test.js` | Compare Atlas JSON results with native driver results for existing 18 cases | 5 dedicated tests/full 44 backend pass |
| `scripts/local-browser-smoke.cjs` | Explicit --build/--serve manual harness: fixed public config source, loopback only, random ephemeral signing key, always disposable MongoMemoryServer, no external DB env/bootstrap | Build and actual browser run; syntax/cleanup checked. Final path/report-key corrections do not alter app runtime |
| `docs/testing/phase-0.1/post-review/atlas-read-only-inventory.pipeline.json` | Reproducible exact JSON query, no write stages | SHA256 in dated result; synthetic parity and actual Atlas Run |
| `docs/testing/phase-0.1/post-review/2026-10-18-atlas-inventory-results.json` | Actual 18 counters, private target attestation, method/permission/limit/time/snapshot/reset boundaries | UI result verified twice; collection count 12 agrees |
| `docs/testing/phase-0.1/post-review/2026-10-18-browser-smoke-results.md`, same-name JSON | Expected/actual local browser subset and explicit remaining cases/known issues | Actual UI events, no invented full E 2E pass |
| `docs/testing/phase-0.1/post-review/local-browser-build.json`, `local-browser-build.txt` | Matched local API/public-config build provenance, no public config values in report | Build executed successfully at e8cd356 |
| `docs/testing/phase-0.1/post-review/browser-empty.png`, `browser-cents.png`, `browser-stale-session.png`, `browser-google-network-error.png` | Synthetic-only browser evidence | Visual check; no actual identity/financial records |
| `docs/testing/phase-0.1/post-review/atlas-inventory-tests.txt`, `atlas-backend-tests.txt` | Actual dedicated/full backend output | 5/44 pass, no failures |
| `docs/testing/phase-0.1/post-review/restored-production-build.txt`, `restored-bundle-check.json` | Restore ordinary build after temporary local API build; retain bundle evidence | Build successful; 2 maps, 0 Firestore/gRPC path matches |
| `docs/testing/phase-0.1/post-review/legacy-data-audit.md`, `audit-results.json`, `browser-smoke-checklist.md`, `verification.md` | Preserve initial blocked snapshot while making current results discoverable | Links/JSON/status provenance checked |
| `docs/reviews/phase-0.1/post-review-remediation-tracker.md`, `post-review-acceptance-checklist.md`, `post-review-request.md`, `history.md` | F-02 cleared for this snapshot; F-04 partial; F-05/High risks open; actual owner authorization/result history | No original Claude report edits or fabricated acceptance |
| `docs/reviews/tasks.json`, `docs/reviews/README.md` | Current report/evidence/status discovery | Exact refs/paths and latest PR head resolution |
| `docs/engineering-reports/2026-10-18-phase-0-1-post-review-assessment.md` | Historical snapshot notice, original blocked findings retained | Additive provenance only |
| `docs/engineering-reports/2026-10-18-phase-0-1-audit-access-followup.md` | This current report | Diff/criteria review |

Complete Git baseline-to-head changed-file list is authoritative.

## 5. Backend implementation

No application endpoint/controller/auth/money-service change. Audit JSON representation is derived from the existing predicate and tested for equal actual-Mongo outputs. Test harness is an explicit separate CLI, never imported by production startup; it does not read dotenv/MONGO_URL/connectDb or expose control endpoints. It binds 127.0.0.1: 4317, seeds only its own memory database and cleans up on signal.

## 6. API impact

No contract change. Candidate reports reject invalid legacy finance data 422; observed deployed dataset has 0 such records. Deployed backend observed at 33f7e7e remains unchanged; report predicate is the reviewed candidate feb94f7. Local browser uses `/api/v1` to its matching disposable backend, never the deployed API. Google exchanges the real provider credential only to that local candidate, not to a new third-party service.

## 7. Database integrity and reset

[Actual inventory](../testing/phase-0.1/post-review/2026-10-18-atlas-inventory-results.json): all 18 counts recorded, total 12 and all invalid/affected counters 0. Existing Atlas collection tab also showed 12; preview input limit observed 100000 exceeds this full dataset. Query has no sampling/write stages. No snapshot-isolation claim under concurrent writes. No per-record details, sums, names or owner IDs saved.

Owner-authorized test-data reset was optional and unnecessary. No deletion, rounding, migration, index/role/network setting change or Firebase identity deletion. Temporary local fixture users/transactions (including a local copy of the authenticated Google identity) existed only in the disposable database and were destroyed with the test server. Other databases were not queried for records or modified.

## 8. Security

No URI/password/JWT/Google identity recorded; scoped production CLI guard unchanged. Existing authenticated Atlas UI permission reused for read-only query; do not mislabel it a newly created scoped DB credential. F-01 localStorage and F-03 package risks unaccepted. F-05 stale second-tab screen reproduced, not fixed; reload returned to login. Browser exact HTTP status was not captured, so server rejection remains separately supported by actual backend regression tests.

## 9. Dependencies

No package/lock change or install/upgrade/fix command. Existing pinned Node 24/npm 11 and test dependencies used. Public Firebase browser config is intentionally present in compiled browser assets; report stores names/provenance, not values. No paid service or resource created.

## 10. Browser integration

Real Safari Google popup/owner account -> local candidate dashboard -> refresh -> logout passed. In-app-browser Google showed network error on the same configured candidate; no unsupported root cause claimed. Email registration/wrong-password/correct login/refresh/logout and 100− 33.33=66.67, edit 33.34→ 66.66, deletes→ 0.00 verified in real UI.

Remaining browser cases: expired/disabled/password-change controls, two-user custom category report overlap, offline/503, nonempty-zero-net 0.1+0.2 and date-boundary fixtures. Existing 44/22 tests are separate evidence. Old financial-health heuristic mislabels an empty ledger in narrow layout; ledger amounts are correct. These observations do not authorize extra implementation or full release PASS.

## 11. Commands and actual results

- `node --test tests/legacyInventory.test.js`: 5 passed, including new Atlas JSON equality across 18 cases; [output](../testing/phase-0.1/post-review/atlas-inventory-tests.txt).
- `npm test`: 44 backend tests passed; [output](../testing/phase-0.1/post-review/atlas-backend-tests.txt).
- `node scripts/local-browser-smoke.cjs --build`: PASSED; compiled public-config UI with local same-origin API. `--serve`: actual loopback-only disposable backend started, actual browser checks above completed, then gracefully stopped/DB cleaned.
- Atlas Data Explorer TEXT -> Run aggregation: actual 12/0-invalid counts, read-only, exact pipeline hash recorded. No guarded CLI production run claimed.
- `CI=true npm run build --prefix client`: PASSED after restoring the normal production build; [output](../testing/phase-0.1/post-review/restored-production-build.txt). `node scripts/check-auth-only-bundle.cjs`: 2 maps/0 Firestore-gRPC path matches; [result](../testing/phase-0.1/post-review/restored-bundle-check.json), limited reachability evidence only.
- Syntax, JSON, relative links, exact hashes, no runtime/manifest/lock changes, whitespace and targeted secret-pattern checks run before commit. Latest PR #3 CI checked after push, with result/head recorded in PR description; historical e8cd356 CI is not proof of a later head.

Frontend source unchanged; previous local 22 tests are historical same-source evidence, while updated PR CI runs the complete current suite. No production load/restore or complete browser matrix claimed.

## 12. Performance

Read-only inventory is a whole 12-record snapshot observation, not a scalable/performance guarantee. UI preview 100000 limit did not truncate the observed 12 records; future larger databases require reviewed CLI/operator query options. Synthetic query comparisons passed; no production load test performed.

## 13. Deployment/configuration

No main push/merge/deploy/settings change or paid upgrade. Existing live backend 33f7e7e not replaced. Manual local build temporarily set API base/public Firebase config, then restored the ordinary build. Local server and temporary browser tabs closed; existing user app tabs retained. Do not deploy an ignored local test build as evidence of a reviewed production rollout.

## 14. Residual gates

No database access block remains for this inventory. F-04 partially evidenced; F-05 actual UI limitation, F-01/F-03 unaccepted, independent re-review/human merge approval still pending. No Phase 1. Test-data reset permission does not silently accept High risks or authorize merging/deployment. Earlier blocked report/JSON states are explicitly historical.

## 15. Re-review package

Draft PR #3/current full head; follow-up diff from e8cd356, original Claude review unchanged, [actual Atlas result](../testing/phase-0.1/post-review/2026-10-18-atlas-inventory-results.json), exact JSON query, 18-case parity tests, manual harness/build provenance, [browser result table](../testing/phase-0.1/post-review/2026-10-18-browser-smoke-results.md), [tracker](../reviews/phase-0.1/post-review-remediation-tracker.md) and [acceptance checklist](../reviews/phase-0.1/post-review-acceptance-checklist.md). Inspect operation-vs-principal permissions distinction, source/config identity and partial-not-full browser claims. No automatic Claude execution/score or fabricated verdict.

## Delivery evidence and scope confirmation

Follow-up implementation was pushed as `a70100fa8ae68c018ecfceced2ccb25b2c3547b7` to the existing task branch. [CI run 39137014579](https://github.com/Reshika0504/Expense_Management_System/actions/runs/39137014579) completed successfully on that exact head: 44 backend tests, 22 frontend tests in 8 suites and production build. [Repository evidence](../testing/phase-0.1/post-review/2026-10-18-followup-ci-result.json) contains the run/head/steps and actual log assertions. This delivery metadata has its own subsequent commit; resolve and check that final head through PR #3 rather than transferring the earlier CI approval.

The owner explicitly restricted ongoing work to personal `Reshika0504/Expense_Management_System` and its previously verified SpendWise Render service `srv-d7eloh0sfn5c738en960`. All GitHub commands in this delivery use that exact repository. No unrelated repository/account/service is inspected or modified. No new Render action is required for this assessment delivery.

## 16. Final status

**ASSESSMENT COMPLETE — REMEDIATION PLAN AWAITING APPROVAL**

The former access blocker is resolved; the owner need not collect credentials or run the audit. No destructive reset needed. Findings/re-review/human approval gates remain tracked; this is not merge/deployment approval.
