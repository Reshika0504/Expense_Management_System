const express = require("express");
const {
    getCategoriesController,
    getSystemCategoriesController,
    createCategoryController,
    updateCategoryController,
    deleteCategoryController,
    getCategoryStatsController,
} = require("../controllers/categoryController");
const {protect} = require("../middlewares/authMiddleware");

// Router object
const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Routes
router.get("/", getCategoriesController); // Get all categories (system + user)
router.get("/system", getSystemCategoriesController); // Get system categories only
router.get("/stats/usage", getCategoryStatsController); // Get category usage statistics
router.post("/", createCategoryController); // Create custom category
router.put("/:id", updateCategoryController); // Update custom category
router.delete("/:id", deleteCategoryController); // Delete custom category

module.exports = router;
