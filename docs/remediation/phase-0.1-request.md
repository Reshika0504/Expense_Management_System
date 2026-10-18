# SpendWise — Phase 0.1: Audit Remediation, Security Review and Backend Stabilization

## 1. Project context

You are working on SpendWise, an existing personal finance management application.

The project roadmap is located at:

`docs/SpendWise_Backend_First_Roadmap.md`

The Phase 0 audit report is located at:

`/Users/reshika/Documents/Codex/2026-10-16/files-mentioned-by-the-user-spendwise/outputs/SpendWise_Phase_0_Audit.md`

Read both documents completely before making any code changes. If the audit report is not accessible at the specified path, locate the exact report within the available workspace or ask me to provide it. Do not guess at findings that you cannot verify.

The existing application uses React, Node.js/Express, MongoDB and Firebase Authentication. Verify the actual implementation and dependency versions before making architectural decisions.

The audit reported the following issues:

1. Category reports may join another user's category metadata, potentially producing duplicated totals or incorrect report results.
2. Transaction summaries may incorrectly display ₹0.
3. Tokens belonging to disabled accounts may remain usable.
4. Session storage and dependency security reviews remain incomplete.

Existing checks reportedly include 14 backend tests, 13 frontend tests, a production build and GitHub CI. These checks do not adequately cover the defects listed above.

## 2. Objective

Complete Phase 0.1 before beginning Phase 1.

Your job is to remediate verified audit findings, complete the outstanding security review, establish reliable regression coverage and document the backend contracts that future frontend development must follow.

This is a stabilization task, not a request to rebuild the application.

Do not implement new financial features such as budgets, savings goals, recurring transactions or a new dashboard in this phase. Do not begin Phase 1 authentication redesign unless a minimal change is necessary to fix a verified finding.

Preserve existing working functionality and the current technology stack wherever practical.

## 3. Mandatory initial inspection

Before editing files:

1. Inspect the repository structure, Git status, current branch and recent relevant commits.
2. Identify the exact code paths, models, database queries, middleware and frontend components involved in each reported defect.
3. Read the existing tests and identify why they failed to detect the problems.
4. Trace the affected data from the database through backend services and API responses to the frontend.
5. Identify related endpoints that reuse the same query, aggregation, authentication or session logic.
6. Record the existing API behaviour so that fixes do not introduce accidental breaking changes.
7. Create a concise remediation plan mapping each finding to the relevant files, tests and acceptance criteria.

Do not overwrite unrelated local changes. Do not reset the repository or discard user work.

If you discover that a proposed fix could change an existing API contract, document the impact before implementing it.

## 4. Finding A — Category report tenant isolation and duplicate totals

Investigate the category report that may combine category metadata belonging to another user.

Requirements:

- Trace the complete aggregation or query, including joins, lookups, grouping and filtering.
- Verify whether categories are global defaults, user-owned categories, or a combination of both.
- Enforce correct ownership and visibility rules at every relevant query stage.
- Do not rely solely on filtering the final response if cross-user records have already influenced the aggregation.
- Ensure a transaction can only use a category permitted for that user.
- Prevent duplicate joins or unintended one-to-many relationships from inflating transaction totals.
- Preserve legitimate global default categories if the current product design supports them.
- Do not expose another user's category name, metadata, identifiers or associated financial information.
- Apply the same security review to related category-based reports and transaction queries.
- Preserve expected report behaviour for users with no transactions, no custom categories or deleted/archived categories.

Create regression tests using at least two separate users with overlapping category names, distinct category IDs, different transactions and different transaction amounts.

Prove that:

1. User A's report contains only the data User A is permitted to see.
2. User B's report contains only the data User B is permitted to see.
3. Neither user's totals are inflated by joins.
4. Unauthorized category references are rejected or handled according to a documented rule.
5. Legitimate default categories continue to work.
6. Empty reports return the correct empty-state data rather than leaking or inventing records.

Use isolated test data and clean it up reliably after tests.

## 5. Finding B — Transaction summary incorrectly displays ₹0

Trace the transaction summary from the database through the service layer, API response and frontend display.

Investigate, rather than assume, possible causes such as:

- Incorrect aggregation stages or field names.
- Incorrect handling of numeric types.
- Inconsistent transaction schemas.
- Incorrect filters or date boundaries.
- Empty aggregation results.
- Missing or mismatched API response properties.
- Frontend code reading the wrong response field.
- Incorrect currency formatting or fallback logic.

Identify the actual root cause and fix it at the correct layer.

Requirements:

- Use a single documented source of truth for financial summary calculations.
- Keep financial amounts in the project's established, safely handled numeric representation.
- Avoid floating-point arithmetic errors where monetary precision is affected.
- Define the behaviour for no transactions, income-only periods, expense-only periods, refunds and transfers.
- Ensure the selected date range and timezone are handled consistently.
- Ensure that summary calculations use the intended transaction types and do not double-count records.
- Return a valid zero only when the actual result is zero.
- Do not silently convert invalid or missing financial data into a successful zero-valued summary.
- Return a consistent, actionable error when a calculation cannot be completed.

