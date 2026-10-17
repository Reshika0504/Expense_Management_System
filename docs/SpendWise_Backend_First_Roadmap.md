# SpendWise — Backend-First Product & Engineering Plan
**Planning window:** 17 October–30 November 2026  
**Product goal:** Turn SpendWise into a dependable, mobile-ready personal-finance application with a strong backend before polishing the UI or adding AI.

> **Product principle:** Build for a real person who wants to understand where their money went, how much they saved, and whether they're on track for specific goals. Do not build a marketing-style feature list or claim features are implemented until they work and are tested.

---

## 1. Product definition

SpendWise should answer five questions reliably:

1. How much money came in this month?
2. How much did I spend, and on what?
3. How much did I save after accounting for all income and expenses?
4. How much of my savings is assigned to each goal?
5. Am I on track for my goals, budgets, and upcoming expenses?

### Core product areas

- Authentication and account security
- Income and expense transactions
- Categories and monthly budgets
- Monthly summaries and historical reports
- Savings goals and contributions/withdrawals
- Recurring transactions and reminders (after core ledger is stable)
- Data export, account settings, privacy, and account deletion
- Reliable API, tests, monitoring, backup and recovery

### Explicitly out of scope for the November milestone

- AI-generated financial advice or AI insights
- Receipt OCR and automatic transaction extraction
- Bank-account aggregation/open-banking integrations
- Investment execution, stock trading, or portfolio recommendations
- Social features, public profiles, testimonials, pricing tiers, subscriptions
- Gamification, badges, leaderboards, and decorative version-history sections
- Phone OTP unless it is already working end-to-end and has a clear need; do not let it delay the core finance backend
- Microservices, Kubernetes, event streaming, or other infrastructure without a demonstrated requirement

These can be considered later based on real user feedback. A well-tested modular monolith is the right starting point.

---

## 2. Real-user workflows to support

### Workflow A — Record monthly finances
A user signs in, sets the currency and timezone, adds income, records expenses, edits a mistake, searches old transactions, and sees the updated monthly totals. Every mutation must update derived summaries consistently.

### Workflow B — Understand actual savings
For a selected month:
- Total income
- Total expenses
- Net cash flow = income − expenses
- Savings rate = net cash flow ÷ income, only when income is greater than zero
- Budget usage by category
- Comparison with the previous month

Do not label investment purchases or transfers between the user's own accounts as ordinary expenses. Distinguish spending, income, internal transfers, and investment contributions.

### Workflow C — Save toward multiple goals
A user can create goals such as **Wedding**, **Emergency Fund**, **Travel**, or **Laptop**. Each goal has a target amount, target date (optional), priority, and starting amount. Users can allocate savings to a goal, reverse or correct an allocation, and see progress.

Example: the user has ₹17,000 of net savings this month and allocates ₹5,000 to the Wedding goal. The system should show:
- Monthly net savings: ₹17,000
- Wedding goal contribution: ₹5,000
- Unallocated savings from this month's net savings: ₹12,000 (subject to the user's other allocations)
- Wedding goal's current balance, target, remaining amount, and progress

**Important accounting rule:** Allocating money to a goal is not a new expense and must not reduce net savings a second time. Goal allocation is an internal earmarking/transfer between the user's unallocated savings and goal balances. Prevent double counting.

A goal balance is a tracking concept, not proof that money physically exists in a separate bank account. Clearly distinguish “planned/allocated” from “actual account balance” if account balances are introduced.

### Workflow D — Set a monthly budget
A user sets a total or category-specific monthly budget, records expenses, sees the amount used and remaining, and receives a clear warning when near/over the limit. Budget status must be computed on the server and remain correct after edits or deletions.

### Workflow E — Correct and trust the data
A user can find a transaction, correct its amount/date/category, delete it with confirmation in the UI, and see monthly totals and budgets recalculate. Financial records should never silently disappear or become duplicated after retries.

