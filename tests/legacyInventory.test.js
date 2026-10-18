const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { MongoClient, ObjectId, Decimal128 } = mongoose.mongo;
const { runInventory, inventoryPipeline, atlasInventoryPipeline, assertReadOnlyPrivileges } = require('../scripts/read-only-legacy-inventory.cjs');
const { financeSummary } = require('../services/financeSummary');
let mongo, adminClient, readerClient, db;
const database = 'inventory_synthetic';
const permission = actions => ({ authInfo: { authenticatedUsers: [{ user: 'synthetic' }],
    authenticatedUserPrivileges: [{ resource: { db: database, collection: '' }, actions }] } });
before(async () => {
    // This process creates its own authenticated disposable database, never env/production.
    mongo = await MongoMemoryServer.create({ auth: { enable: true,
        customRootName: 'synthetic-root', customRootPwd: 'synthetic-root-test-only' } });
    const uri = mongo.getUri();
    adminClient = await new MongoClient(uri, { auth: { username: 'synthetic-root', password: 'synthetic-root-test-only' }, authSource: 'admin' }).connect();
    db = adminClient.db(database);
    await db.command({ createRole: 'inventory-reader', roles: [], privileges: ['transactions', 'users'].map(collection => ({ resource: { db: database, collection }, actions: ['find'] })) });
    await db.command({ createUser: 'synthetic-reader', pwd: 'synthetic-reader-test-only', roles: ['inventory-reader'] });
    readerClient = await new MongoClient(uri, { auth: { username: 'synthetic-reader', password: 'synthetic-reader-test-only' }, authSource: database }).connect();
    await mongoose.connect(uri, { dbName: database, authSource: 'admin', user: 'synthetic-root', pass: 'synthetic-root-test-only', autoIndex: false, autoCreate: false });
});
after(async () => {
    await mongoose.disconnect();
    await readerClient?.close();
    await adminClient?.close();
    await mongo?.stop();
});
test('permission gate rejects absent, writer, broad or wrong-scope permissions', () => {
    assert.throws(() => assertReadOnlyPrivileges({}, database));
    assert.throws(() => assertReadOnlyPrivileges(permission(['find', 'insert']), database));
    const broad = permission(['find']); broad.authInfo.authenticatedUserPrivileges[0].resource = { anyResource: true };
    assert.throws(() => assertReadOnlyPrivileges(broad, database));
    assert.throws(() => assertReadOnlyPrivileges(permission(['find']), 'different_database'));
    const partial = permission(['find']); partial.authInfo.authenticatedUserPrivileges[0].resource.collection = 'transactions';
    assert.throws(() => assertReadOnlyPrivileges(partial, database));
    assert.doesNotThrow(() => assertReadOnlyPrivileges(permission(['find']), database));
});
test('CLI refuses missing authorized configuration without exposing app URI or raw driver errors', () => {
    const result = spawnSync(process.execPath, ['scripts/read-only-legacy-inventory.cjs'], {
        cwd: require('node:path').join(__dirname, '..'), encoding: 'utf8',
        env: { PATH: process.env.PATH, MONGO_URL: 'must-not-use-application-credentials' },
    });
    assert.equal(result.status, 1);
    assert.deepEqual(JSON.parse(result.stdout), { status: 'BLOCKED', code: 'AUTHORIZED_READ_ONLY_CONFIGURATION_REQUIRED' });
    assert.equal(result.stderr, '');
    assert.ok(!result.stdout.includes('must-not-use'));
});
test('inventory pipeline has no database-write stages or raw output projection', () => {
    const encoded = JSON.stringify(inventoryPipeline());
    assert.ok(!encoded.includes('"$out"'));
    assert.ok(!encoded.includes('"$merge"'));
    assert.deepEqual(inventoryPipeline().at(-1), { $project: { _id: 0 } });
});
test('actual scoped reader returns counts only and does not change synthetic documents', async () => {
    const owner = new ObjectId(), missingOwner = new ObjectId();
    await db.collection('users').insertOne({ _id: owner });
    const row = amount => ({ userId: owner, amount, type: 'expense', date: new Date('2026-10-01T00:00:00Z'), category: 'Synthetic' });
    await db.collection('transactions').insertMany([
        row(12.34), row(33.333), row('12.345'), row(null), row(-1),
        row(Infinity), { ...row(1), type: 'transfer' }, { ...row(1), date: 'bad-date' },
        { ...row(1), category: '' }, { ...row(2.345), userId: missingOwner },
        { ...row(1.234), userId: 'unsupported-owner' },
    ]);
    const before = await db.collection('transactions').find().sort({ _id: 1 }).toArray();
    const readonly = readerClient.db(database);
    assertReadOnlyPrivileges(await readonly.command({ connectionStatus: 1, showPrivileges: true }), database);
    await assert.rejects(readonly.collection('transactions').insertOne(row(1)), e => e.code === 13);
    const counts = await runInventory(readonly);
    assert.equal(counts.totalRecords, 11);
    assert.equal(counts.overPrecisionNumericRecords, 3);
    assert.equal(counts.nonNumericAmountRecords, 2);
    assert.equal(counts.nonFiniteOrUnconvertibleNumericRecords, 1);
    assert.equal(counts.invalidMonetaryRecords, 7);
    assert.equal(counts.recordsFailingReportValidation, 10);
    assert.equal(counts.affectedStoredObjectIdOwners, 2);
    assert.equal(counts.affectedExistingUsers, 1);
    assert.equal(counts.affectedMissingUserOwners, 1);
    assert.equal(counts.invalidOwnerRecords, 1);
    assert.ok(!JSON.stringify(counts).includes(owner.toString()));
    assert.ok(!JSON.stringify(counts).includes('Synthetic'));
    assert.deepEqual(await db.collection('transactions').find().sort({ _id: 1 }).toArray(), before);
    await db.collection('transactions').deleteMany({});
    assert.ok(Object.values(await runInventory(readonly)).every(n => n === 0));
});
test('inventory validation matches actual report service, including invalid data outside requested dates', async () => {
    const owner = new ObjectId();
    const patches = [
        { amount: 33.333 }, { amount: '12.34' }, { amount: null }, { amount: NaN },
        { amount: Infinity }, { amount: -Infinity }, { amount: -1 }, { amount: 0 },
        { amount: 1000000000.01 }, { amount: Decimal128.fromString('0.001') },
        { type: 'transfer' }, { date: 'bad' }, { category: '' }, { category: null },
        { amount: 12.34 }, { amount: 0.1 + 0.2 }, { amount: Decimal128.fromString('33.3300') }, { category: ' ' },
    ];
    for (const patch of patches) {
        await db.collection('transactions').deleteMany({});
        await db.collection('transactions').insertOne({ userId: owner, amount: 1, type: 'expense',
            date: new Date('2020-01-01T00:00:00Z'), category: 'Synthetic', ...patch });
        const counts = await runInventory(readerClient.db(database));
        const [atlasCounts] = await readerClient.db(database).collection('transactions').aggregate(
            JSON.parse(JSON.stringify(atlasInventoryPipeline())),
            { allowDiskUse: false, maxTimeMS: 30000 },
        ).toArray();
        assert.deepEqual(atlasCounts, counts, 'Atlas JSON and driver pipelines disagree');
        let rejected = false;
        try { await financeSummary(owner, { $gte: new Date('2026-01-01T00:00:00Z') }); }
        catch (error) { assert.equal(error.code, 'DATA_INTEGRITY_ERROR'); rejected = true; }
        assert.equal(Boolean(counts.recordsFailingReportValidation), rejected, 'audit/report predicate disagreement');
    }
});
