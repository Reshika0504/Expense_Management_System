const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server");
const users = require("../models/userModel");
const transactions = require("../models/transactionModel");
const { categoryModel: categories } = require("../models/categoryModel");
const app = require("../app").createApp({ logging: false, serveClient: false });
let mongo, a, b;
const secret = "isolated-stabilization-test-only";
const token = (user, extra = {}, options = {}) =>
    jwt.sign(
        {
            user: { id: String(user._id), role: "user" },
            ver: user.sessionVersion || 0,
            ...extra,
        },
        secret,
        { expiresIn: "7d", ...options },
    );
const as = (r, u = a) => r.set("Authorization", "Bearer " + token(u));
const date = "2026-10-15T12:00:00.000Z";
const range = "?startDate=2026-10-01&endDate=2026-10-31";
const row = (u, amount, type = "expense", extra = {}) => ({
    userId: u._id,
    amount,
    type,
    category: type === "income" ? "Salary" : "Shared",
    date: new Date(date),
    ...extra,
});
const create = (data = {}, u = a) =>
    as(request(app).post("/api/v1/transactions"), u).send({
        amount: 12.34,
        type: "expense",
        category: "Shared",
        date,
        ...data,
    });
before(async () => {
    process.env.JWT_SECRET = secret;
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    await users.init();
});
beforeEach(async () => {
    await Promise.all([users.deleteMany({}), transactions.deleteMany({}), categories.deleteMany({})]);
    [a, b] = await users.create([
        { name: "User A", email: "a@example.com", firebaseUid: "a" },
        { name: "User B", email: "b@example.com", firebaseUid: "b" },
    ]);
    await categories.create([
        {
            name: "Shared",
            type: "expense",
            userId: a._id,
            icon: "A-ONLY",
            color: "#111111",
        },
        {
            name: "Shared",
            type: "expense",
            userId: b._id,
            icon: "B-ONLY",
            color: "#222222",
        },
        { name: "Salary", type: "income", isSystem: true, userId: null },
    ]);
});
after(async () => {
    await mongoose.disconnect();
    await mongo?.stop();
});

