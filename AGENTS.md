# SpendWise engineering instructions

Read `docs/ENGINEERING_WORKFLOW.md`, `docs/SpendWise_Backend_First_Roadmap.md`, `docs/API_CONTRACT.md` and relevant `docs/engineering-reports/` before starting repository work. The user-supplied master workflow is authoritative for branch, testing, reporting and review requirements.

Work one assigned phase/task at a time on `codex/<task>-<YYYYMMDD>`, after inspecting/fetching remote main and preserving local work. Never push implementation to main, merge or deploy before the required independent Claude review and explicit human approval. Do not alter repository settings/permissions without authorization. Do not automatically start another roadmap phase.

Protect financial correctness and user isolation; test regressions on synthetic isolated data. Maintain the actual API contract, security/dependency residuals and a detailed report in `docs/engineering-reports/`. Prepare an accessible actual diff/source package for independent review; do not assume Claude can access local/GitHub files or claim its review occurred. Do not claim full verification from green tests alone.