---

## 3. Domain model and accounting rules

First inspect the current MongoDB models, controllers, routes, and frontend contracts. Reuse or migrate existing structures where sound; do not create duplicate models or break current data unnecessarily.

Suggested logical entities (adapt to the existing codebase):

### User
- Internal ID
- Firebase UID (unique, indexed)
- Email and phone as optional fields; do not assume every provider supplies both
- Display name and profile fields
- Preferred currency (default INR), timezone, locale
- Account status, created/updated timestamps
- Never accept role, user ID, Firebase UID, or account status blindly from client input

### Transaction
- Internal ID and `userId`
- Type: `income`, `expense`, `transfer`, or `investment_contribution` only if the current product needs it
- Amount stored as an integer in the currency's minor units where practical; define and document the currency precision policy
- Currency
- Category ID, optional subcategory
- Transaction date (date of occurrence) and timestamps
- Description/merchant, notes (optional)
- Payment method/account reference (optional, only if implemented)
- Recurring source reference (optional, later)
- Soft-delete/audit metadata only if needed; define deletion and restore behaviour

**Rules**
- Validate amounts as finite, positive values within a documented limit; use transaction type rather than negative amounts to encode meaning.
- Store and calculate money without binary floating-point arithmetic. Define a single conversion/rounding policy at API boundaries.
- Use UTC timestamps for events and the user's configured timezone for calendar-month boundaries.
- Treat `transactionDate` separately from `createdAt`.
- Never trust client-calculated monthly totals.
- Use pagination, stable sorting, and server-side filtering.
- Every query and mutation must be scoped to the authenticated user.

### Category
- User-owned custom categories and/or system categories
- Type compatibility (income vs expense)
- Name, icon/colour key (presentation metadata only), active state
- Prevent duplicate categories for the same user where appropriate
- Define what happens when a category is archived or deleted while transactions reference it

### Monthly budget
- `userId`, month key, category or total-budget scope, limit, currency
- Unique constraints preventing duplicate budgets for the same scope and month
- Actual spending derived from eligible expense transactions, not manually edited by the client
- Clear rules for category changes, transaction edits, refunds, and month boundaries

### Savings goal
- `userId`, name, target amount, target date (optional), priority, status, currency, timestamps
- Goal balance must be derived from an auditable ledger of goal movements, not an independently editable number
- Goal movement types: contribution/allocation, withdrawal/deallocation, correction
- Reference the source action and support idempotency so retries do not duplicate a contribution
- Do not let total allocated savings become negative or exceed the defined available/unallocated amount unless the product explicitly supports an overdraft-like planning state

### Goal movement / savings allocation
- `userId`, `goalId`, amount, movement type, effective date, note, idempotency key, timestamps
- Append-only movement history for normal operations; corrections should be explicit reversal/correction entries rather than silent edits
- Validate ownership of both goal and any related transaction
- Define how deleting or editing a transaction affects goal allocations; never silently alter unrelated goal history

### Optional account tracking — only after the core ledger
If users can record multiple accounts (e.g., SBI savings, ICICI investments/trading, PNB spending), model each as an account with a type and opening/current balance policy. Transfers between a user's own accounts should be represented as linked debit/credit entries and must not count as income or expense. Do not imply live bank syncing unless it exists.

---

## 4. Backend architecture requirements

Keep the current stack unless the repository audit reveals a concrete reason to change it. The known stack is React, Node.js, Express, MongoDB/Mongoose, and Firebase Authentication. Prefer a **modular monolith** with clear boundaries:

- `routes/` — endpoint definitions and middleware
- `controllers/` — HTTP request/response handling only
- `services/` — business rules and orchestration
- `models/` — persistence schemas and indexes
- `validators/` — request validation and schemas
- `middleware/` — authentication, authorization, rate limiting, request IDs, error handling
- `utils/` — money/date helpers, pagination, safe logging
- `tests/` — unit, integration, security, and regression tests
- `docs/` — API contracts, data model, decisions, operational runbooks