Add regression tests for:
- Multiple income and expense transactions.
- Empty results.
- Valid zero totals.
- Different date ranges and month boundaries.
- Refunds and transfers where applicable to the current implementation.
- Missing or malformed data.
- Summary results after editing or deleting a transaction.

Verify the API response and the frontend rendering together. Do not fix a backend defect merely by hardcoding a frontend fallback.

## 6. Finding C — Disabled accounts and existing tokens

Investigate the actual authentication and session architecture before selecting a fix.

Determine whether the application uses Firebase ID tokens, Firebase session cookies, application-managed sessions, or a combination.

Requirements:

- Establish the authoritative source of account-disabled status.
- Verify how a disabled user's existing tokens, cookies and sessions are handled.
- Implement the correct server-side enforcement for the existing architecture.
- If Firebase token revocation checks, Firebase user status checks or session invalidation are necessary, implement the appropriate approach after verifying the SDK version and current configuration.
- Do not assume that verifying a token's signature alone is sufficient to enforce a disabled-account policy.
- Do not trust a user ID, role or disabled-status flag supplied by the frontend.
- Enforce the policy consistently across protected API routes, not just the login endpoint.
- Ensure logout and session invalidation behave correctly.
- Do not log authentication tokens, cookies, private keys or sensitive user information.
- Preserve legitimate active-user sessions where the security policy allows them.
- Consider the operational impact of any added verification calls, caching or revocation checks.

Add tests covering:
1. A valid token for an active account.
2. A disabled account with an otherwise valid token.
3. A revoked, expired or invalid token where supported by the current architecture.
4. A missing token.
5. Logout and subsequent protected requests.
6. Attempts to access another user's records.
7. Behaviour when the authentication provider is temporarily unavailable.

Document the exact disabled-account and session-invalidation behaviour. Do not claim immediate revocation unless the implementation and tests demonstrate it.

## 7. Finding D — Session storage security review

Perform a security review of session and token handling across the frontend, backend and deployment configuration.

Inspect:

- localStorage and sessionStorage usage.
- Cookies and their attributes.
- Firebase client authentication persistence.
- Access tokens, ID tokens, refresh tokens and session cookies.
- Authentication headers and request interceptors.
- Logout and expired-session handling.
- CORS and credential configuration.
- CSRF exposure where cookie-based authentication is used.
- XSS exposure relevant to token handling.
- Sensitive data stored in browser storage.
- Authentication-related logging and error messages.
- Session expiration and renewal behaviour.

Produce a data-flow explanation showing where credentials originate, how they are transported, how the backend validates them, and how they are invalidated.

Fix verified high-risk issues within this phase when the correction is bounded and safe.

Do not perform a blind migration between authentication architectures. Do not introduce a second session mechanism alongside the existing one without a documented technical reason.

If a finding requires a larger architectural change, document the risk, proposed design, migration considerations and recommended implementation phase instead of introducing an incomplete workaround.

Verify that active users can still authenticate, use protected endpoints and log out successfully.

## 8. Finding E — Dependency and package security review

Inspect the actual dependency manifests and lockfiles for both frontend and backend.

Requirements:

- Identify outdated packages and known security advisories using the available, trustworthy audit tooling.
- Review direct and transitive dependencies where supported.
- Distinguish production dependencies from development-only dependencies.
- Identify abandoned, unnecessary or duplicated packages.
- Verify the compatibility implications of any proposed upgrades.
- Avoid broad, unreviewed dependency upgrades.
- Do not change major framework or SDK versions solely to silence warnings.
- Do not suppress or ignore security findings without documenting the reason.
- Do not disable antivirus, endpoint protection, GitHub security checks or other security tooling.

For each meaningful finding, document severity, affected package, whether it is exploitable in this application, the proposed remediation and any compatibility risk.

Fix verified critical or high-risk issues when a safe, scoped remediation is available. Run the relevant test suites and production build after each meaningful dependency change.

If a fix cannot safely be completed in this phase, report it as an explicit release blocker or documented residual risk with an owner and proposed next step.

Do not claim that the application is free of vulnerabilities merely because a package audit returns no findings.

## 9. Frontend-compatible API contract

Future frontend development must not depend on undocumented backend behaviour.

Review the existing endpoints and create or update:

`docs/API_CONTRACT.md`

Document the currently implemented APIs and their verified behaviour.

For each relevant endpoint, include:

- HTTP method and route.
- Authentication requirements.
- User-ownership and authorization rules.
- Query parameters, filters and pagination where applicable.
- Request schema, field types and required/optional fields.
- Response schema and a realistic example.
- Monetary amount representation and currency conventions.
- Date and timezone conventions.
- Validation rules.
- Expected HTTP status codes.
- Standard error response format.
- Empty-state behaviour.
- Sorting and pagination semantics.
- Relevant side effects and consistency guarantees.
- Whether the endpoint is implemented, incomplete or planned.

