# SpendWise — Centralized Project Files and Automatic Claude Review Handoff

## Objective

Update the existing SpendWise engineering workflow so that all project-related reports, review packages, test evidence, audit results and documentation are organized inside the existing SpendWise repository folder.

I will provide Claude with:
- The SpendWise GitHub repository URL.
- Access to the complete SpendWise project folder, where supported.
- A single reusable Claude review instruction.

I do not want to manually collect, copy, paste or upload separate reports, ZIP files, patches or source files for every task.

Codex must organize the repository so Claude can locate the relevant source code, changes, reports and verification evidence independently.

## 1. Identify the existing project root

First, identify the actual root directory of the existing SpendWise repository attached to this workspace.

Verify that it contains the expected project files and Git repository.

Use the existing project root. Do not create another SpendWise project, duplicate the repository, or save project reports in a separate Downloads, outputs or temporary folder.

Do not assume a local filesystem path without verifying it.

Preserve all existing user work and current Git branch state.

## 2. Establish this documentation structure

Use the following structure inside the existing repository, adapting only when equivalent directories already exist.

`docs/`

- `SpendWise_Backend_First_Roadmap.md`
- `ENGINEERING_WORKFLOW.md`
- `API_CONTRACT.md`
- `engineering-reports/`
- `reviews/`
- `testing/`
- `security/`

Required purposes:

### `docs/engineering-reports/`

Save a detailed Markdown engineering report after every task.

Each report must include the task description, implementation details, changed files, architecture decisions, API changes, database changes, security considerations, tests executed, actual results, known issues, migration requirements and Git commit reference.

Use descriptive, date-based filenames. Never overwrite unrelated historical reports.

### `docs/reviews/`

Maintain the independent review history for each task.

Include:
- Claude review requests.
- Review findings received from Claude.
- Finding status and severity.
- Codex remediation summaries.
- Re-review results.
- Final acceptance decision.

Do not invent Claude findings or mark a review complete unless the actual review evidence is available.

### `docs/testing/`

Maintain reusable testing instructions, test plans and verification summaries where appropriate.

### `docs/security/`

Maintain security review summaries, dependency audit reports and remediation records.

Do not store credentials, tokens, private keys or sensitive personal financial data in these documents.

## 3. Keep the repository as the source of truth

All relevant documentation must be saved directly inside the SpendWise project.

Whenever code, API contracts, database models or tests change, update the relevant documentation in the same working branch.

Do not generate duplicate copies of the same report in arbitrary locations.

Do not remove useful historical reports. Preserve their relationship to the relevant commit or task.

If an artifact is too large or contains information that should not be committed, document its verified location and the safe method for accessing it. Never include secrets or private data merely to make review convenient.

## 4. Make the repository easy for Claude to review

Create:

`docs/CLAUDE_REVIEW_GUIDE.md`

This document must explain how an independent reviewer can review any SpendWise task using the repository and GitHub.

It must instruct Claude to:

1. Read the applicable roadmap and engineering workflow.
2. Read the latest relevant engineering report.
3. Identify the task branch, base branch and relevant commit.
4. Inspect the actual source code and Git diff, not just the implementation report.
5. Read the relevant tests and API contract.
6. Inspect database changes and migrations.
7. Verify security, authorization, user-data isolation and financial correctness where relevant.
8. Check the reported test results against the available evidence.
9. Identify missing tests, regressions, security issues and integration risks.
10. Save its review report inside `docs/reviews/` when it has authorized write access.
11. Produce actionable findings that Codex can implement and verify.
12. Never claim to have inspected files or executed tests that were inaccessible or not actually examined.

The guide must explain how to review a specific pull request and commit rather than accidentally reviewing outdated code.

## 5. Create a single reusable Claude review prompt

Create:

`docs/CLAUDE_MASTER_REVIEW_PROMPT.md`

This must be the single reusable instruction I can give Claude along with the SpendWise repository URL.

The prompt must tell Claude to:

- Identify the repository and current task.
- Determine which branch and commit are under review.
- Read the repository's engineering workflow and applicable roadmap.
- Find the latest engineering report and review history.
- Inspect the actual diff and relevant source files.
- Review tests, API contracts, database changes, security and financial logic.
- Investigate outstanding findings from previous reviews.
- Verify whether previous fixes are actually present.
- Identify missing evidence rather than making assumptions.
- Produce a structured report with severity, file references, reasoning and recommended fixes.
- Assign a score only as a supporting assessment, never as proof of correctness.
- Recommend PASS, CONDITIONAL PASS or FAIL.
- Provide exact actionable tasks for Codex.
- Avoid making repository changes unless I explicitly authorize a separate implementation task.