Do not blindly impose this exact folder layout if the project already has a consistent architecture. Refactor incrementally and preserve public API compatibility unless a versioned change is planned.

### API contract standards
- Use a consistent JSON response shape and predictable HTTP status codes.
- Validate request body, query parameters, and path parameters at the API boundary.
- Return safe, actionable errors with a stable machine-readable error code and request ID.
- Never return stack traces, database details, secrets, raw provider errors, or private user data in production responses.
- Document endpoints with OpenAPI/Swagger or an equivalent maintained API specification.
- Add `/health/live` and `/health/ready`; readiness should verify required dependencies without leaking configuration.
- Set request body size limits, pagination caps, timeouts, and appropriate compression.
- Use database indexes based on actual query patterns and verify with explain plans rather than adding random indexes.

---

## 5. Authentication and security baseline

The project has previously experienced Firebase Google authentication failing at backend token verification with HTTP 500. Treat authentication as a release blocker until it is fully tested in local and deployed environments.

### Firebase
- Keep Firebase client configuration separate from server-only service-account credentials.
- Verify Firebase ID tokens on the backend with the supported Firebase Admin SDK API.
- Ensure the Firebase project ID used by the client and server match.
- Load credentials from deployment environment/secret manager; never commit service-account JSON or private keys.
- Validate required configuration at startup and fail safely with a clear operational log.
- Never log ID tokens, access tokens, cookies, private keys, passwords, or full sensitive request bodies.
- Distinguish invalid/expired credentials (401) from unavailable/misconfigured server dependencies (503) and unexpected failures (500).
- Create or retrieve the local user by a stable provider identity (Firebase UID); handle concurrent first sign-ins safely with unique indexes and duplicate-key retry logic.
- Test Google sign-up, returning Google login, account with missing optional email/phone, disabled user, expired token, invalid token, and backend configuration failure.

### Sessions and cookies
- Preserve the current HTTP-only cookie design if it is correctly implemented.
- Use `HttpOnly`, `Secure` in HTTPS production, an appropriate `SameSite` policy, restricted cookie path/domain, and sensible expiry.
- Configure CORS to allow only expected origins and credentials where needed; never combine credentialed requests with wildcard origins.
- Protect state-changing cookie-authenticated requests against CSRF using an appropriate, tested strategy.
- Implement logout that clears the cookie with matching attributes.
- Avoid storing application session JWTs in localStorage/sessionStorage.
- Test local development separately from production cookie/CORS settings.

### API security
Use the OWASP API Security Top 10 as a minimum threat-model checklist:
- Object-level authorization on every read, update, and delete
- Property-level allowlists to prevent mass assignment
- Authentication and authorization on all protected routes
- Rate limits on login, OTP, password reset, exports, and other abuse-prone endpoints
- Request validation and payload-size limits
- Secure headers, safe CORS, HTTPS, dependency scanning
- Avoid unsafe MongoDB operators or passing user-controlled objects directly into database filters/updates
- Prevent NoSQL injection and path/regex abuse
- No secrets or personal financial data in logs
- No public endpoints that expose another user's transactions, budgets, or goals
- Review dependencies and remove unused packages carefully

### Privacy and user control
- Data export for the user's records
- Account deletion workflow with explicit confirmation and a documented retention policy
- Clear handling of associated transactions/goals on deletion
- Minimal collection of personal data
- No financial data sent to analytics or AI providers without explicit future design, disclosure, and consent
- Do not claim “bank-grade security” or compliance certification without evidence

---

## 6. Required API capabilities

Endpoint names are suggestions; align with existing conventions and document the final contract.

### Authentication / profile
- `GET /api/v1/auth/me`
- Google/Firebase sign-in exchange or existing equivalent
- `POST /api/v1/auth/logout`
- `PATCH /api/v1/profile`
- `GET /api/v1/profile`
- Account deletion and export endpoints when implemented

