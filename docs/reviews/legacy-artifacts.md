# Historical delivery reconciliation

Verified on 2026-10-18. Earlier tasks produced external delivery files before this repository-first policy. They are preserved, not used as future handoff requirements. No new external files or duplicate source trees were created by the centralization task.

Canonical repository equivalents:

- Consolidated Phase 0 audit → [historical audit locator](../engineering-reports/2026-10-17-phase-0-audit.md) and its existing architecture/API/risk/baseline records.
- Phase 0.1 external engineering report → [canonical implementation report](../engineering-reports/2026-10-18-phase-0-1-remediation.md); its later delivery/CI addendum → [review request](phase-0.1/request.md), [CI evidence](../testing/phase-0.1/README.md) and history.
- Per-task external Claude prompt → [current Phase 0.1 request](phase-0.1/request.md) plus the [reusable master prompt](../CLAUDE_MASTER_REVIEW_PROMPT.md).
- ZIP/source/manifest/patch → actual Git objects and PR #1 diff, task baseline `33f7e7ef017ab8bd8c12cb4cd990ad96405e2013`, submitted head `feb94f70efa58eaccdb91dea61a0e8c2d346b08d`. Git regenerates the source/file list/diff without duplicated tracked source archives. Unique sanitized CI evidence is now inside `docs/testing/phase-0.1/`.

The old bundle is an unnecessary duplicated source archive for repository review and is intentionally not committed. Historical originals, accessible only to the local owner/explicitly authorized filesystem tooling, are at:

`/Users/reshika/Documents/Codex/2026-10-16/files-mentioned-by-the-user-spendwise/outputs/`

A GitHub URL or this path does not expose them to Claude. Use repository equivalents first. Only if historical bundle inspection is actually necessary should the owner provide safe, authorized access; verify these hashes before use. Do not include secrets/private artifacts for convenience or delete historical originals as part of this task.

| Historical filename | Verified bytes | SHA256 |
| --- | --- | --- |
| `SpendWise_Phase_0_Audit.md` | 32715 | `2d40400ef44bc11ee6f790f33cc1af8ab09eeb86bb980a0dcaa5ead5304425d2` |
| `SpendWise_Phase_0_1_Engineering_Report.md` | 36129 | `26fcaea8f2410dc14a742af8b34f88d2c771c0a41847a937a4a2951f0f5fcf2d` |
| `SpendWise_Phase_0_1_Claude_Review.zip` | 844839 | `3fdd21938d38f7d01317685d529280a1c1ca8fc566942bf45c881e2661d5013a` |
| `SpendWise_Phase_0_1.patch` | 735205 | `bb836d205b61173cce9e4da6da4a1a4071926e59dea66efdc80d51d424594504` |
| `SpendWise_Claude_Review_Prompt.md` | 3058 | `60eceb2b32b50a8166f5ef7667495f1bc12ed58a622c333c3e66f9481790c7d9` |
