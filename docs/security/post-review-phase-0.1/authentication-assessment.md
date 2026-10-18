# Post-review authentication assessment and proposed implementation plan

Read source at reviewed application `feb94f70efa58eaccdb91dea61a0e8c2d346b08d`; inherited unchanged at assessment baseline `7f1c1f3a3ef6d05cc8b3c78e0001fd63536fe7e2`. This assessment changes **no authentication code**, expiry, CSP, cookies, Firebase configuration or permissions. F-01/F-05/F-06 remain open unless explicitly dispositioned below. See [existing data-flow review](../session-review-phase-0.1.md) and [actual Claude findings](../../reviews/phase-0.1/2026-10-18-claude-review-feb94f7.md).

## Verified source behavior and limits

Email/password uses local bcrypt credentials; Google uses `signInWithPopup`, in-memory Firebase persistence, backend ID-token verification, verified Google-provider/email checks and eligible account linking. The exchange issues the same local HS256 application JWT as email login: 7 days, identity/sessionVersion, no refresh token. Browser Redux reads/writes that app JWT in localStorage. Firebase signOut after exchange does not revoke an app JWT. Phone/SMS is not a supported login flow.

`protect` pins algorithm/expiry, resolves local user, active state, role and version on each protected request; missing/deleted/disabled/revoked identities fail 401/403, auth DB failures fail closed 503. Server-owned resource queries isolate users. Logout/password change increment sessionVersion atomically and invalidate all old app sessions. Requests already through auth may finish. Legacy tokens lacking version map to 0. Firebase Admin `verifyIdToken(idToken)` is not called with a revocation check; Firebase-console disable/revoke alone does not immediately end the independent application session.

Profile rejection on 401/403/404 clears local token; other resource thunks have no shared status/code logout policy. Network/503 preserves retry state. Local logout clears device data even if server acknowledgement fails and warns that other-session revocation is unconfirmed. Session guard prevents late previous-account data completions from populating a new identity. Re-enable without version increment can revive a nonexpired token; no account-status admin API exists. No CSP is set by inspected application HTML/server; actual deployed static-host headers were not tested here.

## Realistic threats

| Scenario | Current behavior / risk |
| --- | --- |
| Same-origin XSS, malicious shipped dependency or privileged extension | Reads/replays localStorage bearer token for up to remaining 7-day expiry. Server revocation limits later replay after version change; no evidence of an actual exploit demonstrated. HttpOnly would reduce token theft, not stop XSS issuing authenticated actions. |
| Stolen token on another device | Local disable/deletion/version mismatch denies future protected calls. Offline local logout does not prove server revocation. Fixed expiry does not renew automatically. |
| Revoked token used by an already-open tab | Server rejects; UI can remain authenticated with stale token/error until profile reload (F-05). No authorization bypass, but stale private UI data and UX remain concerns. |
| Direct DB disable then enable | Old token can regain access if version unchanged (F-06); operational policy must revoke versions on status transitions. Firebase-only status control is insufficient. |
| Cross-user object/metadata request | Owner-scoped API/report joins deny foreign data; continue real Mongo isolation regressions. CORS is not authorization. |
| Cookie migration without topology/CSRF work | Ambient authentication adds CSRF and browser cookie-policy failures; do not layer cookies beside persistent bearer storage casually. |

## Target architecture — recommendation only, approval required

Prefer one browser origin for SPA/API using a reviewed same-origin proxy or serving the built SPA through the existing Node service; evaluate existing free hosting before considering a paid domain/service. No paid resource is required/created by this plan, and no hosting change was executed. Verify actual origins/site/public-suffix behavior in target browsers; do not assume separate Render subdomains share a usable cookie site.

Use a cryptographically random opaque server session, store only its hash and authoritative expiry/revocation metadata in the existing MongoDB, and expose the session ID only in a host-only HttpOnly Secure `__Host-` cookie with Path `/` and an approved SameSite policy. Retain local active-account/current-role/version enforcement. Define idle/absolute lifetimes, rotation, session fixation defenses and all-device vs current-device logout explicitly; TTL cleanup is not authorization expiry. A shorter interim JWT lifetime is a separate product decision, affects newly issued tokens only, and must not be described as revoking existing 7-day tokens.

Both email/password and Google should create the same app session after existing identity verification/linking. Firebase session cookies are an alternative only after reconciling local email/password identities and Admin privileges; copying a Google-only Firebase-cookie recipe would not cover this app's bcrypt login. No new service-account key or provider administration is authorized here.

