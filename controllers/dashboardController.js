const transactions = require("../models/transactionModel");
const Joi = require("joi");
const { financeSummary } = require("../services/financeSummary");
const { dateWindow } = require("../utils/finance");
const { fail, validate } = require("../utils/apiError");
const { reportQuery } = require("../utils/requestValidation");
const change = (current, previous) =>
    Number(
        (previous !== 0
            ? ((current - previous) / Math.abs(previous)) * 100
            : current > 0
              ? 100
              : 0
        ).toFixed(2),
    );
const getDashboardOverviewController = async (req, res) => {
    try {
        const now = new Date(),
            y = now.getUTCFullYear(),
            m = now.getUTCMonth();
        const [current, previous, all, recentTransactions] = await Promise.all([
            financeSummary(req.user.id, dateWindow({}, now)),
            financeSummary(req.user.id, {
                $gte: new Date(Date.UTC(y, m - 1, 1)),
                $lt: new Date(Date.UTC(y, m, 1)),
            }),
            financeSummary(req.user.id),
            transactions
                .find({ userId: req.user.id })
                .sort({ date: -1, createdAt: -1, _id: -1 })
                .limit(5)
                .lean(),
        ]);
        const c = current.overall,
            p = previous.overall,
            t = all.overall;
        return res.json({
            success: true,
            overview: {
                totals: {
                    totalIncome: t.totalIncome,
                    totalExpenses: t.totalExpenses,
                    transactionCount: t.transactionCount,
                },
                currentMonth: {
                    totalIncome: c.totalIncome,
                    totalExpenses: c.totalExpenses,
                    netBalance: c.netBalance,
                    transactionCount: c.transactionCount,
                },
                previousMonth: {
                    totalIncome: p.totalIncome,
                    totalExpenses: p.totalExpenses,
                    netBalance: p.netBalance,
                },
                trends: {
                    incomeChange: change(c.totalIncome, p.totalIncome),
                    expenseChange: change(c.totalExpenses, p.totalExpenses),
                    balanceChange: change(c.netBalance, p.netBalance),
                },
                recentTransactions,
            },
        });
    } catch (error) {
        return fail(res, error);
    }
};
const getMonthlySummaryController = async (req, res) => {
    try {
        const { year } = validate(
            Joi.object({
                year: Joi.number()
                    .integer()
                    .min(1970)
                    .max(9998)
                    .default(new Date().getUTCFullYear()),
            }),
            req.query,
        );
        const result = await financeSummary(req.user.id, {
            $gte: new Date(Date.UTC(year, 0, 1)),
            $lt: new Date(Date.UTC(year + 1, 0, 1)),
        });
        const monthlyData = result.monthly.map((row) => ({
            month: row._id.month,
            year: row._id.year,
            monthName: new Date(
                Date.UTC(year, row._id.month - 1, 1),
            ).toLocaleString("en-US", { month: "long", timeZone: "UTC" }),
            totalIncome: row.totalIncome,
            totalExpenses: row.totalExpenses,
            netBalance: row.netBalance,
            transactionCount: row.transactionCount,
        }));
        return res.json({ success: true, year, monthlyData });
    } catch (error) {
        return fail(res, error);
    }
};
const getCategoryReportController = async (req, res) => {
    try {
        const query = reportQuery(req.query),
            result = await financeSummary(
                req.user.id,
                dateWindow(query),
                query.type,
            );
        const totalAmount = result.totalAmount;
        return res.json({
            success: true,
            period: query.period || "month",
            type: query.type || "all",
            totalAmount,
            categories: result.categories.map((row) => ({
                ...row,
                percentage:
                    totalAmount > 0
                        ? Number(
                              ((row.totalAmount / totalAmount) * 100).toFixed(
                                  2,
                              ),
                          )
                        : 0,
            })),
        });
    } catch (error) {
        return fail(res, error);
    }
};
const getTopCategoriesController = async (req, res) => {
    try {
        const query = reportQuery(req.query),
            now = new Date();
        const window =
            query.startDate || query.endDate || query.period
                ? dateWindow(query, now)
                : { $gte: new Date(+now - 30 * 86400000), $lte: now };
        const result = await financeSummary(
            req.user.id,
            window,
            query.type || "expense",
        );
        return res.json({
            success: true,
            topCategories: result.categories.slice(0, query.limit || 5),
        });
    } catch (error) {
        return fail(res, error);
    }
};
module.exports = {
    getDashboardOverviewController,
    getMonthlySummaryController,
    getCategoryReportController,
    getTopCategoriesController,
};
