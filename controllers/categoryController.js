const { categoryModel } = require("../models/categoryModel");
const transactionModel = require("../models/transactionModel");
const Joi = require("joi");
const { ApiError, fail } = require("../utils/apiError");
const { visibility, escapeRegex } = require("../services/categoryAccess");
const { financeSummary } = require("../services/financeSummary");
const { dateWindow } = require("../utils/finance");
const { reportQuery, idParam } = require("../utils/requestValidation");

// Validation schemas
const categorySchema = Joi.object({
    name: Joi.string().min(1).max(50).required().trim(),
    type: Joi.string().valid("income", "expense").required(),
    icon: Joi.string().optional().allow("").trim(),
    color: Joi.string()
        .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
        .optional(),
});

const updateCategorySchema = Joi.object({
    name: Joi.string().min(1).max(50).optional().trim(),
    icon: Joi.string().optional().allow("").trim(),
    color: Joi.string()
        .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
        .optional(),
    isActive: Joi.boolean().optional(),
});

// Get all categories (system + user custom)
const getCategoriesController = async (req, res) => {
    try {
        const { type } = reportQuery(req.query);

        const filter = {
            ...visibility(req.user.id),
            isActive: true,
        };

        if (type) filter.type = type;

        const categories = await categoryModel.find(filter).sort({ isSystem: -1, name: 1 }).lean();

        res.status(200).json({
            success: true,
            categories,
        });
    } catch (error) {
        return fail(res, error);
    }
};

// Get system categories only
const getSystemCategoriesController = async (req, res) => {
    try {
        const { type } = reportQuery(req.query);

        const filter = { isSystem: true, userId: null, isActive: true };
        if (type) filter.type = type;

        const categories = await categoryModel.find(filter).sort({ name: 1 }).lean();

        res.status(200).json({
            success: true,
            categories,
        });
    } catch (error) {
        return fail(res, error);
    }
};

// Create custom category
const createCategoryController = async (req, res) => {
    try {
        // Validate request body
        const { error, value } = categorySchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const { name, type, icon, color } = value;

        // Check if category with same name already exists for this user
        const existingCategory = await categoryModel.findOne({
            name: { $regex: new RegExp(`^${escapeRegex(name.trim())}$`, "i") },
            userId: req.user.id,
            type,
        });

        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: "Category with this name already exists",
            });
        }

        // Check if it's a system category name
        const systemCategoryExists = await categoryModel.findOne({
            name: { $regex: new RegExp(`^${escapeRegex(name.trim())}$`, "i") },
            isSystem: true,
            userId: null,
            type,
        });

        if (systemCategoryExists) {
            return res.status(400).json({
                success: false,
                message: "Cannot create category with system category name",
            });
        }

        const category = new categoryModel({
            name,
            type,
            icon: icon || "",
            color: color || "#6B7280",
            userId: req.user.id,
            isSystem: false,
        });

        await category.save();

        res.status(201).json({
            success: true,
            message: "Category created successfully",
            category,
        });
    } catch (error) {
        return fail(res, error);
    }
};

// Update custom category
const updateCategoryController = async (req, res) => {
    try {
        const id = idParam(req.params.id);

        // Validate request body
        const { error, value } = updateCategorySchema.min(1).validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        // Check if category exists and belongs to user
        const category = await categoryModel.findOne({
            _id: id,
            userId: req.user.id,
            isSystem: false,
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found or you don't have permission to update it",
            });
        }

        // If updating name, check for duplicates
        if (req.body.name && req.body.name.toLowerCase() !== category.name.toLowerCase()) {
            const existingCategory = await categoryModel.findOne({
                name: { $regex: new RegExp(`^${escapeRegex(req.body.name.trim())}$`, "i") },
                userId: req.user.id,
                type: category.type,
                _id: { $ne: id },
            });

            if (existingCategory) {
                return res.status(400).json({
                    success: false,
                    message: "Category with this name already exists",
                });
            }

            // Check system category names
            const systemCategoryExists = await categoryModel.findOne({
                name: { $regex: new RegExp(`^${escapeRegex(req.body.name.trim())}$`, "i") },
                isSystem: true,
                userId: null,
                type: category.type,
            });

            if (systemCategoryExists) {
                return res.status(400).json({
                    success: false,
                    message: "Cannot use system category name",
                });
            }
        }

        if (
            req.body.name &&
            req.body.name.trim() !== category.name &&
            (await transactionModel.exists({ userId: req.user.id, category: category.name }))
        ) {
            throw new ApiError(409, "CATEGORY_IN_USE", "Archive a referenced category instead of renaming it.");
        }
        Object.assign(category, value);
        await category.save();

        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            category,
        });
    } catch (error) {
        return fail(res, error);
    }
};

// Delete custom category
const deleteCategoryController = async (req, res) => {
    try {
        const id = idParam(req.params.id);

        const category = await categoryModel.findOne({
            _id: id,
            userId: req.user.id,
            isSystem: false,
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found or you don't have permission to delete it",
            });
        }

        // Check if category is being used in transactions
        const transactionCount = await transactionModel.countDocuments({
            userId: req.user.id,
            category: category.name,
        });

        if (transactionCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete category. It is used in ${transactionCount} transaction(s).`,
            });
        }

        await categoryModel.deleteOne({ _id: id });

        res.status(200).json({
            success: true,
            message: "Category deleted successfully",
        });
    } catch (error) {
        return fail(res, error);
    }
};

// User-scoped metadata and exact calculations shared with all other reports.
const getCategoryStatsController = async (req, res) => {
    try {
        const query = reportQuery(req.query);
        const result = await financeSummary(req.user.id, dateWindow(query), query.type);
        return res.json({ success: true, stats: result.categories });
    } catch (error) {
        return fail(res, error);
    }
};

module.exports = {
    getCategoriesController,
    getSystemCategoriesController,
    createCategoryController,
    updateCategoryController,
    deleteCategoryController,
    getCategoryStatsController,
};