### Transactions
- `POST /api/v1/transactions`
- `GET /api/v1/transactions` with pagination, date range, type, category, search, and sort filters
- `GET /api/v1/transactions/:id`
- `PATCH /api/v1/transactions/:id`
- `DELETE /api/v1/transactions/:id`
- Bulk import/export only after validation and duplicate handling are designed

### Categories
- List default + user categories
- Create/update/archive custom category
- Prevent incompatible category types and handle referenced categories safely

### Budgets
- Create/update/get budgets by month
- Get budget utilization and remaining amounts
- Server-side summary after transaction mutations
- Explicit rules for overspending and missing budgets

### Savings goals
- Create/list/get/update/archive goals
- Add allocation/contribution
- Withdraw/deallocate with validation
- List goal movement history
- Get progress, target remaining, target date estimate (only if based on a clearly stated calculation)
- Get available/unallocated savings using the documented accounting model
- Prevent duplicate allocation requests with idempotency keys

### Reports and dashboard data
- Monthly summary by month
- Category breakdown
- Income vs expenses trend
- Budget status
- Savings rate and goal progress
- Previous-month comparison
- All results derived from authoritative database records and scoped to the current user

### Recurring items — later in the plan
- Create/edit/pause/cancel a recurring rule
- Generate due transactions idempotently
- Define behaviour for missed runs, timezone changes, edits, and cancellation
- Do not create duplicate entries after retries or worker restarts

---

## 7. Data correctness and resilience

Financial data must be correct even when requests are retried, a network drops, or two requests arrive at the same time.

- Use unique indexes for Firebase UID, category/budget uniqueness, and idempotency keys where appropriate.
- Use MongoDB transactions when a business operation requires multiple writes to succeed or fail together and the deployment supports transactions.
- If transactions are unavailable in the current environment, explicitly design compensating actions and test crash/retry scenarios; do not pretend the operation is atomic.
- Make goal allocations, transfers, and recurring generation idempotent.
- Ensure a repeated request cannot duplicate a transaction or goal contribution.
- Recalculate summaries from source records or use a carefully tested cache/projection that can be rebuilt.
- Never make cached aggregates the only copy of financial truth.
- Define behaviour for timezone boundaries, leap years, month changes, refunds, edits, deleted categories, and zero-income months.
- Add database migrations/backfills with a dry-run mode, counts, backup guidance, and rollback strategy.
- Avoid unbounded queries and unbounded arrays embedded in a single user document.
- Add indexes for common access patterns such as `{ userId, transactionDate }`, `{ userId, type, transactionDate }`, and goal history lookups, adjusted to the actual schemas and query plans.

---

## 8. Testing and quality gates

No phase is complete just because the build succeeds or Codex says it is complete.

### Unit tests
- Money arithmetic, rounding and currency precision
- Month boundaries and timezone handling
- Savings rate for zero/no income
- Budget usage after create/edit/delete
- Goal contribution, withdrawal, correction and balance calculation
- Validation and error mapping

### Integration tests
- Authenticated transaction CRUD
- User A cannot read/change User B's records even when guessing IDs
- Goal ownership and allocation limits
- Budgets recalculate after transaction edits/deletions
- Duplicate request/idempotency behaviour
- Concurrent first login and duplicate user creation
- Database unavailable and Firebase misconfigured scenarios

### End-to-end tests
- Google sign-in → backend session → `/me` → refresh → protected route → logout
- Add income and expense → month summary changes correctly
- Create Wedding goal → allocate contribution → verify progress and unallocated balance
- Set a category budget → record expense → utilization changes
- Edit/delete transaction → all affected views remain consistent
- Mobile-sized viewport and desktop viewport smoke tests

