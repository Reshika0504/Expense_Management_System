# Testing and verification

Evidence must name the task, full source revision, exact command, execution environment, actual result and limitations. Distinguish PASSED / FAILED / BLOCKED / NOT RUN / NOT APPLICABLE. Expected failing baseline probes are evidence of defects, not a passing release gate. Do not claim test coverage percentages without measurement.

| Task | Verification |
| --- | --- |
| Phase 0 audit | [Baseline observations](../audit/phase0-baseline.json), [architecture](../architecture/current-state.md), [historical report locator](../engineering-reports/2026-10-17-phase-0-audit.md) |
| Phase 0.1 | [Testing/evidence locator](phase-0.1/README.md); preserves established remediation evidence paths |
| Centralized handoff | [Documentation verification](centralized-review-handoff.md) |

## Reusable application commands

From the verified repository root, use the declared Node/npm versions and lockfiles. Inspect tests/configuration first. Installation needs network and changes local dependencies; run only in an authorized development/CI environment. Tests must use disposable synthetic MongoDB fixtures, never production credentials or finance data.

```sh
npm ci
npm ci --prefix client
npm test
CI=true npm test --prefix client -- --watchAll=false --runInBand
CI=true npm run build --prefix client
node scripts/audit-phase0.cjs
npm audit --json
npm audit --omit=dev --json
npm audit --prefix client --json
```

See [CI configuration](../../.github/workflows/ci.yml) for what actually runs automatically. Audit exit 1 means findings remain; do not call it a clean scan. Dependency installation/audit results are point-in-time and may change. No configured TypeScript checker or real-provider browser E2E runner exists at Phase 0.1. Use task-specific lint/syntax checks documented in the engineering report; do not invent a global lint command.

## Evidence storage

New summaries belong under `docs/testing/<task-id>/` or a concise task Markdown file. Link existing evidence at its established path instead of copying it. Store only sanitized minimal logs/CI metadata; no credentials, cookies, personal financial data, installed dependencies or build bundles. If evidence cannot safely be committed, record its verified location, revision, access owner and safe access method. Re-run affected checks after material changes; an old success cannot certify a new head.
