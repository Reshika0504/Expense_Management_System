const transactionModel = require("../models/transactionModel");
const Joi = require("joi");
const moment = require("moment");

// Validation schemas
const transactionSchema = Joi.object({
    amount: Joi.number().positive().required(),
    type: Joi.string().valid("income", "expense").required(),
    category: Joi.string().required().trim(),
    date: Joi.date().iso().required(),
    description: Joi.string().max(500).optional().allow("").trim(),
    paymentMethod: Joi.string()
    .valid("cash", "credit_card", "debit_card", "bank_transfer", "digital_wallet", "other")
    .optional(),
    tags: Joi.array().items(Joi.string().trim()).optional(),
    isRecurring: Joi.boolean().optional(),
    recurrencePattern: Joi.string().valid("daily", "weekly", "monthly", "yearly").optional(),
    notes: Joi.string().max(1000).optional().allow("").trim(),
});

const updateTransactionSchema = Joi.object({
    amount: Joi.number().positive().optional(),
    type: Joi.string().valid("income", "expense").optional(),
    category: Joi.string().optional().trim(),
    date: Joi.date().iso().optional(),
    description: Joi.string().max(500).optional().allow("").trim(),
    paymentMethod: Joi.string()
    .valid("cash", "credit_card", "debit_card", "bank_transfer", "digital_wallet", "other")
    .optional(),
    tags: Joi.array().items(Joi.string().trim()).optional(),
    isRecurring: Joi.boolean().optional(),
    recurrencePattern: Joi.string().valid("daily", "weekly", "monthly", "yearly").optional(),
    notes: Joi.string().max(1000).optional().allow("").trim(),
});

// Create transaction
const createTransactionController = async (req, res) => {
    try {
        // Validate request body
        const {error} = transactionSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const transactionData = {
            ...req.body,
            userId: req.user.id,
        };

        const transaction = new transactionModel(transactionData);
        await transaction.save();

        res.status(201).json({
            success: true,
            message: "Transaction created successfully",
            transaction,
        });
    } catch (error) {
        console.error("Create Transaction Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create transaction",
            error: error.message,
        });
    }
};

// Get all transactions for user with filtering
const getTransactionsController = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            type,
            category,
            startDate,
            endDate,
            search,
            sortBy = "date",
            sortOrder = "desc",
        } = req.query;

        // Build filter object
        const filter = {userId: req.user.id};

        if (type) filter.type = type;
        if (category) filter.category = {$regex: category, $options: "i"};
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }
        if (search) {
            filter.$or = [
                {description: {$regex: search, $options: "i"}},
                {notes: {$regex: search, $options: "i"}},
                {category: {$regex: search, $options: "i"}},
            ];
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === "asc" ? 1 : -1;

        const skip = (page - 1) * limit;

        const transactions = await transactionModel.find(filter).sort(sort).skip(skip).limit(parseInt(limit)).lean();

        const total = await transactionModel.countDocuments(filter);

        res.status(200).json({
            success: true,
            transactions,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1,
            },
        });
    } catch (error) {
        console.error("Get Transactions Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch transactions",
            error: error.message,
        });
    }
};

// Get single transaction
const getTransactionController = async (req, res) => {
    try {
        const {id} = req.params;

        const transaction = await transactionModel.findOne({
            _id: id,
            userId: req.user.id,
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found",
            });
        }

        res.status(200).json({
            success: true,
            transaction,
        });
    } catch (error) {
        console.error("Get Transaction Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch transaction",
            error: error.message,
        });
    }
};

// Update transaction
const updateTransactionController = async (req, res) => {
    try {
        const {id} = req.params;

        // Validate request body
        const {error} = updateTransactionSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const transaction = await transactionModel.findOneAndUpdate({_id: id, userId: req.user.id}, req.body, {
            new: true,
            runValidators: true,
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Transaction updated successfully",
            transaction,
        });
    } catch (error) {
        console.error("Update Transaction Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update transaction",
            error: error.message,
        });
    }
};

// Delete transaction
const deleteTransactionController = async (req, res) => {
    try {
        const {id} = req.params;

        const transaction = await transactionModel.findOneAndDelete({
            _id: id,
            userId: req.user.id,
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Transaction deleted successfully",
        });
    } catch (error) {
        console.error("Delete Transaction Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete transaction",
            error: error.message,
        });
    }
};

// Get transaction statistics
const getTransactionStatsController = async (req, res) => {
    try {
        const {period = "month", startDate, endDate} = req.query;

        let dateFilter = {};
        const now = new Date();

        // Set date range based on period
        if (startDate && endDate) {
            dateFilter = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        } else {
            switch (period) {
                case "week":
                    dateFilter = {
                        $gte: moment().subtract(7, "days").toDate(),
                        $lte: now,
                    };
                    break;
                case "month":
                    dateFilter = {
                        $gte: moment().subtract(1, "months").toDate(),
                        $lte: now,
                    };
                    break;
                case "year":
                    dateFilter = {
                        $gte: moment().subtract(1, "years").toDate(),
                        $lte: now,
                    };
                    break;
                default:
                    dateFilter = {
                        $gte: moment().subtract(1, "months").toDate(),
                        $lte: now,
                    };
            }
        }

        const matchStage = {
            userId: req.user.id,
            date: dateFilter,
        };

        // Overall stats
        const overallStats = await transactionModel.aggregate([
            {$match: matchStage},
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
                    avgTransactionAmount: {$avg: "$amount"},
                },
            },
        ]);

        // Category-wise breakdown
        const categoryStats = await transactionModel.aggregate([
            {$match: matchStage},
            {
                $group: {
                    _id: "$category",
                    totalAmount: {$sum: "$amount"},
                    count: {$sum: 1},
                    type: {$first: "$type"},
                },
            },
            {$sort: {totalAmount: -1}},
        ]);

        // Daily trend
        const dailyStats = await transactionModel.aggregate([
            {$match: matchStage},
            {
                $group: {
                    _id: {
                        year: {$year: "$date"},
                        month: {$month: "$date"},
                        day: {$dayOfMonth: "$date"},
                    },
                    income: {
                        $sum: {$cond: [{$eq: ["$type", "income"]}, "$amount", 0]},
                    },
                    expenses: {
                        $sum: {$cond: [{$eq: ["$type", "expense"]}, "$amount", 0]},
                    },
                },
            },
            {$sort: {"_id.year": 1, "_id.month": 1, "_id.day": 1}},
        ]);

        res.status(200).json({
            success: true,
            stats: {
                overall: overallStats[0] || {
                    totalIncome: 0,
                    totalExpenses: 0,
                    transactionCount: 0,
                    avgTransactionAmount: 0,
                    netBalance: 0,
                },
                categories: categoryStats,
                dailyTrend: dailyStats,
                netBalance: (overallStats[0]?.totalIncome || 0) - (overallStats[0]?.totalExpenses || 0),
            },
        });
    } catch (error) {
        console.error("Get Transaction Stats Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch transaction statistics",
            error: error.message,
        });
    }
};

module.exports = {
    createTransactionController,
    getTransactionsController,
    getTransactionController,
    updateTransactionController,
    deleteTransactionController,
    getTransactionStatsController,
};
