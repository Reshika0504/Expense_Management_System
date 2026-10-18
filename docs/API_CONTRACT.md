# SpendWise API contract — Phase 0.1

Contract date: 18 October 2026. Applies to the `codex/phase-0-1-remediation-20261018` implementation under review, **not yet deployed**. Implementation: `app.js`, `routes/`, `controllers/`, `services/`, `utils/`. Historical Phase 0 contracts describe the earlier defects, not this revision.

## Transport, identity and response conventions

Base `/api/v1`; health is `/api/health`. JSON request/response; 100 KiB request-body limit. No cookies. Protected routes require `Authorization: Bearer <application JWT>`. Firebase ID tokens are accepted only by `POST /users/firebase`. Every protected request verifies HS256 signature/expiry, loads the local user, checks `isActive` and token version, and takes identity/role from that account. Clients cannot supply owner/role/status. Other users' valid record IDs return 404 for reads/mutations. Malformed IDs return 400.

API response bodies retain the existing `{success:true,...payload}` shape. `message` is optional on successes. Failures retain `{success:false,message}` and corrected paths add `code`. Existing legacy validation/not-found/login failures may omit code; consumers must still branch on HTTP status. Never display a stack/provider/database error or inspect an `error` field.

```json
{"success":false,"code":"INVALID_CATEGORY","message":"Choose an active category available to your account and transaction type."}
```

| HTTP | Meaning / stable codes where implemented |
| --- | --- |
| 400 | Invalid input, ID, query, date, amount or category (`VALIDATION_ERROR`, `INVALID_CATEGORY`). |
| 401 | Missing/expired/invalid/deleted-account session (`UNAUTHENTICATED`), revoked application token (`SESSION_REVOKED`). |
| 403 | Local account inactive (`ACCOUNT_DISABLED`); forbidden admin operation (`FORBIDDEN`, no admin API currently exposed). |
| 404 | Resource absent or owned by another user; unknown route. Legacy message-only response remains supported. |
| 409 | Existing provider/email identity conflict, first-sign-in race, or referenced-category rename (`CATEGORY_IN_USE`). |
| 413 | Body >100 KiB (`PAYLOAD_TOO_LARGE`). |
| 422 | Malformed/unsupported stored financial data or unsafe aggregate (`DATA_INTEGRITY_ERROR`); never a successful zero. No automatic record changes. |
| 429 | Login/register/firebase share 30 attempts / 15 minutes / API instance / IP. |
| 500 | Unexpected failure (`INTERNAL_ERROR` on corrected paths), generic actionable message. |
| 503 | DB unavailable (`DATABASE_UNAVAILABLE`), app auth DB/config failure or known Firebase infrastructure outage (`AUTH_UNAVAILABLE`). |

CORS permits exactly `FRONTEND_URL` (or the canonical Render frontend default), plus `http://localhost:3000` outside production; credentials are false. An unapproved browser origin receives no allow-origin header, **not necessarily a 403**. CORS does not replace auth. API replies use `Cache-Control:no-store`. No refresh endpoint or automatic token renewal exists.

## Money and dates

