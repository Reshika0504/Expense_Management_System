const transactionModel = require("../models/transactionModel");
const {categoryModel} = require("../models/categoryModel");
const moment = require("moment");

// Get dashboard overview data
const getDashboardOverviewController = async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();

        // Current month range
        const currentMonthStart = moment().startOf("month").toDate();
        const currentMonthEnd = moment().endOf("month").toDate();

        // Previous month range
        const previousMonthStart = moment().subtract(1, "months").startOf("month").toDate();
        const previousMonthEnd = moment().subtract(1, "months").endOf("month").toDate();

        // Current month statistics
        const currentMonthStats = await transactionModel.aggregate([
            {
                $match: {
                    userId: userId,
                    date: {$gte: currentMonthStart, $lte: currentMonthEnd},
                },
            },
            {
                $group: {
                    _id: null,
                    totalIncome: {
                        $sum: {$cond: [{$eq: ["$type", "income"]}, "$amount", 0]},
                    },
                    totalExpenses: {
                        $sum: {$cond: [{$eq: ["$type", "expense"]}, "$amount", 0]},
                    },
                    transactionCount: {$sum: 1},
                },
            },
        ]);

        // Previous month statistics
        const previousMonthStats = await transactionModel.aggregate([
            {
                $match: {
                    userId: userId,
                    date: {$gte: previousMonthStart, $lte: previousMonthEnd},
                },
            },
            {
                $group: {
                    _id: null,
                    totalIncome: {
                        $sum: {$cond: [{$eq: ["$type", "income"]}, "$amount", 0]},
                    },
                    totalExpenses: {
                        $sum: {$cond: [{$eq: ["$type", "expense"]}, "$amount", 0]},
                    },
                },
            },
        ]);

        const currentStats = currentMonthStats[0] || {totalIncome: 0, totalExpenses: 0, transactionCount: 0};
        const previousStats = previousMonthStats[0] || {totalIncome: 0, totalExpenses: 0};

        // Calculate percentages
        const incomeChange =
            previousStats.totalIncome > 0
                ? ((currentStats.totalIncome - previousStats.totalIncome) / previousStats.totalIncome) * 100
                : currentStats.totalIncome > 0
                ? 100
                : 0;

        const expenseChange =
            previousStats.totalExpenses > 0
                ? ((currentStats.totalExpenses - previousStats.totalExpenses) / previousStats.totalExpenses) * 100
                : currentStats.totalExpenses > 0
                ? 100
                : 0;

        // Net balance
        const currentNetBalance = currentStats.totalIncome - currentStats.totalExpenses;
        const previousNetBalance = previousStats.totalIncome - previousStats.totalExpenses;
        const balanceChange =
            previousNetBalance !== 0
                ? ((currentNetBalance - previousNetBalance) / Math.abs(previousNetBalance)) * 100
                : currentNetBalance > 0
                ? 100
                : 0;

        // Recent transactions (last 5)
        const recentTransactions = await transactionModel
        .find({userId: userId})
        .sort({date: -1, createdAt: -1})
        .limit(5)
        .lean();

        res.status(200).json({
            success: true,
            overview: {
                currentMonth: {
                    totalIncome: currentStats.totalIncome,
                    totalExpenses: currentStats.totalExpenses,
                    netBalance: currentNetBalance,
                    transactionCount: currentStats.transactionCount,
                },
                previousMonth: {
                    totalIncome: previousStats.totalIncome,
                    totalExpenses: previousStats.totalExpenses,
                    netBalance: previousNetBalance,
                },
                trends: {
                    incomeChange: parseFloat(incomeChange.toFixed(2)),
                    expenseChange: parseFloat(expenseChange.toFixed(2)),
                    balanceChange: parseFloat(balanceChange.toFixed(2)),
                },
                recentTransactions,
            },
        });
    } catch (error) {
        console.error("Dashboard Overview Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard overview",
            error: error.message,
        });
    }
};

