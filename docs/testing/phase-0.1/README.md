# Phase 0.1 verification evidence

Submitted source: `feb94f70efa58eaccdb91dea61a0e8c2d346b08d`, task baseline `33f7e7ef017ab8bd8c12cb4cd990ad96405e2013`. This is historical evidence for PR #1, not certification of a later head or current production.

- [CI metadata](ci-result.json), [sanitized log excerpt](ci-excerpt.txt), [actual run](https://github.com/Reshika0504/Expense_Management_System/actions/runs/39127433829): completed / success at that exact SHA, 39 backend tests, 22 frontend tests, production build. Metadata was rechecked through GitHub during this documentation task on 2026-10-18. CI checkout may use a PR merge ref; the run headSha identifies the PR revision, and the checkout strategy remains inspectable in its logs/workflow.
- [Structured local verification](../../remediation/phase-0.1-verification.json).
- Preserved local command outputs: [expected failing baseline](../../remediation/evidence/phase-0.1-before.txt), [backend](../../remediation/evidence/phase-0.1-backend.txt), [frontend](../../remediation/evidence/phase-0.1-frontend.txt), [build](../../remediation/evidence/phase-0.1-build.txt), [lint](../../remediation/evidence/phase-0.1-lint.txt), [syntax](../../remediation/evidence/phase-0.1-syntax.txt), [development binding](../../remediation/evidence/phase-0.1-dev-binding.txt), [audit probe](../../remediation/evidence/phase-0.1-audit-probe.txt).
- [Engineering report commands, environments and limitations](../../engineering-reports/2026-10-18-phase-0-1-remediation.md).
- [Dependency review/inventory](../../security/dependency-review-phase-0.1.md): root 0 known, frontend 87 total / 67 high / 15 moderate / 5 low, no critical findings at the recorded audit time. This is not a new audit run or a zero-risk claim.

NOT RUN: real Google/browser E2E on the submitted remediation revision; production DB query/load/backup restore tests and browser viewport suite. Mocked-provider coverage and prior production login do not establish real-provider success at this revision. Claude review is pending. No evidence here accepts the localStorage or dependency release risks.

The original report's pending-CI line is preserved as a historical snapshot; this additive record provides the subsequently observed result. Its old ZIP/patch delivery directions are superseded by the repository-first [review request](../../reviews/phase-0.1/request.md).