- Stored/API amounts remain **JSON numbers in major units**, e.g. `12.34`, preserving existing records and frontend fields. New transaction amount must be finite, >0, <=1,000,000,000, at most 2 decimal places; numeric strings are rejected. No negative-amount encoding.
- The shared server service validates owned records, converts numeric values to MongoDB Decimal128 minor units for sums, then emits safe bounded Number results. Income/expense/net/category/month/day reports use that same source. Average transaction amounts round to nearest minor unit (positive half-up). Aggregates whose integer minor-unit totals exceed JS safe-integer bounds fail 422. Records are never silently rounded/backfilled to pass a report.
- A malformed owned financial record blocks the owner's report even when it would otherwise fall outside the selected date filter. This prevents a bad date/type/amount silently disappearing into a zero. Report errors disclose no other owner's data or offending raw values.
- Only `income` and `expense` are implemented. Refund, reversal, investment contribution and internal transfer are **not supported types** and return 400. Do not disguise a transfer/refund as income/expense. Goals/allocation accounting is not implemented.
- The legacy ledger has no transaction currency field. UI still labels amounts `Rs`; the profile's legacy currency field/default USD neither converts nor establishes record currency. Use one consistent ledger currency; multi-currency correctness and the legacy label mismatch remain Phase 2 design/migration work. Do not advertise converted balances.
- Occurrence is `date`; `createdAt`/`updatedAt` are independent UTC events. Inputs are `YYYY-MM-DD` (UTC midnight) or ISO timestamps with Z/explicit offset. Offset-free datetimes and invalid calendar dates return 400.
- For filters, date-only start is inclusive UTC midnight; date-only end includes the whole UTC day using exclusive next-midnight. Timestamp end is inclusive. Open-ended filters are allowed; reversed ranges return 400. Period defaults: UTC calendar month-to-now; year = UTC Jan 1-to-now; week = rolling 7 days-to-now. Explicit ranges override periods. Selected annual monthly-summary covers the full UTC year using [Jan 1,next Jan 1). Top categories defaults to rolling 30 days-to-now. No user-configured timezone exists yet.

## Shared schemas

### User response

`{id,name,email,role,avatar,phone,dateOfBirth,monthlyBudget,monthlyIncome,monthlySavingsGoal,gender,occupation,currency,themePreference,categoryBudgets}`. `id` is a 24-character hex string; name/email/role and numeric profile settings have defaults. Optional fields may be absent; dateOfBirth may be null. categoryBudgets is a plain map of numbers, not a monthly budget ledger. Password/hash/Firebase UID/sessionVersion/status are never part of this projection.

### Transaction create / update / response

Create required: `amount:number`, `type:income|expense`, `category:string` (trimmed, 1–50), `date:ISO string`. Optional: `description:string` <=500, `notes:string` <=1000 (both allow empty), `paymentMethod:cash|credit_card|debit_card|bank_transfer|digital_wallet|other`, `tags:string[]`, `isRecurring:boolean`, `recurrencePattern:daily|weekly|monthly|yearly`. Unknown fields rejected. PUT is partial, requires >=1 accepted field. Body owner fields are rejected. Recurring fields are metadata only; they do not generate records.

Response transaction includes `_id,userId,amount,type,category,date,paymentMethod,tags,isRecurring,createdAt,updatedAt,__v` plus optional supplied fields. Date values are UTC ISO strings. New/changed category/type must name an active custom category owned by this user or an active genuine system category (`isSystem:true,userId:null`) with matching type. A category ID passed as a name will not grant access. An unchanged historic orphan/archived category can retain its name while amount/date/notes are corrected. History remains in reports with neutral metadata when no visible category exists.

### Category create / update / response

Create `{name:string(1–50),type:income|expense,icon?:string,color?:hex}`. PUT `{name?,icon?,color?,isActive?:boolean}` with >=1 field. Unknown fields rejected. Response `{_id,name,type,icon,color,userId,isSystem,isActive,createdAt,updatedAt,__v}`; userId null means genuine shared default. Only current user custom categories can be updated/deleted. A referenced name cannot be renamed (409); archive instead. Delete returns 400 if that name is used. Duplicate name checks are case-insensitive escaped literals, not a database uniqueness guarantee.

Historical metadata lookup matches name **and type and visibility before selection**, sorts custom before system then `_id`, and chooses one candidate. Even legacy duplicate names cannot multiply money rows. Archived visible metadata may still annotate history; foreign metadata never does. Rows group by `(category,type)`, so consumers must use both as a key for mixed-type reports.

### Financial response fields

Overall: `{_id?:null,totalIncome,totalExpenses,transactionCount,avgTransactionAmount,netBalance}`. For empty results all numbers =0 and `_id` may be absent. netBalance = recorded income minus recorded expenses, never configured/planned income.