## Cookie, CSRF and browser implications

Choose SameSite=Lax for a verified same-site design where appropriate; cross-site cookies require a separate reviewed SameSite=None/Secure policy and may be blocked by Safari/third-party restrictions. For any cross-origin API design, exact origin allowlist plus credentials support on server/client is required; wildcard credential CORS is unacceptable. Browser cookie behavior must be tested on the actual target topology before release.

Protect state-changing operations, including login/exchange/logout, with a reviewed CSRF design (e.g. server-bound synchronizer token, strict origin validation and safe content-type handling). SameSite is defense in depth, not the only control. Keep GET read-only. HttpOnly hides the cookie from JS but does not neutralize XSS or same-origin request abuse; retain output safety, dependency triage and a real tested CSP. A CSP must account for exact Firebase popup/authorized origins and third-party flows; do not blindly add script-src rules or inline exceptions without preview testing.

## Proposed migration work packages — not implemented

1. Approve topology, identity/session contract, lifetimes, local-vs-provider revocation and recovery policy. Threat-model with independent review and define API/client compatibility.
2. Implement session store/hash/rotation/expiry and account/version enforcement on an isolated branch with synthetic tests; define indexes/backfill/rollback separately, never production migrations in this assessment.
3. Implement coordinated SPA/API cookie and CSRF contract. Remove app-token persistence and clear old localStorage/private caches. Avoid indefinite dual Bearer/cookie acceptance; scope any transition explicitly. Invalidate legacy tokens under an approved force-relogin rollout. Revoking all sessions is a user-impacting operational decision, not an action taken here.
4. Implement F-05 shared protected-request handling with **request-session identity checks**: only a response for the still-current token/session may clear auth. Ignore late 401s from a previous identity; do not call server logout recursively from an interceptor. Public wrong-password 401, ordinary forbidden 403 and network/503 must not indiscriminately clear a valid session. Clear current state only for applicable UNAUTHENTICATED/SESSION_REVOKED or ACCOUNT_DISABLED outcomes. This is a future fix requiring a separate approved task because authentication changes are prohibited now.
5. Run deterministic backend/frontend regressions, Safari/Chrome real identity smoke checks, multi-tab/account-switch/CSRF tests and independent re-review. Coordinate matched deployment only after all gates/human approval. Rollback must preserve version/revocation checks; do not restore the old signature-only verifier.

With HttpOnly cookies, offline JavaScript cannot reliably delete the cookie itself; define pending server logout/reconnect handling and clear displayed private data without claiming server revocation. Logging out successfully must expire the cookie and revoke the authoritative session; failure messaging must remain honest.

## Required regression verification for approved implementation

Current F-05 fix: non-profile revoked/expired response clears only its own current auth/cache/storage; disabled code handled; late previous-token rejection cannot log out a new account; public login errors and DB/network outages preserve the intended state; no recursive logout requests. Current F-06: synthetic disable/re-enable with and without version increment, old tokens denied after approved transition. Cookie migration: HttpOnly/Secure/Path/Domain/SameSite inspection, expiry/rotation/fixation, CSRF missing/foreign/replayed tokens, strict CORS, both identity flows/link conflicts, all-device/password/deleted/disabled revocation, offline logout, account switching and matched real-browser preview. Existing tests do not substitute for these not-yet-executed cases.

## Operator status-transition runbook — policy only, no production operation

Until a reviewed admin path exists, account status changes require a separately authorized operator action. Approve identity/target privately, preserve evidence, and make each disable or re-enable transition and a sessionVersion increment **one atomic operation**. Re-enable must never reuse the previous version. Verify with synthetic tests first and observe that pre-transition tokens fail before closing the operation. Do not use Firebase-console disable as the app revocation mechanism. No production write command or execution is supplied by this assessment; authorization for status changes is outside this task. F-06's runbook option is documented, while enforcement remains manual/unverified operationally.

## Decisions still required

F-01 remains a High risk: no acceptance signed. Owner must either require a reviewed session fix before merge or explicitly accept a bounded temporary residual with expiry and mitigation; deployment remains gated. CSP/shortened expiry and any CRA/SDK changes also require reviewed plans. This document is not approval to start Phase 1 or change auth.

References: [MDN cookie security/attributes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies), [Firebase session-cookie lifecycle](https://firebase.google.com/docs/auth/admin/manage-cookies), [Firebase provider token revocation](https://firebase.google.com/docs/auth/admin/manage-sessions). These describe platform behavior, not an implemented SpendWise migration.
