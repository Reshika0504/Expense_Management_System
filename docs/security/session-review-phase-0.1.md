# Session security review — Phase 0.1

18 October 2026; implementation branch under review, not deployed. This is a bounded repair of the existing Bearer architecture, not a cookie migration.

## Credential data flow

```mermaid
sequenceDiagram
    participant B as Browser
    participant F as Firebase Google
    participant A as SpendWise API
    participant D as MongoDB
    B->>F: Google popup, provider SDK uses memory persistence
    F-->>B: Firebase ID token
    B->>A: POST users/firebase {idToken} over HTTPS
    A->>F: Admin SDK verifies signing certificates/audience/issuer/expiry
    A->>D: Find/link local user; enforce local active status
    A-->>B: 7-day HS256 application JWT with user ID + session version
    B->>B: App JWT in Redux + localStorage; provider signOut
    B->>A: Authorization Bearer application JWT
    A->>D: Check account exists, active status, sessionVersion and current role
    A-->>B: Owned API data or safe 401/403/503
    B->>A: POST users/logout with Bearer JWT
    A->>D: Atomic $inc sessionVersion
    A-->>B: Acknowledge revocation
    B->>B: Clear JWT/private Redux data; ignore old-account pending responses
```

Email/password follows the same app-JWT path after bcrypt verification; no Firebase token is involved. The Firebase browser SDK's provider state is in memory and signs out after exchange. Application JWT state is separately persistent. No app refresh token, session cookie, HttpOnly cookie, sessionStorage or credentialed Axios request is used. localStorage also contains a non-sensitive theme preference; financial transactions are in Redux memory, not intentionally persisted there.

## Enforcement and invalidation

- Local MongoDB user existence and `isActive` are authoritative for app access. Every protected route checks them before handling data. No account-status cache is used; one user lookup/request adds DB work and fails safe on DB failure. Active app sessions remain usable if Firebase temporarily fails because they do not call Firebase again.
- Application JWT verification pins HS256 and checks expiry. User ID/role are resolved from the server record; a client body/query or stale token role cannot elevate privileges. Missing, forged, expired, deleted-account and version-revoked tokens are denied.
- `POST /users/logout` atomically increments user sessionVersion and revokes **all current app sessions** for that user, not one browser only. Password change atomically changes hash plus increments the version. Subsequent protected requests using old versions return401; in-flight requests that passed auth before the change are not canceled. New login gets the current version. Legacy tokens without `ver` mean version0 and do not require an immediate forced migration.
- Local disable returns403 while inactive. **Re-enabling an account without incrementing its sessionVersion can restore a still-unexpired old token.** Operators who require lasting revocation must atomically disable and increment sessionVersion; there is no new admin-disable API in this scope. Disabling or revoking a user only in the Firebase console does not immediately revoke an existing app JWT. Firebase revocation/user lookup is not enabled and no private service account was introduced.
- Delete-account still performs sequential cascades; after user deletion old tokens fail. Partial deletion remains a release risk and must not be represented as atomic.
- Frontend logout awaits server acknowledgement; an offline request clears this device and shows a warning that server revocation was not confirmed. Already expired/revoked/disabled responses may clear local state. Password change clears local state and requires login. Private finance caches reset; late data/profile responses from the previous token are ignored, including after switching accounts.

## Review findings

| Surface | Result / residual risk |
| --- | --- |
| Persistent app token | **High residual XSS risk**: any successful same-origin script injection can read localStorage JWT. This phase does not eliminate it. No dangerous HTML/eval sink was found in application source search; that does not prove no XSS exists in dependencies or future code. |
| CORS | Explicit expected origin, no credentials. No wildcard credential policy. CORS is browser response control, not server authorization. Configuration must be an exact origin (no trailing path/slash). |
| CSRF | Bearer token is explicitly set in Authorization, not ambient cookies; conventional cookie CSRF is not introduced. Phase 1 cookie work must add/test CSRF protection. |
| XSS/rendering | React text escapes ledger/category strings; no intentional raw HTML rendering. Keep avoiding dangerous HTML, sanitize any future rich text and test CSP under actual static hosting. |
| Errors/logs | Corrected auth/finance paths return safe messages/codes; raw token verification exceptions and raw DB/controller errors are not printed. HTTP logging omits URL/query/body/user identity; no intentional credential/session logging. New-password byte limits avoid silent bcrypt truncation for new registrations/changes. |
| Expiry/renewal | Fixed7-day JWT, no refresh flow. Profile401/403/404 clears session; other action failures do not themselves promise immediate UI logout; network/503 preserves for retry. Tokens can remain in another tab's memory until its next server request; server version check still denies them. |
| Provider outage | Known Firebase infrastructure/config failures503; invalid identity401; unexpected500, no raw provider text. Existing app sessions do not depend on provider availability. First-login conflict retry/linking redesign is deferred. |
| Deployment | Production HTTPS already used; no deployment settings changed. Current frontend/API have separate origins; browser cookie policy, Safari behavior and free-host constraints must inform any migration. |

## Proposed Phase 1 architecture work (not implemented)

Owner: SpendWise maintainer with independent security review. Treat persistent-token XSS risk as an explicit release blocker before claiming hardened sessions.

Prefer a same-site frontend/API topology or carefully tested reverse proxy, HttpOnly Secure cookie with reviewed SameSite scope/expiry, CSRF token/origin defenses, exact credentialed CORS, server invalidation and browser tests for local development/Render/Safari. Decide session lifetime/refresh and device logout semantics. Do not simply add a cookie alongside persistent Bearer tokens. Define a migration that invalidates old persistent tokens, clears storage, handles rollback safely and updates all clients together. Do not roll back to code that ignores sessionVersion.

No claim of immediate Firebase-wide revocation, zero XSS risk or production certification is made. Relevant tests cover local-disabled existing tokens, logout/password version revocation, missing/forged/expired tokens, outage mapping, account switching and privacy-cache reset. A fresh interactive real-Google flow and deployed browser cookie tests were not run because this branch is not deployed and no cookie architecture was changed.