Category report row: `{_id:categoryName,categoryName,type,totalAmount,transactionCount,avgAmount,icon,color,isSystem,percentage?}`. Default missing metadata is `icon:"",color:"#6B7280",isSystem:false`. Category ordering: descending total then ascending name/type. No foreign category identifiers are returned. Daily rows: `{_id:{year,month,day},income,expenses}` (UTC). Monthly rows: `{month,year,monthName,totalIncome,totalExpenses,netBalance,transactionCount}`.

## Authentication and profile endpoints (implemented)

All paths in these tables are relative to `/api/v1`. Public auth routes still require DB availability. All other routes below are protected.

| Method / route | Request / validation | Success / empty / side effects | Expected non-success |
| --- | --- | --- | --- |
| POST `/users/register` | Public; `{name:string(2–50),email:valid email,password:string(min6,max72 UTF-8 bytes),phone?:string}`. Trim/lowercase email; unknown fields rejected. | 201 `{success,message,token,user}`. Hashes password, creates local account, issues 7-day app JWT. | 400 invalid/duplicate email; 429; 500; 503. Concurrent duplicate registration may still produce generic 500. |
| POST `/users/login` | Public; `{email:string,password:string}`; email normalized, unknown fields rejected. | 200 `{success,message,token,user}`; updates lastLogin. | 400 invalid input; 401 wrong password/unknown email (same message); 403 inactive; 429; 500; 503. |
| POST `/users/firebase` | Public; `{idToken:string(1–10000)}`. Verified Google provider, verified email and email present required. | 200 `{success,token,user}`. Lookup UID, eligible verified Gmail/Workspace linking, create/reuse local account. No phone auth. | 400 body; 401 provider credential; 403 local disabled; 409 link/UID race; 429; safe 500 unexpected; 503 missing config/known provider outage. |
| POST `/users/logout` | Protected; `{}` (no input fields consumed). | 200 `{success,message}`. Atomic sessionVersion increment revokes **all existing app sessions** for this account. Browser waits for acknowledgement before clearing state. | 401 already revoked/deleted/expired; 403 disabled; 500/503. Client can locally clear on 401/403; network errors clear this device with a warning, not proof of server revocation. |
| GET `/users/profile` | Protected; no input. | 200 `{success,user}`. Active local account required. | 401/403/503; 404 if user disappears after auth lookup; safe 500. |
| PUT `/users/profile` | Protected; optional `name(2–50),phone,avatar,dateOfBirth,monthlyBudget>=0,monthlyIncome>=0,monthlySavingsGoal>=0,gender,occupation,currency,themePreference(light|dark),categoryBudgets(map of nonnegative numbers)`. No role/UID/status/owner. | 200 `{success,message,user}`. Updates profile preferences and legacy planned numbers, never transactions or recorded income. No monthly-budget feature added. | 400 validation; 401/403/404; 500/503. |
| PUT `/users/change-password` | Protected; `{currentPassword:string(max1024),newPassword:string(min6,max72 UTF-8 bytes)}`; no unknown fields. | 200 `{success,message}`. Verify current password, atomically set bcrypt hash + increment sessionVersion. Existing sessions require re-login. Google-only accounts have no current password and cannot use this to set one. | 400 wrong/missing password/input; 401/403/404; 500/503. |
| DELETE `/users/profile` | Protected; no re-authentication request schema added. UI confirmation remains required. | 200 `{success,message}`. Sequentially deletes owned transactions, owned custom categories, then local user. Subsequent tokens fail because local user absent. | 401/403; 500/503. **Incomplete atomicity**: partial deletion can occur; no claim of transaction/retention/Firebase-identity deletion. |

Example authentication response (illustrative synthetic identifiers; no actual token):

```json
{"success":true,"token":"<application-jwt>","user":{"id":"000000000000000000000001","name":"Example User","email":"example@example.com","role":"user","monthlyBudget":0,"monthlyIncome":0,"monthlySavingsGoal":0,"currency":"USD","themePreference":"dark","categoryBudgets":{}}}
```

## Transaction endpoints (implemented)