// Get monthly summary report
const getMonthlySummaryController = async (req, res) => {
    try {
        const {year = new Date().getFullYear()} = req.query;
        const userId = req.user.id;

        const monthlyData = await transactionModel.aggregate([
            {
                $match: {
                    userId: userId,
                    date: {
                        $gte: new Date(year, 0, 1),
                        $lte: new Date(year, 11, 31, 23, 59, 59),
                    },
                },
            },
            {
                $group: {
                    _id: {
                        year: {$year: "$date"},
                        month: {$month: "$date"},
                    },
                    totalIncome: {
                        $sum: {$cond: [{$eq: ["$type", "income"]}, "$amount", 0]},
                    },
                    totalExpenses: {
                        $sum: {$cond: [{$eq: ["$type", "expense"]}, "$amount", 0]},
                    },
                    transactionCount: {$sum: 1},
                },
            },
            {
                $sort: {"_id.year": 1, "_id.month": 1},
            },
        ]);

        // Format the data for easier consumption
        const formattedData = monthlyData.map((item) => ({
            month: item._id.month,
            year: item._id.year,
            monthName: moment()
            .month(item._id.month - 1)
            .format("MMMM"),
            totalIncome: item.totalIncome,
            totalExpenses: item.totalExpenses,
            netBalance: item.totalIncome - item.totalExpenses,
            transactionCount: item.transactionCount,
        }));

        res.status(200).json({
            success: true,
            year: parseInt(year),
            monthlyData: formattedData,
        });
    } catch (error) {
        console.error("Monthly Summary Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch monthly summary",
            error: error.message,
        });
    }
};

// Get category-wise spending report
const getCategoryReportController = async (req, res) => {
    try {
        const {type, period = "month"} = req.query;
        const userId = req.user.id;

        let dateFilter = {};
        const now = new Date();

        // Set date range based on period
        switch (period) {
            case "week":
                dateFilter = {
                    $gte: moment().subtract(7, "days").toDate(),
                };
                break;
            case "month":
                dateFilter = {
                    $gte: moment().startOf("month").toDate(),
                };
                break;
            case "year":
                dateFilter = {
                    $gte: moment().startOf("year").toDate(),
                };
                break;
            default:
                dateFilter = {
                    $gte: moment().startOf("month").toDate(),
                };
        }

        const matchConditions = {
            userId: userId,
            date: dateFilter,
        };

        if (type) matchConditions.type = type;

        const categoryReport = await transactionModel.aggregate([
            {
                $match: matchConditions,
            },
            {
                $group: {
                    _id: "$category",
                    totalAmount: {$sum: "$amount"},
                    transactionCount: {$sum: 1},
                    avgAmount: {$avg: "$amount"},
                    type: {$first: "$type"},
                },
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "_id",
                    foreignField: "name",
                    as: "categoryInfo",
                },
            },
            {
                $unwind: {
                    path: "$categoryInfo",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    categoryName: "$_id",
                    totalAmount: 1,
                    transactionCount: 1,
                    avgAmount: 1,
                    type: 1,
                    icon: {$ifNull: ["$categoryInfo.icon", ""]},
                    color: {$ifNull: ["$categoryInfo.color", "#6B7280"]},
                },
            },
            {$sort: {totalAmount: -1}},
        ]);

        // Calculate total for percentage calculation
        const totalAmount = categoryReport.reduce((sum, item) => sum + item.totalAmount, 0);

        const enrichedReport = categoryReport.map((item) => ({
            ...item,
            percentage: totalAmount > 0 ? parseFloat(((item.totalAmount / totalAmount) * 100).toFixed(2)) : 0,
        }));

        res.status(200).json({
            success: true,
            period,
            type: type || "all",
            totalAmount,
            categories: enrichedReport,
        });
    } catch (error) {
        console.error("Category Report Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch category report",
            error: error.message,
        });
    }
};

// Get top spending categories
const getTopCategoriesController = async (req, res) => {
    try {
        const {limit = 5, type = "expense"} = req.query;
        const userId = req.user.id;

        const thirtyDaysAgo = moment().subtract(30, "days").toDate();

        const topCategories = await transactionModel.aggregate([
            {
                $match: {
                    userId: userId,
                    type: type,
                    date: {$gte: thirtyDaysAgo},
                },
            },
            {
                $group: {
                    _id: "$category",
                    totalAmount: {$sum: "$amount"},
                    transactionCount: {$sum: 1},
                },
            },
            {
                $sort: {totalAmount: -1},
            },
            {
                $limit: parseInt(limit),
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "_id",
                    foreignField: "name",
                    as: "categoryInfo",
                },
            },
            {
                $unwind: {
                    path: "$categoryInfo",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    categoryName: "$_id",
                    totalAmount: 1,
                    transactionCount: 1,
                    icon: {$ifNull: ["$categoryInfo.icon", ""]},
                    color: {$ifNull: ["$categoryInfo.color", "#6B7280"]},
                },
            },
        ]);

        res.status(200).json({
            success: true,
            topCategories,
        });
    } catch (error) {
        console.error("Top Categories Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch top categories",
            error: error.message,
        });
    }
};

module.exports = {
    getDashboardOverviewController,
    getMonthlySummaryController,
    getCategoryReportController,
    getTopCategoriesController,
};
