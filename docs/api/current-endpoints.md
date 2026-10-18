# Current endpoint contracts — Phase 0

> Historical Phase 0 baseline. For the remediation branch, consult [API_CONTRACT.md](../API_CONTRACT.md) and the latest Phase 0.1 engineering report. Findings here are preserved as originally audited.

Audited 17 October 2026 at application commit `91915f2`. This describes **existing behavior**, including defects; it is not the proposed Phase 1 API or an OpenAPI specification. Sources: `server.js`, `routes/*Route.js`, `controllers/*Controller.js`, `models/*.js`.

## Transport and common conventions

API base: `/api/v1`. Protected routes require `Authorization: Bearer <application JWT>`, with identity from the verified JWT's `user.id`. Firebase ID tokens are accepted only by the exchange route. No session cookies, `/auth/me` or server-side logout endpoint exist.

Route groups first run `requireDb`; unavailable MongoDB returns 503 even before authentication/validation. Missing/invalid application JWT normally returns 401. Most validation errors use 400, missing resources 404, and controller failures 500. Account-disabled login returns 403; protected requests do not recheck account status. Responses usually contain `{success, message?}` and a route-specific payload. There is no stable error code/request ID; many controllers include raw `error.message` in failures. Login/register/firebase share an instance-local limit of 30 requests / 15 minutes and return 429 when exceeded.

| Method and path | Access | Input / current response |
| --- | --- | --- |
| `GET /api/health` | Public; no DB gate | 200 `{success:true,message:"Server is running"}`. Process liveness only, not readiness. |
| `POST /api/v1/users/register` | Public, DB + rate limit | `{name,email,password,phone?}`. Name 2–50 chars, valid email, password >=6 chars. Email normalized. 201 `{success,message,token,user}`. Existing email 400. |
| `POST /api/v1/users/login` | Public, DB + rate limit | `{email,password}`. 200 `{success,message,token,user}`; unknown email/wrong password 401, inactive account 403. |
| `POST /api/v1/users/firebase` | Public, DB + rate limit | `{idToken}` nonempty string <=10000 chars. Requires Google provider, verified email and email present. 200 `{success,token,user}`. Invalid token 401, missing project config 503, identity/link conflict 409, save/signing failure generic 500. Provider infrastructure errors currently mostly become 401. |
| `GET /api/v1/users/profile` | Protected | 200 `{success,user}`, 404 if user absent. Does not check isActive. |
| `PUT /api/v1/users/profile` | Protected | Optional allowed profile fields below; Joi rejects unknown fields. 200 `{success,message,user}`. |
| `PUT /api/v1/users/change-password` | Protected | `{currentPassword,newPassword}`; presence and >=6 new-password length checked. 200 `{success,message}`; wrong current password 400. No session invalidation. |
| `DELETE /api/v1/users/profile` | Protected | No body/re-auth requirement. Deletes owned transactions, owned categories, then user in separate writes. 200 `{success,message}`. No atomicity/retention/export guarantee; app JWT remains cryptographically valid. |
| `POST /api/v1/transactions` | Protected | Full transaction input below. 201 `{success,message,transaction}`. Owner overwritten with JWT user ID. No idempotency/category-reference check. |
| `GET /api/v1/transactions` | Protected | Filters/pagination below. 200 `{success,transactions,pagination}`. |
| `GET /api/v1/transactions/stats/summary` | Protected | `period=week|month|year` (default month), or both `startDate,endDate`. 200 `{success,stats:{overall,categories,dailyTrend,netBalance}}`. **Currently returns empty aggregates for normal JWT user IDs; R4.** |
| `GET /api/v1/transactions/:id` | Protected, owner-scoped | 200 `{success,transaction}`; other user's/missing valid ID 404; malformed ObjectId currently 500. |
| `PUT /api/v1/transactions/:id` | Protected, owner-scoped | Partial transaction input. 200 `{success,message,transaction}`; other user's/missing valid ID 404. Empty update allowed; IDs not prevalidated. |
| `DELETE /api/v1/transactions/:id` | Protected, owner-scoped | Hard delete. 200 `{success,message}`; other user's/missing valid ID 404. No undo/audit trail. |
| `GET /api/v1/categories` | Protected | Optional `type`. Active system + current user's categories, sorted system first then name. 200 `{success,categories}`; no pagination cap. |
| `GET /api/v1/categories/system` | Protected | Optional `type`. Active system categories only, sorted name. 200 `{success,categories}`. |
| `POST /api/v1/categories` | Protected | `{name,type,icon?,color?}`; name 1–50 chars, type income/expense, hex color. 201 `{success,message,category}`. Case-insensitive duplicate check is regex-based, not a unique index. |
| `PUT /api/v1/categories/:id` | Protected, custom owner only | `{name?,icon?,color?,isActive?}`. 200 `{success,message,category}`. System/foreign category 404. Rename does not update transaction name references. |
| `DELETE /api/v1/categories/:id` | Protected, custom owner only | 400 if owned transactions reference its current name; otherwise hard delete with 200 `{success,message}`. System/foreign category 404. Check/delete not atomic. |
| `GET /api/v1/categories/stats/usage` | Protected | Optional `type,period` (month default). 200 `{success,stats}` with categoryName, totalAmount, transactionCount, avgAmount, type, icon, color, isSystem. **String-ID aggregate match defect and unscoped lookup; R1/R4.** |
| `GET /api/v1/dashboard/overview` | Protected | No filters. 200 `{success,overview:{totals,currentMonth,previousMonth,trends,recentTransactions}}`; recent list capped at 5. |
| `GET /api/v1/dashboard/monthly-summary` | Protected | Optional `year`, parsed with `Number(value) || currentYear`. 200 `{success,year,monthlyData}`; only months with transactions returned. |
| `GET /api/v1/dashboard/category-report` | Protected | Optional `type,period` (month default). 200 `{success,period,type,totalAmount,categories}` with percentages. **Name-only category join may expose another owner's icon/color and duplicate totals; R1.** |
| `GET /api/v1/dashboard/top-categories` | Protected | `type=expense`, `limit=5` defaults. Rolling last 30 days. 200 `{success,topCategories}`. Unvalidated/uncapped limit; category join can duplicate rows. |

