# SpendWise documentation

Repository: https://github.com/Reshika0504/Expense_Management_System

Start with the [review index](reviews/README.md). It identifies tasks explicitly; the newest report is not automatically the intended review. Application behavior on an unmerged branch is not the deployed behavior.

| Location | Purpose |
| --- | --- |
| [Engineering workflow](ENGINEERING_WORKFLOW.md) | Branch, implementation, evidence, review and human approval requirements |
| [Backend-first roadmap](SpendWise_Backend_First_Roadmap.md) | Active phased plan; one phase per authorized task |
| [API contract](API_CONTRACT.md), [OpenAPI](api/openapi.json) | Implemented Phase 0.1 contract; check its branch and revision before using |
| [Engineering reports](engineering-reports/) | Dated implementation reports and historical audit locator |
| [Reviews](reviews/README.md) | Task manifests, requests, actual findings, remediation and re-review history |
| [Testing](testing/README.md) | Reusable commands and revision-bound verification evidence |
| [Security](security/) | Session/dependency reviews and residual risks |
| [Claude review guide](CLAUDE_REVIEW_GUIDE.md) | Exact revision discovery and independent review procedure |
| [Reusable Claude prompt](CLAUDE_MASTER_REVIEW_PROMPT.md) | One instruction for future reviews |

The verified local root on 18 October 2026 is `/Users/reshika/Documents/My Space/Spendwise`. Other machines must verify their own checkout root. This path grants no filesystem access.

Keep new project reports and evidence here on the task branch. Existing Phase 0 architecture/API/risk records and Phase 0.1 evidence keep their established paths; do not duplicate them under testing. See [legacy artifact reconciliation](reviews/legacy-artifacts.md) for the old external delivery bundle and the canonical repository equivalents. No new ZIP, patch, Downloads or outputs copy is needed.
