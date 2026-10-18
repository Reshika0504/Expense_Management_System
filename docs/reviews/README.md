# Independent review index

Read [the guide](../CLAUDE_REVIEW_GUIDE.md) and [the task registry](tasks.json). A human-selected PR/task takes precedence over registry defaults. Do not choose a task only by report date, branch checkout or highest PR number.

| Task | Review target and source baseline | Evidence / history | Primary status |
| --- | --- | --- | --- |
| Phase 0.1 remediation — pending application review | [Draft PR #1](https://github.com/Reshika0504/Expense_Management_System/pull/1), branch `codex/phase-0-1-remediation-20261018`, submitted head `feb94f70efa58eaccdb91dea61a0e8c2d346b08d`, baseline `33f7e7ef017ab8bd8c12cb4cd990ad96405e2013` | [Request](phase-0.1/request.md), [history](phase-0.1/history.md), [report](../engineering-reports/2026-10-18-phase-0-1-remediation.md), [CI evidence](../testing/phase-0.1/README.md) | IMPLEMENTATION COMPLETE — AWAITING CLAUDE REVIEW |
| Centralized review handoff — documentation task | [Draft PR #2](https://github.com/Reshika0504/Expense_Management_System/pull/2), branch `codex/centralized-review-handoff-20261018`; resolve live PR head through GitHub. Task baseline `feb94f70efa58eaccdb91dea61a0e8c2d346b08d` | [Request](centralized-review-handoff/request.md), [history](centralized-review-handoff/history.md), [report](../engineering-reports/2026-10-18-centralized-review-handoff.md), [verification](../testing/centralized-review-handoff.md) | IMPLEMENTATION COMPLETE — AWAITING CLAUDE REVIEW |

Default pending **application** review is Phase 0.1 / PR #1. The documentation task is a separate review, not its approval. Metadata for PR #1 was added afterward on the documentation branch; reviewers of PR #1 may need to read the guide/index on that branch, then inspect application source at PR #1's exact head. Do not silently substitute the docs branch as PR #1 source.

The docs branch descends from Phase 0.1 and targets main as requested. Its main-to-head PR diff therefore includes the pending Phase 0.1 changes. Review its new documentation against its task baseline, and review inherited application changes through PR #1. This dependent PR must not integrate unreviewed Phase 0.1 code. If PR #1 merges by squash/rebase, recompute the docs PR base/diff and rerun review/checks before any merge; no automatic retarget, merge or rebase is authorized here.

## Review records

Each task folder contains its request and append-only history. When a real Claude review arrives, save it as `YYYY-MM-DD-claude-review-<reviewed-sha-prefix>.md` in that folder; list its exact path in the registry. Never create an empty PASS report. Record finding ID, severity, exact source revision/file/line, impact, reproduction/evidence, recommendation, disposition and acceptance owner. Link remediation commits, regression evidence and exact re-reviewed heads. Record the human's actual final decision and date; pending is not acceptance.

A review verdict (PASS / CONDITIONAL PASS / FAIL) is distinct from the workflow primary status. Engineering self-assessment is not an independent verdict. All tasks remain awaiting review until real evidence changes that state.
