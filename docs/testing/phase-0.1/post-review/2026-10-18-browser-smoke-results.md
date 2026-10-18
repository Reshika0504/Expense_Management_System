# Executed browser smoke — local reviewed candidate

Application source exactly `e8cd35688f870e90379362c1e1ccad1575aa9cf4`; runtime application files equal reviewed PR #1 `feb94f70efa58eaccdb91dea61a0e8c2d346b08d`. The uncommitted manual harness is separate test setup, subsequently committed on this task branch; it changes no application authentication code. API base `/api/v1`, same-origin localhost:4317, existing createApp, random in-memory signing key and **fresh disposable MongoDB**, never production credentials. Both UI/backend use this candidate. Source/config/build metadata: [local build](local-browser-build.json); [actual results](2026-10-18-browser-smoke-results.json). Execution date 2026-10-18, Safari native plus Codex in-app browser. No hosted preview or production deploy.

| Case | Expected | Actual | Status |
| --- | --- | --- | --- |
| Email register/login/wrong password | Create synthetic account; reject wrong credentials; restore successful login | Real UI completed all three, correct dashboard | PASSED |
| Empty ledger | Recorded income/expense/net 0.00 | All three 0.00; existing financial-health copy still says spending exceeds income in narrow layout | Ledger PASSED; heuristic note OPEN |
| Create 100income and 33.33expense | Net 66.67 | Exact cents shown in actual dashboard | PASSED |
| Edit expense 33.34 | Net 66.66 | Exact total updated | PASSED |
| Delete fixture expense, then income | Net 100.00 then genuine empty 0.00 | Actual UI showed both transitions | PASSED |
| Refresh/logout | Restore current session; return to login on logout | Observed; one automated mouse activation needed keyboard retry, root cause not established | PASSED with interaction note |
| Second open tab after logout elsewhere | Server denies revoked session; UI should stop showing authenticated state | Second tab kept signed-in UI/empty transaction screen until reload. Exact request status not captured; backend tests separately prove revocation | F-05 remains OPEN; not full pass |
| Real Google in Safari | Popup -> Firebase exchange -> local dashboard -> refresh -> logout | Existing owner account completed actual flow; no credentials/identity saved | PASSED |
| Google in in-app browser | Same successful flow | Network-error message; same config worked in Safari, cause unproven | FAILED in this browser environment |

The mobile-menu interaction must open Menu before selecting links; hidden/off-canvas anchors did not navigate when targeted by automation. No route defect is inferred from those attempts.

Not executed as browser cases: password change, expired/disabled account controls, two-user custom category overlap, offline/503 and boundary-date fixtures. Existing 44 backend/22 frontend tests are separate evidence, never substituted for those browser rows. Therefore F-04 is **partially satisfied**, not blanket PASS or merge readiness. No High risk acceptance or Phase 1 implementation.

Evidence images contain only synthetic data: [empty](browser-empty.png), [100− 33.33=66.67](browser-cents.png), [known stale session](browser-stale-session.png), [in-app Google network error](browser-google-network-error.png). Native Safari Google identity screens intentionally not saved.