### Release gates
- Lint and production build pass
- All critical tests pass in CI
- No known critical/high dependency vulnerabilities left unreviewed
- No secrets in repository history or client bundles
- No cross-user access in authorization tests
- API docs and `.env.example` updated
- Rollback and backup/restore procedure documented
- No knowingly broken feature advertised as implemented

Use synthetic test data. Never run destructive tests against production data.

---

## 9. Mobile and desktop requirements — apply to every phase

Even though backend comes first, every endpoint and workflow must support the eventual mobile and desktop experience.

- Server-side pagination and filters must work for small screens and slow connections.
- Avoid endpoints that require downloading every transaction to compute totals on the client.
- Use consistent API contracts and stable error codes so responsive UI can show useful feedback.
- Design empty states, loading states, validation errors, retry behaviour, and partial failures.
- Ensure forms can submit safely on mobile; protect against double taps and duplicate requests.
- Test at minimum: 360px mobile width, 390px mobile width, tablet width, and desktop width.
- Keyboard accessibility and screen-reader labels are required when UI work begins.
- Do not use fixed-width assumptions or return excessively large payloads.
- API performance targets should be measured under a defined test setup, not promised without measurement.

---

## 10. Delivery roadmap: 17 October–30 November 2026

The dates are a planning target, not a reason to skip release gates. If a phase fails its acceptance criteria, fix it before moving forward.

### Phase 0 — Repository audit and baseline (17–20 October)
**Goal:** Understand the real current implementation before making broad changes.

Tasks:
- Inspect package files, route tree, controllers, models, auth services, environment usage, deployment config and current tests.
- Trace Google login end-to-end and fix the known HTTP 500 root cause using logs and tests, not guesses.
- Document current endpoint contracts and data shape.
- Identify duplicate logic, missing validation, unsafe queries, inconsistent errors and missing indexes.
- Capture current production build/test baseline.
- Add `.env.example` with variable names and safe placeholders only.
- Confirm secrets are not tracked by Git; rotate any exposed credentials.

Deliverables:
- `docs/architecture/current-state.md`
- `docs/api/current-endpoints.md`
- `docs/security/risk-register.md`
- A prioritized list of defects, with evidence and file references

Acceptance:
- Google sign-in works locally and in the deployed environment, or the exact remaining blocker is documented.
- No secrets are committed.
- No large rewrite begins before the audit.

### Phase 1 — Authentication and API foundation (21–27 October)
Tasks:
- Make Firebase Admin configuration validation reliable.
- Test sign-in, returning user, logout, session persistence and protected API access.
- Harden CORS, cookies, CSRF protection, error middleware, request IDs and rate limits.
- Add input validation and consistent error responses.
- Ensure every protected route derives the user identity from verified server-side auth, never from request body/query.
- Add health/readiness endpoints and safe structured logs.
- Add integration tests for authentication and cross-user isolation.

Acceptance:
- Auth regression suite passes.
- Invalid Firebase tokens return 401; missing server configuration returns a safe 503; unexpected exceptions return generic 500 with a request ID.
- No token/private key appears in logs or client storage.
- A user's API calls cannot access another user's records.

### Phase 2 — Finance ledger and transactions (28 October–3 November)
Tasks:
- Finalize transaction types, amount precision, currency, transaction date and timezone policy.
- Implement/repair transaction CRUD, filtering, search, pagination and sorting.
- Implement categories and safe category archival/deletion.
- Add server-side monthly summary and category breakdown.
- Add required indexes and query-plan checks.
- Add transaction validation, idempotency for create/import where appropriate, and tests for edits/deletes.

Acceptance:
- Income and expense totals are correct for the selected month.
- Editing or deleting a transaction updates all affected summaries.
- Pagination is stable and bounded.
- Cross-user access tests pass.
- Money arithmetic does not depend on imprecise floating-point totals.

