# SpendWise current-state audit — Phase 0

Audit date: 17 October 2026. Application baseline: `91915f2b540a8b14e8bdb4c430722327b5b23da3`.

## Scope and status

The complete [backend-first roadmap](../SpendWise_Backend_First_Roadmap.md) was read and copied unchanged from the supplied file. This audit inspects the existing implementation; it does not implement Phases 1–6. The new October–November roadmap supersedes the earlier README sprint's AI schedule. AI stays deferred. Email/password and Google remain the two supported login methods; no SMS, paid services or infrastructure were added.

**Audit delivered; release readiness is not established.** The baseline tests/build pass, but synthetic probes confirm reporting and session-security defects. See the [prioritized risk register](../security/risk-register.md), [current API contracts](../api/current-endpoints.md) and [machine-readable baseline](../audit/phase0-baseline.json).

## Runtime and request flow

- React 19 / CRA `react-scripts` 5, Redux Toolkit, React Router, Axios, Ant Design, Recharts and Firebase browser SDK in `client/`.
- Node 24 (declared >=24.12 <25), npm 11.19.0, Express 5, Mongoose 8, MongoDB, Joi, bcrypt and application JWTs at repository root. Audit ran on Node 24.21.0.
- `server.js` starts an async bootstrap, connects to MongoDB, initializes user indexes and schedules system-category seeding, then builds Express and listens. There is no exported app/server lifecycle for full-server integration tests or graceful shutdown.
- Request chain: proxy trust = 1 → Morgan dev logging → Express JSON parser (default limit) → unrestricted `cors()` → route-level DB availability → authentication → controller. Most business rules and aggregation logic are directly inside controllers. Only Firebase token verification has a dedicated service.
- `/api/health` says the process is running, independent of database readiness. Missing DB produces 503 for API route groups. No `/health/live` or `/health/ready` exists.
- API requests use a shared 75-second Axios timeout. Profile restoration preserves a token after temporary network/503 errors and offers retry. Browser auth shows slow-connection feedback after 8 seconds.
- If a compiled client exists, Express serves it. Otherwise known browser entry paths on the API service redirect to the canonical frontend. Unknown API paths retain JSON 404.

## Authentication trace and the earlier Google 500

1. `SocialLogin.js` opens a Google popup from the click event. `firebase.js` initializes Firebase with **in-memory provider persistence** and public `REACT_APP_FIREBASE_*` configuration.
2. The browser obtains a Firebase ID token and posts `{idToken}` to `/api/v1/users/firebase`.
3. `services/firebaseAuth.js` uses the supported Admin SDK `verifyIdToken()` with `FIREBASE_PROJECT_ID`. This verification path does not administer users and does not require a private service-account key. Missing project configuration explicitly raises 503.
4. `firebaseLoginController` accepts verified Google identities with email; finds by Firebase UID, then checks eligible email linking; saves the local user and returns a 7-day **application JWT** plus user projection. The provider is signed out after exchange.
5. Redux stores that application JWT in **localStorage** and sends Bearer headers to protected routes. Refresh fetches `/users/profile`; logout only clears browser state. There is no HTTP-only cookie design or backend logout route to preserve.

Earlier work in this chat verified deployed Google login, refresh and logout using the owner's existing account. This audit did not reproduce the historic HTTP 500 and has no preserved production stack trace proving its original cause. Do not invent a new root cause or rewrite working auth based on that old symptom. Existing tests verify Google exchange with a mocked provider and reject a forged token through the real verifier. Full local interactive Google login was not rerun: a configured local frontend/backend environment and browser Google flow remain required. Current `/api/health` returned HTTP 200; it is not evidence of an authenticated production flow or database readiness.

Known remaining auth issues: provider infrastructure exceptions are generally mapped to 401, startup does not validate JWT/Firebase config, first-sign-in races return 409 rather than retrying, missing provider email is deliberately rejected, and active/deleted account status is not rechecked on protected transaction/category/report requests. See R1–R3 and R9.

## Persisted data and indexes

| Entity | Existing shape and meaning | Declared indexes |
| --- | --- | --- |
| User (`users`) | Required name/email; optional password for Firebase users; optional UID, phone/avatar; role, isActive, lastLogin; profile budgets/income/savings target; currency defaults USD; no timezone. Password is excluded by default. | Unique email; unique sparse firebaseUid. |
| Transaction (`transactions`) | userId ObjectId; amount Number in major units; type income/expense; category **name string**; date separate from createdAt; description, payment method, tags, recurring flag/pattern, notes. No currency, idempotency key, linked transfer or audit history. | userId; date; userId+date descending; userId+category; userId+type. |
| Category (`categories`) | name/type/icon/color, nullable owner, isSystem/isActive, timestamps. Defaults are shared; custom categories belong to a user. | userId; userId+type; isSystem+type. No unique name/owner/type constraint. |