The prompt must instruct Claude to save its review output inside the project folder only when it has actual authorized write access.

If Claude only has read access, it must return the complete review report and tell me that the report needs to be saved through an authorized workflow. Never pretend that a file was created.

## 6. Support repository-aware, low-manual-effort review

Design the workflow around these capabilities:

- If Claude has connected repository access, use it to inspect the actual repository and relevant pull request.
- If Claude has a complete local project folder attachment, inspect the files actually exposed through that attachment.
- If Claude can access GitHub but cannot access uncommitted local changes, clearly identify that limitation.
- If a review requires an unpushed commit or uncommitted changes, do not assume those changes are available to Claude.
- If required files, diff data, test output or permissions are missing, request only the missing evidence.

Do not make me manually assemble ZIP files or patches when the repository and review environment already provide the necessary access.

However, do not claim that a repository URL automatically grants Claude access to private repositories or to my local filesystem. Explain any access limitation precisely.

## 7. GitHub branch and review integration

Continue using the existing branch policy:

- All implementation changes happen on a dedicated task branch.
- Never implement directly on `main`.
- Push implementation commits only to the working branch.
- Maintain a reviewable pull request targeting `main`.
- Link the engineering report from the pull request description.
- Run required automated checks on the latest commit.
- Re-review the latest diff after material changes.
- Resolve or explicitly accept findings before final approval.
- Require my explicit approval before merging, unless I have already approved that specific pull request.
- Never bypass branch protection or claim a merge succeeded without verification.

Do not modify GitHub permissions, branch protection or repository settings without my explicit authorization.

## 8. Update the master engineering workflow

Update `docs/ENGINEERING_WORKFLOW.md` so every future task automatically follows the centralized documentation and review process.

Every task must produce:
- An implementation report.
- A test and verification summary.
- A list of changed files and relevant APIs.
- An independent review package based on repository paths and commit references.
- A record of Claude findings when the review actually occurs.
- A remediation and re-review history.
- A final status with unresolved risks.

Use these statuses consistently:

- IMPLEMENTATION COMPLETE — AWAITING CLAUDE REVIEW
- REVIEW FINDINGS OPEN — FIXES REQUIRED
- VERIFIED — ACCEPTANCE CRITERIA SATISFIED
- BLOCKED — HUMAN DECISION REQUIRED

Do not mark a task verified simply because the implementation report exists.

## 9. Current Phase 0.1 review

The current task branch is reported as:

`codex/phase-0-1-remediation-20261018`

The reported latest commit is:

`feb94f7`

The existing draft pull request is:

`https://github.com/Reshika0504/Expense_Management_System/pull/1`

The existing Phase 0.1 report mentions unresolved localStorage session risk, 67 frontend dependency findings and missing real Google/browser end-to-end verification.

Preserve these findings and make them easy for Claude to locate. Do not declare them resolved without evidence.

Do not begin Phase 1 or merge the existing pull request as part of this documentation task.

## 10. Git hygiene and delivery

Before making changes, inspect the repository state and current branch.

Implement this documentation workflow on an appropriate dedicated branch, preserving all existing user changes.

Review the diff and verify that:
- No unrelated source files were modified.
- No credentials or secrets were included.
- Existing documentation was not accidentally overwritten.
- All new paths are correct and repository-relative.
- The workflow refers to real files and supported capabilities.
- The documentation does not falsely claim automatic Claude access or execution.

Run appropriate checks and commit/push the documentation changes only if repository access and authorization permit it.

Do not merge these changes into `main` without my approval.

## 11. Final report

Tell me:

1. The verified SpendWise project root.
2. The documentation structure created or updated.
3. The exact path of the reusable Claude prompt.
4. The exact path of the Claude review guide.
5. The updated engineering workflow path.
6. Git branch and commit information.
7. What Claude can access automatically versus what still requires permission or manual input.
8. Any limitations in the current Codex or Claude environment.
9. The simplest next step I need to perform.

The goal is one organized SpendWise repository that contains the source code, engineering history, testing evidence and review instructions, so future Claude reviews require as little manual file handling as the available integrations genuinely support.