## User projection and profile input

Returned user fields: `id,name,email,role,avatar,phone,dateOfBirth,monthlyBudget,monthlyIncome,monthlySavingsGoal,gender,occupation,currency,themePreference,categoryBudgets`. Password, hash, Firebase UID and account-status fields are excluded from this explicit projection. Some optional fields may be absent in JSON.

Profile PUT accepts `name,phone,avatar,dateOfBirth,monthlyBudget,monthlyIncome,monthlySavingsGoal,gender,occupation,currency,themePreference,categoryBudgets`. Numeric budget/income/goal values have minimum zero. Theme is light/dark. Currency is an arbitrary optional string, not a validated currency conversion policy. Category budgets are a map of names to nonnegative numbers, without a month key. Unknown role/UID/status/owner fields are rejected by Joi.

## Transaction input, persistence and filters

Required create fields: positive numeric `amount`, `type` income/expense, nonempty string `category`, ISO `date`. Optional: description <=500 chars, notes <=1000 chars, paymentMethod one of cash/credit_card/debit_card/bank_transfer/digital_wallet/other, string-array tags, isRecurring boolean, recurrencePattern daily/weekly/monthly/yearly. PUT accepts the same fields as optional. Category existence/type/ownership is not validated. Joi validates but these controllers persist original `req.body`, rather than the normalized Joi `value`.

Persisted transaction response: `_id,userId,amount,type,category,date,paymentMethod,tags,isRecurring,createdAt,updatedAt,__v` and supplied optional fields. Amount is a floating-point major-unit number; no currency or documented maximum/precision rule. Date is occurrence time, separate from createdAt. Records use hard deletion.

List queries: `page=1`, `limit=10`, `type`, `category`, `startDate`, `endDate`, `search`, `sortBy=date`, `sortOrder=desc`. Owner is always server-derived. Category/search are raw case-insensitive regex inputs. Dates use JS Date; bounds inclusive. Sorting uses an arbitrary caller-selected field and no unique tie-breaker. `limit=0` is accepted and removes MongoDB's result cap. Malformed/negative values may produce 500. Do not depend on these unsafe edges as a supported contract.

Pagination response fields: currentPage,totalPages,totalItems,hasNextPage,hasPrevPage. Counts and page data are separate queries, not one snapshot.

Stats overall: totalIncome,totalExpenses,transactionCount,avgTransactionAmount (empty fallback also includes netBalance); netBalance also lives under stats. Category stats group by name with type from the first row, so mixing income/expense under a name is ambiguous. Daily trend groups by UTC year/month/day.

## Dashboard/report data and date semantics

Overview totals are all-time income/expenses/count. Current month includes income/expenses/netBalance/count; previous month includes income/expenses/netBalance; trends include incomeChange/expenseChange/balanceChange. Month boundaries use server-local Moment time. Monthly summary includes month,year,monthName,totalIncome,totalExpenses,netBalance,transactionCount; date grouping uses UTC operators, while year bounds use server-local Date. December 31 bound stops at 23:59:59.000, excluding its last 999ms.

Transaction summary's default month is a **rolling previous month**, category-report month is **calendar month to date** with no upper bound, and top-categories is rolling 30 days. Future transactions can therefore appear in category reports. No user timezone policy unifies these windows. Category reports join metadata only on name, without owner/system/type constraints.

## Absent capabilities

No dedicated monthly-budget, category budget utilization, goals/movements, allocation/idempotency, account-transfer, recurring scheduler, complete server export, password reset, session revocation, account retention, API version migration or health-readiness endpoints exist. Current frontend CSV downloads and recurring detection must not be represented as the roadmap's finished backend features. Existing README examples using `/dashboard/stats` or `/monthly-report` are stale; the route table above is the current source.