### Phase 3 — Budgets, reports and monthly tracking (4–10 November)
Tasks:
- Create total and category budgets by month.
- Calculate actual spend and remaining budget from transactions.
- Add monthly/yearly reports and 12-month trends where useful.
- Add previous-month comparison and savings-rate logic.
- Define behaviour for refunds, category changes, no income, and month boundaries.
- Test every calculation against hand-checked examples.

Acceptance:
- Budget totals match eligible transactions exactly.
- A transaction create/edit/delete updates budget usage correctly.
- Zero-income months do not produce NaN/Infinity or misleading savings rates.
- Monthly reports use the user's timezone consistently.

### Phase 4 — Savings goals and allocation ledger (11–17 November)
Tasks:
- Implement goals, targets, optional target dates and priorities.
- Implement append-only goal movement history.
- Add contribution/allocation, withdrawal/deallocation and correction flows.
- Add idempotency and concurrency protection.
- Implement goal balance, target remaining, progress percentage, and unallocated savings.
- Document the difference between net savings, goal allocation, and actual bank balance.
- Add Wedding and Emergency Fund as examples in test fixtures only, not hard-coded into every user's account.

Acceptance:
- A ₹5,000 allocation from ₹17,000 net monthly savings does not reduce monthly net savings again.
- Repeated requests do not duplicate contributions.
- Withdrawal cannot create invalid negative balances unless explicitly supported by a documented planning rule.
- Goal history is auditable and user-scoped.
- Concurrent contributions produce a correct final balance.

### Phase 5 — Reliability, recurring items and user data control (18–24 November)
Prioritize in this order:
1. Data export (transactions, categories, budgets, goals and goal movements).
2. Account deletion and data-retention behaviour.
3. Backup/restore and migration runbooks.
4. Recurring transaction rules only if core reliability gates are green.
5. Optional account tracking/transfers only if the ledger and goal semantics are stable.

Recurring transaction requirements:
- Generate entries idempotently.
- Define timezone, due date, pause/cancel and missed-run behaviour.
- Test retries and worker restarts.
- Never silently create duplicate expenses.

Acceptance:
- Export is complete, private and correctly scoped.
- Deletion has explicit confirmation and a documented irreversible-data policy.
- A backup can be restored in a non-production test.
- Recurring generation cannot duplicate entries on retry.

### Phase 6 — Stabilization and release candidate (25–30 November)
Tasks:
- Run full unit, integration, end-to-end and security regression suites.
- Perform a dependency audit and remove unused packages safely.
- Load-test realistic scenarios using synthetic data (e.g., a user with thousands of transactions and many users making concurrent requests).
- Profile slow queries and fix measured bottlenecks.
- Check pagination caps, request limits, memory use and database connection handling.
- Test mobile/desktop workflows and network failures.
- Verify production environment variables, CORS origins, cookie settings, HTTPS, logs and alerting.
- Review all landing-page claims; remove any feature claim that is not implemented and tested.
- Write release notes and a rollback checklist.

Acceptance:
- No unresolved critical security issue.
- No data-isolation or financial-calculation test failures.
- Backup/restore and rollback steps are documented.
- Known limitations are visible and honest.
- AI is still optional and deferred until the underlying data is reliable.

---

## 11. Suggested daily Codex workflow

Use a narrow, reviewable task per prompt. Do not ask Codex to implement the entire roadmap in one run.

For each phase:

1. **Inspect first:** Read relevant code and tests. State current behaviour and the files that need changing.
2. **Plan:** Describe minimal changes, schema impact, API compatibility, security risks and test cases.
3. **Implement:** Change only the necessary area; do not perform unrelated refactors.
4. **Test:** Run targeted tests, then the full available test suite and production build.
5. **Review:** Inspect the diff for secrets, broad permissions, unsafe queries, duplicate code and breaking changes.
6. **Report:** List files changed, commands/tests run, results, migration/rollback steps and remaining risks.
7. **Stop on uncertainty:** If data semantics, a destructive migration, or security assumptions are unclear, ask before proceeding.