test("category report, usage and top categories preserve two-user totals and metadata", async () => {
    await transactions.create([row(a, 12.34), row(b, 91.23)]);
    // Historical duplicate category names must not multiply ledger entries.
    await categories.create({
        name: "Shared",
        type: "expense",
        userId: a._id,
        icon: "A-DUP",
        color: "#333333",
    });
    for (const [u, amount, forbidden] of [
        [a, 12.34, "B-ONLY"],
        [b, 91.23, "A-ONLY"],
    ]) {
        for (const path of ["/dashboard/category-report", "/categories/stats/usage", "/dashboard/top-categories"]) {
            const res = await as(request(app).get("/api/v1" + path + range + "&type=expense"), u);
            assert.equal(res.status, 200);
            const data = res.body.categories || res.body.stats || res.body.topCategories;
            assert.equal(data.length, 1, path);
            assert.equal(data[0].totalAmount, amount, path);
            assert.ok(!JSON.stringify(data).includes(forbidden));
        }
    }
});
test("default categories, orphan and archived history retain totals without foreign metadata", async () => {
    await categories.updateMany({ userId: a._id }, { $set: { isActive: false } });
    await transactions.create([
        row(a, 5),
        row(a, 10, "income"),
        row(a, 7, "expense", { category: "Deleted legacy category" }),
    ]);
    const res = await as(request(app).get("/api/v1/dashboard/category-report" + range));
    assert.equal(res.status, 200);
    assert.equal(res.body.totalAmount, 22);
    assert.equal(res.body.categories.length, 3);
    assert.ok(!JSON.stringify(res.body).includes("B-ONLY"));
    assert.equal((await create({ type: "income", category: "Salary" })).status, 201);
});
test("transaction category references must be active, visible and type compatible", async () => {
    await categories.create({
        name: "Private B",
        type: "expense",
        userId: b._id,
    });
    for (const category of ["Private B", "Absent", "Salary"]) assert.equal((await create({ category })).status, 400);
    await categories.updateOne({ userId: a._id, name: "Shared" }, { $set: { isActive: false } });
    assert.equal((await create()).status, 400);
});
test("empty reports and empty summary are explicit successful zeros", async () => {
    const res = await as(request(app).get("/api/v1/transactions/stats/summary" + range));
    assert.equal(res.status, 200);
    assert.equal(res.body.stats.overall.totalExpenses, 0);
    assert.equal(res.body.stats.netBalance, 0);
    assert.deepEqual(res.body.stats.categories, []);
    const report = await as(request(app).get("/api/v1/dashboard/category-report" + range));
    assert.equal(report.body.totalAmount, 0);
    assert.deepEqual(report.body.categories, []);
});
test("summary uses exact income/expense totals and changes after edit and delete", async () => {
    await transactions.create([row(a, 0.1), row(a, 0.2), row(a, 10, "income"), row(b, 1000)]);
    let res = await as(request(app).get("/api/v1/transactions/stats/summary" + range));
    assert.equal(res.body.stats.overall.totalExpenses, 0.3);
    assert.equal(res.body.stats.netBalance, 9.7);
    const t = await transactions.findOne({ userId: a._id, type: "income" });
    assert.equal(
        (
            await as(request(app).put("/api/v1/transactions/" + t._id)).send({
                amount: 0.3,
            })
        ).status,
        200,
    );
    res = await as(request(app).get("/api/v1/transactions/stats/summary" + range));
    assert.equal(res.body.stats.netBalance, 0);
    await as(request(app).delete("/api/v1/transactions/" + t._id));
    res = await as(request(app).get("/api/v1/transactions/stats/summary" + range));
    assert.equal(res.body.stats.netBalance, -0.3);
});
test("UTC date-only range includes final millisecond and excludes next month", async () => {
    await transactions.create([
        row(a, 1, "expense", { date: new Date("2026-10-01T00:00:00Z") }),
        row(a, 2, "expense", { date: new Date("2026-10-31T23:59:59.999Z") }),
        row(a, 4, "expense", { date: new Date("2026-11-01T00:00:00Z") }),
    ]);
    const res = await as(request(app).get("/api/v1/transactions/stats/summary" + range));
    assert.equal(res.body.stats.overall.totalExpenses, 3);
    const monthly = await as(request(app).get("/api/v1/dashboard/monthly-summary?year=2026"));
    assert.equal(monthly.body.monthlyData.find((x) => x.month === 10).totalExpenses, 3);
});
test("malformed financial records fail safely rather than appearing as zero", async () => {
    for (const patch of [
        { amount: "not-money" },
        { amount: null },
        { amount: 1.234 },
        { type: "transfer" },
        { date: "bad-date" },
    ]) {
        await transactions.deleteMany({});
        await transactions.collection.insertOne({ ...row(a, 12), ...patch });
        const res = await as(request(app).get("/api/v1/transactions/stats/summary" + range));
        assert.equal(res.status, 422, JSON.stringify(patch));
        assert.equal(res.body.code, "DATA_INTEGRITY_ERROR");
        assert.ok(!res.body.error);
    }
});
test("invalid queries, IDs, amounts and unsupported refund/transfer writes return 400", async () => {
    for (const query of ["?limit=0", "?limit=101", "?page=-1", "?startDate=bad", "?sortBy=unknown"])
        assert.equal((await as(request(app).get("/api/v1/transactions" + query))).status, 400, query);
    assert.equal((await as(request(app).get("/api/v1/transactions/not-an-id"))).status, 400);
    for (const amount of [0, -1, 0.001, 1e15]) assert.equal((await create({ amount })).status, 400);
    for (const type of ["refund", "transfer"]) assert.equal((await create({ type })).status, 400);
    assert.equal(
        (await as(request(app).get("/api/v1/transactions/stats/summary?startDate=2026-11-01&endDate=2026-10-01")))
            .status,
        400,
    );
});
test("disabled valid-token accounts are denied consistently across protected route groups", async () => {
    const prior = token(a);
    await users.updateOne({ _id: a._id }, { $set: { isActive: false } });
    for (const path of ["/users/profile", "/transactions", "/categories", "/dashboard/overview"])
        assert.equal(
            (
                await request(app)
                    .get("/api/v1" + path)
                    .set("Authorization", "Bearer " + prior)
            ).status,
            403,
            path,
        );
});
test("deleted user, expired, invalid and missing tokens cannot access records", async () => {
    for (const bearer of [null, "broken", token(a, {}, { expiresIn: -1 })]) {
        let r = request(app).get("/api/v1/transactions");
        if (bearer) r = r.set("Authorization", "Bearer " + bearer);
        assert.equal((await r).status, 401);
    }
    const prior = token(a);
    await users.deleteOne({ _id: a._id });
    assert.equal(
        (
            await request(app)
                .get("/api/v1/transactions")
                .set("Authorization", "Bearer " + prior)
        ).status,
        401,
    );
});
test("logout revokes existing sessions and fresh active sessions still work", async () => {
    const prior = token(a);
    assert.equal((await as(request(app).get("/api/v1/transactions"))).status, 200);
    assert.equal((await as(request(app).post("/api/v1/users/logout"))).status, 200);
    assert.equal(
        (
            await request(app)
                .get("/api/v1/transactions")
                .set("Authorization", "Bearer " + prior)
        ).status,
        401,
    );
    const updated = await users.findById(a._id).select("+sessionVersion");
    assert.equal((await as(request(app).get("/api/v1/transactions"), updated)).status, 200);
});
test("foreign transaction read/update/delete and foreign category mutation remain inaccessible", async () => {
    const t = await transactions.create(row(b, 42));
    const c = await categories.findOne({ userId: b._id });
    assert.equal((await as(request(app).get("/api/v1/transactions/" + t._id))).status, 404);
    assert.equal(
        (
            await as(request(app).put("/api/v1/transactions/" + t._id)).send({
                amount: 1,
            })
        ).status,
        404,
    );
    assert.equal((await as(request(app).delete("/api/v1/transactions/" + t._id))).status, 404);
    assert.equal(
        (
            await as(request(app).put("/api/v1/categories/" + c._id)).send({
                color: "#ffffff",
            })
        ).status,
        404,
    );
    assert.equal((await as(request(app).delete("/api/v1/categories/" + c._id))).status, 404);
});
test("legacy unversioned active tokens work until the first explicit revocation", async () => {
    const legacy = jwt.sign({ user: { id: String(a._id), role: "admin" } }, secret, { expiresIn: "7d" });
    assert.equal(
        (
            await request(app)
                .get("/api/v1/users/profile")
                .set("Authorization", "Bearer " + legacy)
        ).body.user.role,
        "user",
    );
    await as(request(app).post("/api/v1/users/logout"));
    assert.equal(
        (
            await request(app)
                .get("/api/v1/users/profile")
                .set("Authorization", "Bearer " + legacy)
        ).status,
        401,
    );
});
test("full application middleware handles CORS, body errors, DB outage and avoids credentials", async () => {
    const allowed = await as(request(app).get("/api/v1/transactions")).set("Origin", "http://localhost:3000");
    assert.equal(allowed.headers["access-control-allow-origin"], "http://localhost:3000");
    assert.equal(allowed.headers["access-control-allow-credentials"], undefined);
    const denied = await as(request(app).get("/api/v1/transactions")).set("Origin", "https://untrusted.example");
    assert.equal(denied.headers["access-control-allow-origin"], undefined);
    const invalid = await as(request(app).post("/api/v1/transactions"))
        .set("Content-Type", "application/json")
        .send("{invalid");
    assert.equal(invalid.status, 400);
    assert.equal(invalid.body.code, "VALIDATION_ERROR");
    const large = await as(request(app).post("/api/v1/transactions")).send({
        notes: "x".repeat(110000),
    });
    assert.equal(large.status, 413);
    assert.equal(allowed.headers["cache-control"], "no-store");
    assert.equal(allowed.headers["x-powered-by"], undefined);
    await mongoose.disconnect();
    try {
        const unavailable = await as(request(app).get("/api/v1/transactions"));
        assert.equal(unavailable.status, 503);
    } finally {
        await mongoose.connect(mongo.getUri());
    }
});
test("category metadata cannot be borrowed from another transaction type or misowned system category", async () => {
    await categories.create([
        { name: "Legacy", type: "income", userId: a._id, icon: "WRONG-TYPE" },
        {
            name: "Legacy",
            type: "expense",
            userId: b._id,
            isSystem: true,
            icon: "BAD-SYSTEM",
        },
    ]);
    await transactions.create(row(a, 7, "expense", { category: "Legacy" }));
    const res = await as(request(app).get("/api/v1/dashboard/category-report" + range + "&type=expense"));
    assert.equal(res.body.totalAmount, 7);
    assert.equal(res.body.categories[0].icon, "");
    assert.equal((await create({ category: "Legacy" })).status, 400);
});
test("archived historical records can be corrected without enabling unauthorized category changes", async () => {
    const stored = await transactions.create(row(a, 2));
    await categories.updateOne({ userId: a._id }, { $set: { isActive: false } });
    assert.equal((await as(request(app).put("/api/v1/transactions/" + stored._id)).send({ amount: 3 })).status, 200);
    assert.equal(
        (await as(request(app).put("/api/v1/transactions/" + stored._id)).send({ category: "Absent" })).status,
        400,
    );
    const category = await categories.findOne({ userId: a._id });
    assert.equal(
        (await as(request(app).put("/api/v1/categories/" + category._id)).send({ name: "Renamed" })).status,
        409,
    );
});
test("API money fields agree with the fixture consumed by the actual frontend dashboard", async () => {
    const fixture = require("../client/src/test-fixtures/finance-contract.json");
    const now = new Date();
    await transactions.create([
        row(a, 0.1, "expense", { date: now }),
        row(a, 0.2, "expense", { date: now }),
        row(a, 10, "income", { date: now }),
    ]);
    const res = await as(request(app).get("/api/v1/transactions/stats/summary"));
    for (const [key, value] of Object.entries(fixture.stats.overall))
        assert.equal(res.body.stats.overall[key], value, key);
    const dashboard = await as(request(app).get("/api/v1/dashboard/overview"));
    assert.deepEqual(dashboard.body.overview.currentMonth, fixture.overview.currentMonth);
});
test("income-only, expense-only, zero-net periods and malformed date filters remain distinct", async () => {
    await transactions.create(row(a, 15, "income"));
    let res = await as(request(app).get("/api/v1/transactions/stats/summary" + range));
    assert.equal(res.body.stats.netBalance, 15);
    assert.equal(res.body.stats.overall.totalExpenses, 0);
    await transactions.create(row(a, 15));
    res = await as(request(app).get("/api/v1/transactions/stats/summary" + range));
    assert.equal(res.body.stats.netBalance, 0);
    assert.equal(res.body.stats.overall.transactionCount, 2);
    for (const suffix of [
        "?startDate=2026-02-30",
        "?startDate=2026-10-01T12:00:00",
        "?period=invalid",
        "?type=transfer",
    ])
        assert.equal((await as(request(app).get("/api/v1/transactions/stats/summary" + suffix))).status, 400);
});

