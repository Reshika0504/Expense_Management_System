const mongoose = require("mongoose");
const transactions = require("../models/transactionModel");
const { metadataLookup } = require("./categoryAccess");
const { invalidData, minorToNumber, MAX_AMOUNT } = require("../utils/finance");
const fields = {
    totalIncome: {
        $sum: { $cond: [{ $eq: ["$type", "income"] }, "$_minor", 0] },
    },
    totalExpenses: {
        $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$_minor", 0] },
    },
    transactionCount: { $sum: 1 },
    sum: { $sum: "$_minor" },
};
const numericTypes = ["double", "int", "long", "decimal"];
// One authoritative calculation path for transaction, category and dashboard reports.
// Currency remains an API Number in major units; sums use Decimal128 minor units.
async function financeSummary(owner, date, type) {
    const userId = new mongoose.Types.ObjectId(owner);
    const filter = { userId };
    const scope = { ...(date ? { date } : {}), ...(type ? { type } : {}) };
    const [data] = await transactions.aggregate([
        { $match: filter },
        {
            $set: {
                _decimal: {
                    $convert: {
                        input: "$amount",
                        to: "decimal",
                        onError: null,
                        onNull: null,
                    },
                },
            },
        },
        { $set: { _minor: { $multiply: ["$_decimal", 100] } } },
        {
            $set: {
                _valid: {
                    $and: [
                        { $in: [{ $type: "$amount" }, numericTypes] },
                        { $gt: ["$_decimal", 0] },
                        { $lte: ["$_decimal", MAX_AMOUNT] },
                        { $eq: ["$_minor", { $trunc: "$_minor" }] },
                        { $eq: [{ $type: "$date" }, "date"] },
                        { $in: ["$type", ["income", "expense"]] },
                        { $eq: [{ $type: "$category" }, "string"] },
                        { $ne: ["$category", ""] },
                    ],
                },
            },
        },
        {
            $facet: {
                // Invalid owner records must not silently disappear from date filters.
                invalid: [
                    { $match: { _valid: false } },
                    { $limit: 1 },
                    { $project: { _id: 1 } },
                ],
                overall: [
                    { $match: { _valid: true, ...scope } },
                    { $group: { _id: null, ...fields } },
                ],
                categories: [
                    { $match: { _valid: true, ...scope } },
                    {
                        $group: {
                            _id: { category: "$category", type: "$type" },
                            totalAmount: { $sum: "$_minor" },
                            transactionCount: { $sum: 1 },
                        },
                    },
                    ...metadataLookup(userId),
                    {
                        $sort: {
                            totalAmount: -1,
                            "_id.category": 1,
                            "_id.type": 1,
                        },
                    },
                ],
                daily: [
                    { $match: { _valid: true, ...scope } },
                    {
                        $group: {
                            _id: {
                                year: { $year: "$date" },
                                month: { $month: "$date" },
                                day: { $dayOfMonth: "$date" },
                            },
                            ...fields,
                        },
                    },
                    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
                ],
                monthly: [
                    { $match: { _valid: true, ...scope } },
                    {
                        $group: {
                            _id: {
                                year: { $year: "$date" },
                                month: { $month: "$date" },
                            },
                            ...fields,
                        },
                    },
                    { $sort: { "_id.year": 1, "_id.month": 1 } },
                ],
            },
        },
    ]);
    if (data.invalid.length) throw invalidData();
    const convert = (row) => {
        if (!row)
            return {
                totalIncome: 0,
                totalExpenses: 0,
                transactionCount: 0,
                avgTransactionAmount: 0,
                netBalance: 0,
            };
        const income = minorToNumber(row.totalIncome),
            expenses = minorToNumber(row.totalExpenses);
        const count = row.transactionCount;
        minorToNumber(row.sum);
        return {
            _id: row._id,
            totalIncome: income,
            totalExpenses: expenses,
            transactionCount: count,
            avgTransactionAmount: minorToNumber(
                Math.round(Number(row.sum.toString()) / count),
            ),
            netBalance: minorToNumber(
                Number(row.totalIncome.toString()) -
                    Number(row.totalExpenses.toString()),
            ),
        };
    };
    return {
        overall: convert(data.overall[0]),
        totalAmount: minorToNumber(data.overall[0]?.sum),
        categories: data.categories.map((row) => ({
            _id: row._id.category,
            categoryName: row._id.category,
            type: row._id.type,
            totalAmount: minorToNumber(row.totalAmount),
            transactionCount: row.transactionCount,
            avgAmount: minorToNumber(
                Math.round(
                    Number(row.totalAmount.toString()) / row.transactionCount,
                ),
            ),
            icon: row.categoryInfo?.icon || "",
            color: row.categoryInfo?.color || "#6B7280",
            isSystem: row.categoryInfo?.isSystem || false,
        })),
        daily: data.daily.map((row) => ({
            _id: row._id,
            income: minorToNumber(row.totalIncome),
            expenses: minorToNumber(row.totalExpenses),
        })),
        monthly: data.monthly.map(convert),
    };
}
module.exports = { financeSummary };