### Reusable Codex instruction

> Work on the existing SpendWise repository; do not rebuild it from scratch. First inspect the current implementation and identify the exact files, contracts, and tests relevant to this task. Preserve the current stack and working functionality unless a concrete issue requires a change. Treat financial correctness, user-data isolation, authentication, privacy, and backwards compatibility as release blockers. Validate every request server-side; derive identity from verified authentication; never trust user IDs or totals supplied by the client. Use precise money arithmetic and explicit timezone/month rules. Make writes atomic where required and retry-safe with idempotency where appropriate. Add/update unit, integration, authorization, and regression tests. Do not expose secrets or sensitive data in logs. Consider mobile and desktop API consumption, slow networks, pagination, duplicate taps, and clear error handling. Do not claim scalability to millions of users without measurements. Run tests and a production build, inspect the diff, and report exact files changed, tests executed, results, risks, and rollback/migration notes. Do not silently skip failed tests or make unrelated changes.

---

## 12. What “production-grade” means here

No codebase can honestly guarantee that it will never break or that it will automatically support millions of users. The responsible goal is to design for growth and detect failure early.

Required engineering practices:
- Clear modules and contracts
- Automated CI checks
- Database indexes based on measured query patterns
- Bounded pagination and payloads
- Rate limiting and request limits
- Safe logs, monitoring, error reporting and alerts
- Backups with tested restoration
- Schema migration and rollback plans
- Load tests with documented traffic and latency targets
- Least-privilege credentials and environment separation
- Security and privacy review
- No single mutable aggregate as the only source of financial truth

Do not introduce microservices or distributed infrastructure solely to appear enterprise-grade. Scale only when measurement shows the current architecture needs it.

---

## 13. Definition of Done for every finance feature

A feature is complete only when all applicable items pass:

- [ ] API contract documented
- [ ] Authentication and object-level authorization tested
- [ ] Request validation and safe error handling implemented
- [ ] Financial rules documented and tested
- [ ] Duplicate/retry/concurrency behaviour considered
- [ ] Database indexes/migrations reviewed
- [ ] Unit and integration tests pass
- [ ] Regression tests cover prior bugs
- [ ] Mobile and desktop consumption considered
- [ ] Logs contain request IDs but no secrets or sensitive finance details
- [ ] Export/deletion/privacy implications considered
- [ ] Production build passes
- [ ] Known limitations documented
- [ ] No unimplemented feature is advertised as available

---

## 14. Reference research

This plan draws on established API-security and backend design guidance, plus common personal-finance product workflows such as transaction tracking, budgeting, monthly reporting, and goal-based saving. It intentionally avoids copying a competitor's feature list wholesale.

- OWASP API Security Top 10 (2023): https://owasp.org/www-project-api-security/
- OWASP API Security Risks: https://api-security.owasp.org/editions/2023/en/0x11-t10/
- Firebase Admin SDK and ID-token verification: https://firebase.google.com/docs/auth/admin
- Firebase ID-token verification guide: https://firebase.google.com/docs/auth/admin/verify-id-tokens
- Firebase server-side session cookies: https://firebase.google.com/docs/auth/admin/manage-cookies
- MongoDB multi-tenant architecture and isolation considerations: https://www.mongodb.com/docs/atlas/build-multi-tenant-arch/

These references are engineering guidance, not a claim that SpendWise has been audited or certified.

---

## Final priority order

If time becomes tight, finish in this order:

1. Reliable Google/Firebase authentication and secure sessions
2. Correct transaction ledger and monthly totals
3. Budgets and monthly reporting
4. Savings goals and auditable allocations
5. Authorization/security regression suite
6. Export, deletion, backup/restore and operational readiness
7. Recurring transactions and optional account tracking
8. UI polish
9. AI insights only after the underlying numbers are trustworthy

**The November milestone is a trustworthy finance backend, not a long list of half-working features.**
