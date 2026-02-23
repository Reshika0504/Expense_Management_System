const {categoryModel} = require("../models/categoryModel");
const transactionModel = require("../models/transactionModel");
const Joi = require("joi");

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
        const {type} = req.query;

        const filter = {
            $or: [{userId: req.user.id}, {isSystem: true}],
            isActive: true,
        };

        if (type) filter.type = type;

        const categories = await categoryModel.find(filter).sort({isSystem: -1, name: 1}).lean();

        res.status(200).json({
            success: true,
            categories,
        });
    } catch (error) {
        console.error("Get Categories Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch categories",
            error: error.message,
        });
    }
};

// Get system categories only
const getSystemCategoriesController = async (req, res) => {
    try {
        const {type} = req.query;

        const filter = {isSystem: true, isActive: true};
        if (type) filter.type = type;

        const categories = await categoryModel.find(filter).sort({name: 1}).lean();

        res.status(200).json({
            success: true,
            categories,
        });
    } catch (error) {
        console.error("Get System Categories Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch system categories",
            error: error.message,
        });
    }
};

// Create custom category
const createCategoryController = async (req, res) => {
    try {
        // Validate request body
        const {error} = categorySchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const {name, type, icon, color} = req.body;

        // Check if category with same name already exists for this user
        const existingCategory = await categoryModel.findOne({
            name: {$regex: new RegExp(`^${name}$`, "i")},
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
            name: {$regex: new RegExp(`^${name}$`, "i")},
            isSystem: true,
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
        console.error("Create Category Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create category",
            error: error.message,
        });
    }
};

// Update custom category
const updateCategoryController = async (req, res) => {
    try {
        const {id} = req.params;

        // Validate request body
        const {error} = updateCategorySchema.validate(req.body);
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
                name: {$regex: new RegExp(`^${req.body.name}$`, "i")},
                userId: req.user.id,
                type: category.type,
                _id: {$ne: id},
            });

            if (existingCategory) {
                return res.status(400).json({
                    success: false,
                    message: "Category with this name already exists",
                });
            }

            // Check system category names
            const systemCategoryExists = await categoryModel.findOne({
                name: {$regex: new RegExp(`^${req.body.name}$`, "i")},
                isSystem: true,
                type: category.type,
            });

            if (systemCategoryExists) {
                return res.status(400).json({
                    success: false,
                    message: "Cannot use system category name",
                });
            }
        }

        Object.assign(category, req.body);
        await category.save();

        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            category,
        });
    } catch (error) {
        console.error("Update Category Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update category",
            error: error.message,
        });
    }
};

// Delete custom category
const deleteCategoryController = async (req, res) => {
    try {
        const {id} = req.params;

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

        await categoryModel.deleteOne({_id: id});

        res.status(200).json({
            success: true,
            message: "Category deleted successfully",
        });
    } catch (error) {
        console.error("Delete Category Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete category",
            error: error.message,
        });
    }
};

// Get category usage statistics
const getCategoryStatsController = async (req, res) => {
    try {
        const {type, period = "month"} = req.query;

        let dateFilter = {};
        const now = new Date();

        // Set date range based on period
        switch (period) {
            case "week":
                dateFilter = {
                    $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
                };
                break;
            case "month":
                dateFilter = {
                    $gte: new Date(now.getFullYear(), now.getMonth(), 1),
                };
                break;
            case "year":
                dateFilter = {
                    $gte: new Date(now.getFullYear(), 0, 1),
                };
                break;
            default:
                dateFilter = {
                    $gte: new Date(now.getFullYear(), now.getMonth(), 1),
                };
        }

        const matchStage = {
            userId: req.user.id,
            date: dateFilter,
        };

        if (type) matchStage.type = type;

        const categoryStats = await transactionModel.aggregate([
            {$match: matchStage},
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
                    isSystem: {$ifNull: ["$categoryInfo.isSystem", false]},
                },
            },
            {$sort: {totalAmount: -1}},
        ]);

        res.status(200).json({
            success: true,
            stats: categoryStats,
        });
    } catch (error) {
        console.error("Get Category Stats Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch category statistics",
            error: error.message,
        });
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
