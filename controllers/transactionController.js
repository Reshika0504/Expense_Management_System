const transactionModel = require("../models/transactionModel");
const Joi = require("joi");
const { ApiError, fail, validate } = require("../utils/apiError");
const { validAmount, dateWindow, parseDate } = require("../utils/finance");
const { permittedCategory, escapeRegex } = require("../services/categoryAccess");
const { financeSummary } = require("../services/financeSummary");
const { listQuery, reportQuery, idParam } = require("../utils/requestValidation");
const amountRule = Joi.number()
    .strict()
    .custom((value, helpers) => (validAmount(value) ? value : helpers.error("any.invalid")));

// Validation schemas
const transactionSchema = Joi.object({
    amount: amountRule.required(),
    type: Joi.string().valid("income", "expense").required(),
    category: Joi.string().max(50).required().trim(),
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
    amount: amountRule.optional(),
    type: Joi.string().valid("income", "expense").optional(),
    category: Joi.string().max(50).optional().trim(),
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
        const value = validate(transactionSchema, req.body);
        value.date = parseDate(req.body.date);
        await permittedCategory(req.user.id, value.category, value.type);
        const transactionData = { ...value, userId: req.user.id };

        const transaction = new transactionModel(transactionData);
        await transaction.save();

        res.status(201).json({
            success: true,
            message: "Transaction created successfully",
            transaction,
        });
    } catch (error) {
        return fail(res, error);
    }
};

// Get all transactions for user with filtering
const getTransactionsController = async (req, res) => {
    try {
        const { page, limit, type, category, startDate, endDate, search, sortBy, sortOrder } = listQuery(req.query);
        const filter = { userId: req.user.id };
        if (type) filter.type = type;
        if (category) filter.category = { $regex: escapeRegex(category), $options: "i" };
        if (startDate || endDate) filter.date = dateWindow({ startDate, endDate });
        if (search)
            filter.$or = ["description", "notes", "category"].map((key) => ({
                [key]: { $regex: escapeRegex(search), $options: "i" },
            }));
        const direction = sortOrder === "asc" ? 1 : -1;
        const transactions = await transactionModel
            .find(filter)
            .sort({ [sortBy]: direction, _id: direction })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

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
        return fail(res, error);
    }
};

// Get single transaction
const getTransactionController = async (req, res) => {
    try {
        const id = idParam(req.params.id);

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
        return fail(res, error);
    }
};

// Update transaction
const updateTransactionController = async (req, res) => {
    try {
        const id = idParam(req.params.id);

        const value = validate(updateTransactionSchema.min(1), req.body);
        const existing = await transactionModel.findOne({ _id: id, userId: req.user.id });
        if (!existing) throw new ApiError(404, "NOT_FOUND", "Transaction not found");
        if (value.date) value.date = parseDate(req.body.date);
        if (value.category !== undefined || value.type !== undefined) {
            await permittedCategory(req.user.id, value.category ?? existing.category, value.type ?? existing.type);
        }
        const transaction = await transactionModel.findOneAndUpdate(
            { _id: id, userId: req.user.id },
            { $set: value },
            { new: true, runValidators: true },
        );

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
        return fail(res, error);
    }
};

// Delete transaction
const deleteTransactionController = async (req, res) => {
    try {
        const id = idParam(req.params.id);

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
        return fail(res, error);
    }
};

// The shared finance service is also used by dashboard and category reports.
const getTransactionStatsController = async (req, res) => {
    try {
        const query = reportQuery(req.query);
        const result = await financeSummary(req.user.id, dateWindow(query), query.type);
        return res.json({
            success: true,
            stats: {
                overall: result.overall,
                categories: result.categories.map((row) => ({
                    _id: row.categoryName,
                    type: row.type,
                    totalAmount: row.totalAmount,
                    count: row.transactionCount,
                })),
                dailyTrend: result.daily,
                netBalance: result.overall.netBalance,
            },
        });
    } catch (error) {
        return fail(res, error);
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
