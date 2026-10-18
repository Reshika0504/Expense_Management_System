# Claude independent review guide

Repository: https://github.com/Reshika0504/Expense_Management_System

## 1. Establish real access and the intended task

Read [the index](reviews/README.md), [registry](reviews/tasks.json), [workflow](ENGINEERING_WORKFLOW.md), applicable [roadmap](SpendWise_Backend_First_Roadmap.md), original request, relevant engineering report and actual earlier reviews. The registry gives task-specific paths. User-selected PR/task overrides the default. If more than one plausible target remains, ask only which task/PR to review.

Connected repository access permits the operations actually exposed by that integration. A URL does not grant private repository access, local filesystem access or write permission. A folder attachment exposes only its supplied files; it may omit `.git`, ignored files, CI or unpushed changes. State these limits before relying on evidence. Use accessible repository/PR history first. Request only the missing file, revision, diff, output or permission needed; do not ask for routine ZIPs/patches when GitHub already supplies it.

## 2. Pin the revision; do not review an arbitrary checkout

Resolve the live PR base branch and head branch/full SHA, original task baseline, current merge base and changed files. Record all of them, along with the source of these observations and review date. A manifest's submitted SHA is a historical snapshot, not proof of the current head. Reject mismatched files or evidence as current proof. Preserve older reviews under their original revisions.

For a connected CLI with actual authorization, these are read-only examples (substitute the selected PR number and refs; do not assume CLI availability):

```sh
git rev-parse --show-toplevel
git status --short
gh pr view 1 --repo Reshika0504/Expense_Management_System --json url,baseRefName,headRefName,headRefOid,state,isDraft
git show <full-review-sha>:docs/API_CONTRACT.md
git diff --name-status <task-baseline-sha> <full-review-sha>
git diff <task-baseline-sha> <full-review-sha> -- <relevant-path>
gh pr checks 1 --repo Reshika0504/Expense_Management_System
gh run view <run-id> --repo Reshika0504/Expense_Management_System --json headSha,status,conclusion,url
```

If local Git objects are missing, use connector/API commit and PR file views or request the exact missing revision. Fetch only if the environment permits it. Do not reset, switch or discard the owner's checkout just to review; inspect commit-specific source read-only. A folder without Git metadata cannot establish a complete diff by itself. Report that gap and request accessible GitHub comparison data rather than pretending a file list proves the diff.

Inspect both the task-baseline-to-head diff and the live PR merge-base-to-head diff. In a dependent branch, distinguish the new task changes from inherited changes and review dependencies explicitly. If the head changes during review, record that your verdict applies only to the pinned head and require review of the new delta. Uncommitted/unpushed work is outside a GitHub-only review unless separately exposed and identified.

## 3. Inspect implementation and evidence

Read actual changed source and surrounding callers, middleware, models, queries, consumers and lockfiles where relevant. Reports guide review; they do not prove correctness. Read relevant tests and [API contract](API_CONTRACT.md) / [OpenAPI](api/openapi.json). Verify response/validation/error compatibility, authentication, authorization, owner scoping and cross-user isolation. Check monetary precision, income/expense semantics, dates, duplicate submissions/concurrency and aggregation against deterministic fixtures where applicable. Inspect database/index/migration/rollback implications; do not run destructive migrations or use real financial data.

Inspect session lifecycle, logging/secrets, dependency advisories and residual risk records. For Phase 0.1, the open localStorage XSS risk, 67 high frontend package findings (87 total), and missing real Google/browser E2E are mandatory checks; no evidence here resolves them. Consult [its request](reviews/phase-0.1/request.md) for exact source/evidence paths.

Compare reported commands/results with available logs and CI **head SHA**. Distinguish your own executed checks from supplied historical evidence, expected baseline failures, skipped checks and N/A checks. Inspect fixtures/assertions for meaningful coverage, not only totals. Use synthetic isolated data if authorized to run tests; never reveal secrets. Document missing regressions, integration risks and unsupported deployment/performance claims. For docs-only work, verify links, revision provenance, status consistency and scope instead of inventing runtime changes.

## 4. Report actionable findings and review limits

Include repository/task/PR, exact full reviewed head, task baseline, live merge base/base branch, inspected files and unexamined areas, commands actually run and supplied evidence checked. For each finding provide a stable ID, Critical/High/Medium/Low severity, source file/verified line at that SHA, observed behavior, impact, reproduction or reasoned evidence, precise recommended fix and verification expectation. Label inference explicitly. Investigate each earlier finding against the current source and cite fixes; do not treat an author's claim or changed line as verified remediation.

Conclude PASS, CONDITIONAL PASS or FAIL with reasons, unresolved blockers and exact tasks for Codex. If evidence is insufficient, identify the missing evidence and limit/withhold the affected acceptance decision. An optional score is supporting opinion, never correctness, security or merge proof. A review PASS does not authorize merge/deploy; the workflow and human approval still apply.

## 5. Save only with actual authorization

Review is read-only with respect to implementation. Do not fix source or start another phase without a separate explicit implementation request. If you genuinely have authorized report-write access, save the full dated report under `docs/reviews/<task-id>/`, update that task's history/registry only within that authorization, and state its exact path and reviewed SHA. Do not push, post GitHub comments or change settings without appropriate explicit authorization. If access is read-only, return the **complete report** and say it has not been saved; ask the authorized Codex workflow to save it. Never invent a saved file, test execution, Claude review or acceptance.

No repository document automatically invokes Claude, connects an account, imports local files, schedules review or transfers findings back to Codex. The human starts a review in an environment with the required repository/folder access. Reuse [the master prompt](CLAUDE_MASTER_REVIEW_PROMPT.md) for each review.