test("password mutation validates types and bcrypt byte limits before modifying credentials", async () => {
    for (const newPassword of [{ malformed: true }, "short", "界".repeat(25)])
        assert.equal(
            (
                await as(request(app).put("/api/v1/users/change-password")).send({
                    currentPassword: "synthetic",
                    newPassword,
                })
            ).status,
            400,
        );
    assert.equal(
        (
            await request(app)
                .post("/api/v1/users/register")
                .send({
                    name: "Example",
                    email: "invalid-password@example.com",
                    password: "x".repeat(73),
                })
        ).status,
        400,
    );
});
test("machine-readable contract matches every implemented GET response and ownership boundary", async () => {
    const spec = require("../docs/api/openapi.json");
    const stored = await transactions.create(row(a, 12.34));
    for (const [path, methods] of Object.entries(spec.paths)) {
        if (!methods.get) continue;
        const url = path.replace("{id}", String(stored._id));
        const res = await as(request(app).get(url));
        assert.equal(res.status, 200, url);
        const schema = methods.get.responses["200"].content["application/json"].schema;
        for (const key of schema.required) assert.ok(key in res.body, url + ":" + key);
        if (methods.get.security.length) assert.equal((await request(app).get(url)).status, 401, url);
    }
});
test("a user without custom categories can record and report genuine global defaults", async () => {
    await categories.deleteMany({ userId: a._id });
    await categories.create({ name: "Global default", type: "expense", userId: null, isSystem: true, icon: "GLOBAL" });
    assert.equal((await create({ category: "Global default", amount: 2 })).status, 201);
    const res = await as(request(app).get("/api/v1/dashboard/category-report" + range + "&type=expense"));
    assert.equal(res.body.totalAmount, 2);
    assert.equal(res.body.categories[0].icon, "GLOBAL");
    assert.equal(res.body.categories[0].isSystem, true);
});
test("timestamp offsets normalize to UTC and pagination is stable with literal regex characters", async () => {
    await transactions.create([
        row(a, 1, "expense", { date: new Date("2026-10-01T00:00:00+05:30") }),
        row(a, 2, "expense", { date: new Date("2026-11-01T00:00:00+05:30") }),
    ]);
    const summary = await as(request(app).get("/api/v1/transactions/stats/summary" + range));
    assert.equal(summary.body.stats.overall.totalExpenses, 2);
    await transactions.create([row(a, 3, "expense", { description: "literal [bracket]" }), row(a, 4)]);
    const first = await as(request(app).get("/api/v1/transactions?limit=1&page=1"));
    const second = await as(request(app).get("/api/v1/transactions?limit=1&page=2"));
    assert.notEqual(first.body.transactions[0]._id, second.body.transactions[0]._id);
    const search = await as(request(app).get("/api/v1/transactions?search=%5Bbracket%5D"));
    assert.equal(search.status, 200);
    assert.equal(search.body.pagination.totalItems, 1);
});
test("missing signing configuration cannot create accounts and malformed disabled state fails closed", async () => {
    const saved = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    try {
        const res = await request(app)
            .post("/api/v1/users/register")
            .send({ name: "Config Test", email: "config@example.com", password: "Synthetic-password!" });
        assert.equal(res.status, 503);
        assert.equal(await users.countDocuments({ email: "config@example.com" }), 0);
    } finally {
        process.env.JWT_SECRET = saved;
    }
    await users.collection.updateOne({ _id: a._id }, { $set: { isActive: "false" } });
    assert.equal((await as(request(app).get("/api/v1/transactions"))).status, 403);
});