| Method / route | Input | Success / empty / consistency | Expected non-success |
| --- | --- | --- | --- |
| POST `/transactions` | Transaction create schema above. | 201 `{success,message,transaction}`; one owned ledger record. No idempotency key; retries may duplicate records. | 400; 401/403; safe 500/503. |
| GET `/transactions` | Query `page:int(1–100000)=1,limit:int(1–100)=10,type?,category?:string<=50,search?:string<=200,startDate?,endDate?,sortBy=date|amount|createdAt|updatedAt|category|type (default date),sortOrder=asc|desc (default desc)`. Blank optional filters ignored; unknown/array/object filters rejected. | 200 `{success,transactions,pagination}`. Literal case-insensitive substring category/search. Stable sort by requested field then `_id` same direction. Data and count are separate queries, not one atomic snapshot. Empty list has totalPages=0/currentPage as requested. | 400 invalid query/range; 401/403; 500/503. |
| GET `/transactions/:id` | Valid hex ObjectId. | 200 `{success,transaction}` scoped to owner. | 400 malformed; 404 absent/foreign; 401/403/500/503. |
| PUT `/transactions/:id` | Valid ID, partial transaction schema. | 200 `{success,message,transaction}`; updates only owned record. Later reports derive from ledger; no cached financial totals. No optimistic version check, so concurrent last-write behavior remains. | 400 invalid/category; 404 absent/foreign; 401/403/500/503. |
| DELETE `/transactions/:id` | Valid ID. | 200 `{success,message}`; hard deletion, next report recalculates from source. Not retry-idempotent in HTTP response: second delete returns404. | 400/404; 401/403/500/503. |
| GET `/transactions/stats/summary` | `period=week|month|year` default month, optional type/startDate/endDate. Shared query validator also accepts limit(1–100) but this does not truncate stats. | 200 `{success,stats:{overall,categories,dailyTrend,netBalance}}`. Summary categories retain `{_id:categoryName,type,totalAmount,count}`; empty arrays/zero totals only for a valid empty ledger window. | 400 input; 401/403; 422 bad owned data/overflow; 500/503. |

Example list (synthetic):

```json
{"success":true,"transactions":[{"_id":"000000000000000000000010","userId":"000000000000000000000001","amount":12.34,"type":"expense","category":"Food & Dining","date":"2026-10-18T12:00:00.000Z","paymentMethod":"cash","tags":[],"isRecurring":false}],"pagination":{"currentPage":1,"totalPages":1,"totalItems":1,"hasNextPage":false,"hasPrevPage":false}}
```

Example summary (fixture verified by API and actual dashboard rendering tests):

```json
{"success":true,"stats":{"overall":{"_id":null,"totalIncome":10,"totalExpenses":0.3,"transactionCount":3,"avgTransactionAmount":3.43,"netBalance":9.7},"categories":[{"_id":"Shared","type":"expense","totalAmount":0.3,"count":2},{"_id":"Salary","type":"income","totalAmount":10,"count":1}],"dailyTrend":[{"_id":{"year":2026,"month":10,"day":18},"income":10,"expenses":0.3}],"netBalance":9.7}}
```

Category rows sort by descending amount, then name/type; clients must not depend on the illustrative JSON row order.

## Category endpoints (implemented)