Establish a consistent API response and error convention where doing so is safe and compatible with the current application.

For example, validation errors should be distinguishable from unauthenticated requests, forbidden requests, missing records, conflicts, rate limits and server errors.

Do not force every endpoint into an arbitrary wrapper if the existing application already has a stable convention. Prefer a consistent contract with minimal breaking changes.

Use the actual verified API fields and types. Do not invent future endpoints and label them as implemented.

If an API change is necessary, document the old and new contracts, update all current consumers and add regression tests.

Where practical, maintain a machine-readable OpenAPI specification or another testable schema that accurately reflects the implemented endpoints. Do not introduce a large new documentation dependency without a clear benefit.

## 10. Data integrity and error handling

Review the affected financial data paths for:

- Correct user ownership.
- Consistent amount and date validation.
- Safe handling of missing records.
- Duplicate submissions and retry behaviour.
- Partial database updates.
- Error propagation.
- Consistent transaction summary calculations.
- Accidental disclosure of internal errors.
- Relevant indexes and query efficiency.

Use MongoDB transactions or other atomic mechanisms only where appropriate and supported by the current deployment. Verify database topology and transaction requirements before relying on multi-document transactions.

Do not silently change existing financial records to make reports appear correct.

If existing stored records are malformed or inconsistent, report the affected data shape and provide a safe, reversible remediation or migration plan. Do not execute destructive migrations without explicit approval.

## 11. Automated test requirements

Add tests that fail against the defective behaviour before the fix and pass after the fix.

Follow the project's existing test framework and patterns.

At minimum, cover:

- Category report tenant isolation.
- Duplicate aggregation and inflated totals.
- Transaction summary correctness.
- Disabled-account access enforcement.
- Token expiration or revocation where applicable.
- Session/logout behaviour.
- Authorization across protected endpoints.
- Validation and expected error responses.
- Regression coverage for related existing functionality.

Use integration tests for the real application layers wherever practical. Do not rely entirely on mocked database queries for database-isolation defects.

Avoid brittle tests that depend on production credentials or external services. Use safe test configuration and deterministic fixtures.

Run:
- All relevant backend tests.
- All relevant frontend tests.
- Integration and end-to-end tests available in the repository.
- Production builds.
- Linting and type checks if configured.
- CI-equivalent checks where practical.

Report actual commands and outcomes. Clearly identify any tests that could not be executed and why.

Do not modify existing tests merely to make them pass. Preserve their intent and strengthen them where necessary.

## 12. Change management and implementation discipline

- Work in a dedicated remediation branch unless the repository's established workflow specifies otherwise.
- Do not push unreviewed changes directly to the main branch.
- Do not commit secrets, private keys, personal financial data or production credentials.
- Avoid unrelated refactoring.
- Keep changes small enough to review.
- Update documentation when behaviour or contracts change.
- Preserve backwards compatibility unless a change is necessary for security or correctness.
- If a destructive migration, major architecture change or unresolved trade-off requires my decision, stop and explain the options before proceeding.
- Do not begin Phase 1 automatically after this phase.

## 13. Definition of done

Phase 0.1 is complete only when:

1. Each of the three reported functional/security defects has a verified root cause and a tested remediation, or is explicitly identified as an unresolved release blocker with a justified reason.
2. The session-storage review is complete and its findings are documented.
3. The dependency security review is complete and its findings are documented.
4. Regression tests cover the original defects.
5. Relevant existing tests and production builds have been run.
6. No known regression introduced by this work remains unresolved.
7. `docs/API_CONTRACT.md` accurately documents the relevant implemented APIs.
8. Remaining risks, breaking changes and follow-up tasks are clearly documented.
9. The code diff is reviewable and the working tree does not contain unrelated changes.

Do not claim full production readiness or zero security risk.

## 14. Final report required

When finished, provide a detailed report containing:

A. Executive summary.

B. Each audit finding:
- Verified root cause.
- Affected files.
- Fix implemented.
- Regression test added.
- Test result.
- Remaining risk.

C. Session security review:
- Current architecture.
- Findings.
- Changes made.
- Unresolved concerns.

D. Dependency review:
- Tools and commands used.
- Important findings.
- Packages changed and why.
- Compatibility concerns.
- Residual vulnerabilities.

E. API contract:
- Documentation created or updated.
- Endpoints covered.
- Any breaking or behaviour-changing modifications.

F. Verification evidence:
- Exact commands executed.
- Backend test results.
- Frontend test results.
- Integration/E2E results.
- Build and lint/type-check results.
- CI status, if available.

G. Git and delivery:
- Branch name.
- Changed files.
- Commit hash, if committed.
- Whether changes were pushed.
- Confirmation that no unrelated user changes were overwritten.

H. Remaining blockers and recommended next step.

Finish with a clear PASS, CONDITIONAL PASS or FAIL against the Phase 0.1 definition of done.

Only recommend beginning Phase 1 after the acceptance criteria have been met and any unresolved release blockers have been explicitly reported.