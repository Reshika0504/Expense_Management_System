# Post-review verification — executed checks and limits

Source: application PR #1 `feb94f70efa58eaccdb91dea61a0e8c2d346b08d`; assessment baseline `7f1c1f3a3ef6d05cc8b3c78e0001fd63536fe7e2`; branch `codex/phase-0-1-post-review-20261018`. Commands below executed locally on 2026-10-18, Node 24.21.0/npm 11.19.0. Resolve the live assessment PR full head before relying on current CI. New5 audit tests are on the assessment branch, not on unchanged PR #1.

| Actual command/check | Result / evidence |
| --- | --- |
| `git status --short`; `git branch --show-current`; `git remote -v`; `git fetch origin`; `gh pr view 1 --json headRefOid,baseRefName,state` | Root/origin/currentwork verified; only supplied review initially untracked; PR #1 head feb94f7 |
| Python env filename/name/presence-only inspection | No available production/audit URI/database env/local config; no values printed. No production connection/role verification attempted |
| `node --test tests/legacyInventory.test.js` | PASSED5 tests; actual authenticated disposable MongoDB, reader-only counts, denied write, before/after equality and18 actual-service parity cases; [output](inventory-tests.txt) |
| `npm test` | PASSED44 backend tests,0 fail; [output](backend-tests.txt) |
| `CI=true npm test --prefix client -- --watchAll=false --runInBand` | PASSED8 suites/22 tests; [output](frontend-tests.txt) |
| `CI=true npm run build --prefix client` | PASSED; [output](client-build.txt) |
| `node scripts/check-auth-only-bundle.cjs` | PASSED2 emitted maps/0 Firestore-gRPC source paths; [hashes/limited evidence](../../../security/post-review-phase-0.1/bundle-check.json) |
| `npm audit --json` | Executedexit 0,0 known findings; [raw JSON](../../../security/post-review-phase-0.1/backend-audit.json) |
| `npm audit --prefix client --json` | Executedexit 1,87 findings/67 high (unresolved, **not** a clean scan); [raw JSON](../../../security/post-review-phase-0.1/client-audit.json) |
| `env -u SPENDWISE_AUDIT_URI -u SPENDWISE_AUDIT_DATABASE -u SPENDWISE_AUDIT_APPROVED node scripts/read-only-legacy-inventory.cjs` | Expectedexit 1, safeBLOCKED/config required; no app fallback/DB connection; [JSON](audit-cli-no-access.json) |
| Python offline package-lock resolution + fresh audit classification | All67 high packages with installed paths/versions/full representative chains/parents/advisories/fix/exposure;63 toolchain/4 SDK,9 fixAvailable true; no mutation |

## Final consistency checks

PASSED on the initial assessment diff: 29 scoped files and 93 relative links, valid JSON/registry paths/full commits, actual review SHA256, unchanged manifests/locks and application runtime trees, all 67 package paths/classifications, explicit unexecuted production/browser state, limited credential-pattern and whitespace checks. Also PASSED: node syntax for both tools/new test; relative Markdown links and JSON/manifest paths; full Git refs; actual review hash; manifests/locks and application runtime trees unchanged vs baseline; staged diff/whitespace/scope and limited added-line credential-pattern scan. Re-run after material corrections; local checks do not certify production or independent review. No standalone backend lint/type checker configured; no type check invented.

## Remote CI

Once pushed, resolve the assessment PR by exact branch using `gh pr list --head codex/phase-0-1-post-review-20261018 --base main --json number,url,headRefOid`; inspect `gh pr checks <number>` and `gh run view <run-id> --json headSha,status,conclusion,url`. Require completed success matching the **live head**; the PR description records the verified final result after execution. Previous Phase 0.1/hand-off CI are historical evidence only.

## Not executed

Production inventory/counts/permission verification **BLOCKED**; no production credentials/verified read-only target, no read/write/migration/setting change. Manual browser/real Google **NOT RUN**; no matched preview deployed. Auth implementation, CSP/cookie change, package upgrade/lock regeneration, npm10 reproduction, live load/explain/backup/restore **NOT RUN / OUT OF SCOPE**. Actual browser-tested SHA none. [Structured audit/results](audit-results.json), [tracker](../../../reviews/phase-0.1/post-review-remediation-tracker.md), [acceptance gates](../../../reviews/phase-0.1/post-review-acceptance-checklist.md).

**BLOCKED — PRODUCTION AUDIT ACCESS REQUIRED**