| Method / route | Input | Success / empty / side effects | Non-success |
| --- | --- | --- | --- |
| GET `/categories` | Optional type. Shared validator accepts period/startDate/endDate/limit but these do not paginate/filter the category list. | 200 `{success,categories}`; active owned custom + genuine global defaults; system first, name ascending. Empty `[]`. No bounded category-list pagination yet. | 400/401/403/500/503. |
| GET `/categories/system` | Same query validation. | 200 `{success,categories}`; active genuine global defaults only, name ascending. Empty `[]`. | 400/401/403/500/503. |
| POST `/categories` | Category create schema. | 201 `{success,message,category}`. Duplicate visible custom/default name/type rejected with400. No unique database constraint yet. | 400/401/403/500/503. |
| PUT `/categories/:id` | Valid ID, category partial schema. | 200 `{success,message,category}`. Can archive; cannot rename a referenced name (409). | 400 duplicate/input; 404 foreign/system/absent; 409 in-use rename; 401/403/500/503. |
| DELETE `/categories/:id` | Valid ID. | 200 `{success,message}` if unused owned custom category; historical referenced names block deletion. Reference check + deletion are separate writes. | 400 in-use; 404 foreign/system/absent; 401/403/500/503. |
| GET `/categories/stats/usage` | period/type/startDate/endDate using shared report query; limit accepted but not used. | 200 `{success,stats:[category report rows]}`; no percentage. Empty `[]`. Monetary totals cannot be multiplied by metadata joins. | 400/401/403/422/500/503. |

Example category report row: `{ "_id":"Shared", "categoryName":"Shared", "type":"expense", "totalAmount":12.34, "transactionCount":1, "avgAmount":12.34, "icon":"", "color":"#6B7280", "isSystem":false }`.

## Dashboard/report endpoints (implemented)

| Method / route | Input | Success / empty / consistency | Non-success |
| --- | --- | --- | --- |
| GET `/dashboard/overview` | No query consumed. | 200 `{success,overview:{totals,currentMonth,previousMonth,trends,recentTransactions}}`. totals = all-time income/expenses/count; current = UTC month-to-now income/expenses/net/count; previous = full prior UTC month income/expenses/net; trends = percentage changes; recent = latest5 owned records by date,createdAt,_id descending. Each subquery reads independently (no cross-query snapshot guarantee). Empty totals/trends0/recent[]. | 401/403/422/500/503. |
| GET `/dashboard/monthly-summary` | `year:int(1970–9998)`, default current UTC year. Unknown query fields rejected. | 200 `{success,year,monthlyData:[monthly rows]}`; year ascending month order; no-transaction months omitted (empty[]). Uses full selected year including final millisecond. | 400/401/403/422/500/503. |
| GET `/dashboard/category-report` | Shared period/type/startDate/endDate, optional limit accepted but not used. | 200 `{success,period,type,totalAmount,categories:[category rows with percentage]}`. type is requested type or `all`; totalAmount=sum of selected income+expense amounts, **not net**. Empty total0/categories[]. | 400/401/403/422/500/503. |
| GET `/dashboard/top-categories` | Shared report query. type default expense; limit int1–100 default5. Default rolling30 days; explicit period/range overrides. | 200 `{success,topCategories:[category rows]}` sorted amount descending then name/type; limit applied after safe metadata selection. Empty[]. | 400/401/403/422/500/503. |

Overview example used by frontend is in `client/src/test-fixtures/finance-contract.json`, with values verified by `tests/stabilization.test.js` and `Dashboard.contract.test.js`. Frontend must use `overview.currentMonth.netBalance` for recorded net savings and show cents. Configured monthlyIncome is a plan, never a replacement for zero recorded income.

## Health and incomplete/planned areas

`GET /api/health` is public, returns200 `{success:true,message:"Server is running"}` independently of database state. This is liveness only. Readiness, per-user timezone/currency ledger, durable idempotency, account deletion atomicity/retention, actual monthly budgets/goals/allocations, complete server export, recurring generation, password reset and cookie sessions are **not implemented**. Do not invent routes for them in a frontend client.

## Compatibility and rollback

Existing success keys/routes/major-unit Number storage are preserved. Necessary behavior changes: owner casting, safe single category join, active-account/session enforcement, logout endpoint, category references validated, in-use rename denied, bounded literal-search queries, exact minor-unit aggregation, 422 for invalid existing records, UTC windows/date-only end, two-decimal display and password-byte bounds. A version-0 legacy app JWT remains valid for an active account until sessionVersion changes. New versioned tokens must not be rolled back to the old signature-only verifier, which would bypass revocation. No financial data migration was executed; repair plans require backup/dry-run and approval before writes.