Schemas live in `models/`. These are declarations, not verified production database index inventories or explain-plan results. No migrations or query-plan artifacts exist. Category initialization checks for any system category then skips all inserts; partial seed sets and concurrent startup are not reconciled.

Budgets are timeless user profile fields/maps, not per-month records. Budget utilization and savings calculations are partly frontend-derived. Dashboard falls back from zero recorded income to configured monthlyIncome (`Dashboard.js:85`), so displayed savings may reflect planned income. Savings goals are a single numeric target, not auditable goals or allocation history. Recurring flags and a heuristic over the latest 100 transactions do not schedule transactions. CSV download helpers exist; a complete server-side export/import contract does not.

## Deployment and environments

Canonical frontend: https://expense-management-system-frontend-3o3i.onrender.com/

API origin: https://expense-management-system-backend-546t.onrender.com/

Existing Render setup, verified earlier in this chat: frontend root `client`, static build `npm install && npm run build`, publish `build`, SPA rewrite `/*` → `/index.html`; backend root repository, build `npm install`, start `npm start`. Both deploy main on commit, independently of CI. These settings are not managed by a Render blueprint in the repository and were not changed during this audit. Free backend cold starts remain a known limitation. The Vercel configuration files are legacy alternatives, not evidence of current Render settings.

Server env names: `NODE_ENV`, `PORT`, `MONGO_URL`, optional `MONGO_LOCAL_URL`, `JWT_SECRET`, `FIREBASE_PROJECT_ID`, `FRONTEND_URL`. Public client build names: `REACT_APP_API_URL`, `REACT_APP_FIREBASE_API_KEY`, `REACT_APP_FIREBASE_AUTH_DOMAIN`, `REACT_APP_FIREBASE_PROJECT_ID`, `REACT_APP_FIREBASE_APP_ID`. Safe examples already existed; this phase adds the missing runtime/fallback names to the root example. The tracked client production env contains only the public API URL.

## Baseline verification

| Command / check | Result on 17 October |
| --- | --- |
| `npm test` | 14 backend tests passed; temporary MongoDB, no production connection. |
| `CI=true npm test --prefix client -- --watchAll=false --runInBand` | 6 suites, 13 tests passed. |
| `CI=true npm run build --prefix client` | Compiled successfully; stale Browserslist data and Node deprecation warnings. |
| `node scripts/audit-phase0.cjs` | Observational probes confirm four defect groups and passing direct transaction ownership guards. See JSON baseline. This is **not** a passing finance regression suite. |
| `npm audit --json` | 26 package findings: 5 critical, 8 high, 12 moderate, 1 low. |
| `npm audit --prefix client --json` | 110 package findings: 4 critical, 84 high, 16 moderate, 6 low. |
| Targeted tracked/history secret scan | 95 tracked files and 223 reachable blobs inspected. One URI match in tracked `server_out.log` was triaged as a masked password. No confirmed secret detected by those patterns; no credential rotation performed. |

Audit package counts include transitive/meta findings and build/test tooling; they are not a count of exploitable production bugs. Reachability and safe upgrade paths remain unreviewed release gates. Do not use `npm audit fix --force` blindly (some suggestions replace/downgrade major tooling). No dependency versions or lockfiles changed.

CI currently runs backend tests, frontend tests and build, but no standalone lint script, dependency audit, secret scanner or browser E2E suite. Auth tests mount the router with a mock provider and omit full server CORS/DB middleware. Transaction/report isolation, money/timezone, concurrency, backup/restore, load and responsive E2E suites are missing. No new viewport claims are made by this audit.

## Evidence and next handoff

The reproducible probe script creates its own disposable database, sets a synthetic JWT secret and never reads a production `.env` or `MONGO_URL`. Do not point tests at production. For a later implementation prompt, reproduce each defect as a failing regression test, fix the narrow area, then run the existing suites/build and review the diff.

Start Phase 1 with R1 category metadata isolation, R2 active-session enforcement, R3 session design and R9 safe auth/error handling. R4–R8 and R12 belong to the finance phases. Triage high/critical dependencies early rather than waiting until release. No later phase is started automatically.

No application behavior, schema migration, deployment setting or production records changed in Phase 0. Rollback is a Git revert of this documentation/audit-script commit; no database rollback is required. Secret absence, production database indexes, local interactive Google auth and operational recovery are explicitly not certified by this audit.
