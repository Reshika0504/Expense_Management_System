// Operator-only inventory. No dotenv, application bootstrap, model imports or writes.
const { MongoClient, Decimal128 } = require('mongoose').mongo;
const { createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');
const REVIEWED_SOURCE = 'feb94f70efa58eaccdb91dea61a0e8c2d346b08d';
const MAX_AMOUNT = 1000000000;
const numericTypes = ['double', 'int', 'long', 'decimal'];
const counterNames = [
    'totalRecords', 'overPrecisionNumericRecords', 'nonNumericAmountRecords',
    'nonFiniteOrUnconvertibleNumericRecords', 'nonPositiveAmountRecords',
    'aboveMaximumAmountRecords', 'invalidMonetaryRecords', 'invalidTypeRecords',
    'invalidDateRecords', 'invalidCategoryRecords', 'recordsFailingReportValidation',
    'invalidOwnerRecords', 'affectedStoredObjectIdOwners', 'affectedExistingUsers',
    'affectedMissingUserOwners', 'precisionAffectedExistingUsers',
    'monetaryAffectedExistingUsers', 'existingUsersAtFullHistoryOverflowRisk',
];
class AuditBlocked extends Error {
    constructor(code) { super(code); this.code = code; }
}
function assertReadOnlyPrivileges(status, database) {
    const info = status?.authInfo;
    const privileges = info?.authenticatedUserPrivileges;
    const allowed = new Set(['find', 'listCollections', 'listIndexes', 'collStats',
        'dbStats', 'killCursors', 'planCacheRead', 'changeStream']);
    if (!info?.authenticatedUsers?.length || !Array.isArray(privileges) || !privileges.length)
        throw new AuditBlocked('READ_ONLY_PERMISSION_UNVERIFIED');
    for (const p of privileges) {
        if (p.resource?.db !== database || p.resource?.anyResource || p.resource?.cluster ||
            !Array.isArray(p.actions) || !p.actions.length || p.actions.some(a => !allowed.has(a)))
            throw new AuditBlocked('CREDENTIAL_NOT_SCOPED_READ_ONLY');
    }
    for (const collection of ['transactions', 'users']) {
        if (!privileges.some(p => ['', collection].includes(p.resource.collection) && p.actions.includes('find')))
            throw new AuditBlocked('REQUIRED_READ_PERMISSION_MISSING');
    }
}
function inventoryPipeline() {
    const sumFlag = field => ({ $sum: { $cond: [field, 1, 0] } });
    const finite = { $and: [
        { $in: [{ $type: '$amount' }, numericTypes] },
        { $ne: ['$_decimal', null] },
        { $not: [{ $in: ['$_decimal', ['NaN', 'Infinity', '-Infinity'].map(v => Decimal128.fromString(v))] }] },
    ] };
    // The _valid expression intentionally mirrors financeSummary at REVIEWED_SOURCE.
    // Tests compare this predicate with the real service; do not import runtime models here.
    return [
        { $set: { _decimal: { $convert: { input: '$amount', to: 'decimal', onError: null, onNull: null } } } },
        { $set: { _minor: { $multiply: ['$_decimal', 100] }, _finite: finite } },
        { $set: {
            _valid: { $and: [
                { $in: [{ $type: '$amount' }, numericTypes] },
                { $gt: ['$_decimal', 0] }, { $lte: ['$_decimal', MAX_AMOUNT] },
                { $eq: ['$_minor', { $trunc: '$_minor' }] },
                { $eq: [{ $type: '$date' }, 'date'] },
                { $in: ['$type', ['income', 'expense']] },
                { $eq: [{ $type: '$category' }, 'string'] }, { $ne: ['$category', ''] },
            ] },
            _overPrecision: { $and: ['$_finite', { $ne: ['$_minor', { $trunc: '$_minor' }] }] },
            _nonNumeric: { $not: [{ $in: [{ $type: '$amount' }, numericTypes] }] },
            _nonFinite: { $and: [{ $in: [{ $type: '$amount' }, numericTypes] }, { $not: ['$_finite'] }] },
            _nonPositive: { $and: ['$_finite', { $lte: ['$_decimal', 0] }] },
            _aboveMax: { $and: ['$_finite', { $gt: ['$_decimal', MAX_AMOUNT] }] },
            _badType: { $not: [{ $in: ['$type', ['income', 'expense']] }] },
            _badDate: { $ne: [{ $type: '$date' }, 'date'] },
            _badCategory: { $or: [{ $ne: [{ $type: '$category' }, 'string'] }, { $eq: ['$category', ''] }] },
            _badOwner: { $ne: [{ $type: '$userId' }, 'objectId'] },
        } },
        { $set: { _badMoney: { $or: ['$_nonNumeric', '$_nonFinite', '$_nonPositive', '$_aboveMax', '$_overPrecision'] } } },
        { $group: {
            _id: { $cond: ['$_badOwner', null, '$userId'] },
            totalRecords: { $sum: 1 },
            overPrecisionNumericRecords: sumFlag('$_overPrecision'),
            nonNumericAmountRecords: sumFlag('$_nonNumeric'),
            nonFiniteOrUnconvertibleNumericRecords: sumFlag('$_nonFinite'),
            nonPositiveAmountRecords: sumFlag('$_nonPositive'),
            aboveMaximumAmountRecords: sumFlag('$_aboveMax'),
            invalidMonetaryRecords: sumFlag('$_badMoney'),
            invalidTypeRecords: sumFlag('$_badType'),
            invalidDateRecords: sumFlag('$_badDate'),
            invalidCategoryRecords: sumFlag('$_badCategory'),
            recordsFailingReportValidation: sumFlag({ $not: ['$_valid'] }),
            invalidOwnerRecords: sumFlag('$_badOwner'),
            _sumMinor: { $sum: { $cond: ['$_valid', '$_minor', 0] } },
        } },
        { $lookup: { from: 'users', let: { owner: '$_id' }, pipeline: [
            { $match: { $expr: { $and: [{ $ne: ['$$owner', null] }, { $eq: ['$_id', '$$owner'] }] } } },
            { $limit: 1 }, { $project: { _id: 1 } },
        ], as: '_existing' } },
        { $set: { _exists: { $gt: [{ $size: '$_existing' }, 0] },
            _affected: { $gt: ['$recordsFailingReportValidation', 0] } } },
        { $group: {
            _id: null,
            ...Object.fromEntries(counterNames.slice(0, 12).map(name => [name, { $sum: '$' + name }])),
            affectedStoredObjectIdOwners: sumFlag({ $and: ['$_affected', { $ne: ['$_id', null] }] }),
            affectedExistingUsers: sumFlag({ $and: ['$_affected', '$_exists'] }),
            affectedMissingUserOwners: sumFlag({ $and: ['$_affected', { $ne: ['$_id', null] }, { $not: ['$_exists'] }] }),
            precisionAffectedExistingUsers: sumFlag({ $and: ['$_exists', { $gt: ['$overPrecisionNumericRecords', 0] }] }),
            monetaryAffectedExistingUsers: sumFlag({ $and: ['$_exists', { $gt: ['$invalidMonetaryRecords', 0] }] }),
            existingUsersAtFullHistoryOverflowRisk: sumFlag({ $and: ['$_exists',
                { $gt: ['$_sumMinor', Decimal128.fromString(String(Number.MAX_SAFE_INTEGER))] }] }),
        } },
        { $project: { _id: 0 } },
    ];
}
async function runInventory(db, maxTimeMS = 30000) {
    const rows = await db.collection('transactions').aggregate(inventoryPipeline(), {
        allowDiskUse: false, maxTimeMS, batchSize: 1, readConcern: { level: 'majority' },
    }).toArray();
    const counts = { ...Object.fromEntries(counterNames.map(name => [name, 0])), ...rows[0] };
    if (Object.keys(counts).some(k => !counterNames.includes(k)) ||
        Object.values(counts).some(v => !Number.isSafeInteger(v) || v < 0))
        throw new AuditBlocked('UNSAFE_COUNT_OUTPUT');
    return counts;
}
// Atlas text mode accepts JSON expressions, not driver-specific BSON instances.
// Keep this representation derived from the same predicate and test it against MongoDB.
function atlasInventoryPipeline() {
    const jsonExpression = value => {
        if (value?._bsontype === 'Decimal128')
            return { $convert: { input: value.toString(), to: 'decimal', onError: null, onNull: null } };
        if (Array.isArray(value)) return value.map(jsonExpression);
        if (value && typeof value === 'object')
            return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, jsonExpression(item)]));
        return value;
    };
    return jsonExpression(inventoryPipeline());
}
async function main() {
    const uri = process.env.SPENDWISE_AUDIT_URI;
    const database = process.env.SPENDWISE_AUDIT_DATABASE;
    if (!uri || !database || process.env.SPENDWISE_AUDIT_APPROVED !== 'yes')
        throw new AuditBlocked('AUTHORIZED_READ_ONLY_CONFIGURATION_REQUIRED');
    if (!/^[A-Za-z0-9_-]{1,63}$/.test(database)) throw new AuditBlocked('DATABASE_NAME_REQUIRES_OPERATOR_REVIEW');
    const maxTimeMS = Number(process.env.SPENDWISE_AUDIT_MAX_TIME_MS || 30000);
    if (!Number.isInteger(maxTimeMS) || maxTimeMS < 1000 || maxTimeMS > 120000)
        throw new AuditBlocked('INVALID_TIME_BOUND');
    const client = new MongoClient(uri, { maxPoolSize: 1, serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: maxTimeMS + 5000, retryReads: false, tls: true,
        tlsAllowInvalidCertificates: false, tlsAllowInvalidHostnames: false });
    const startedAt = new Date().toISOString();
    try {
        await client.connect();
        const db = client.db(database);
        assertReadOnlyPrivileges(await db.command({ connectionStatus: 1, showPrivileges: true }), database);
        const counts = await runInventory(db, maxTimeMS);
        console.log(JSON.stringify({ status: 'EXECUTED_READ_ONLY', reviewedApplicationCommit: REVIEWED_SOURCE,
            auditScriptSha256: createHash('sha256').update(readFileSync(__filename)).digest('hex'),
            startedAt, completedAt: new Date().toISOString(), permissionCheck: 'SCOPED_READ_ONLY_VERIFIED',
            consistentSnapshot: false, counts }, null, 2));
    } finally { await client.close(); }
}
if (require.main === module) main().catch(error => {
    // Never log a driver exception: it can contain a URI, identity or server data.
    console.log(JSON.stringify({ status: 'BLOCKED', code: error instanceof AuditBlocked ? error.code : 'AUDIT_FAILED_DETAILS_SUPPRESSED' }));
    process.exitCode = 1;
});
module.exports = { inventoryPipeline, atlasInventoryPipeline, runInventory, assertReadOnlyPrivileges, counterNames };
