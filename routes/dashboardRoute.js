const express = require("express");
const {
    getDashboardOverviewController,
    getMonthlySummaryController,
    getCategoryReportController,
    getTopCategoriesController,
} = require("../controllers/dashboardController");
const {protect} = require("../middlewares/authMiddleware");

// Router object
const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Routes
router.get("/overview", getDashboardOverviewController); // Get dashboard overview
router.get("/monthly-summary", getMonthlySummaryController); // Get monthly summary report
router.get("/category-report", getCategoryReportController); // Get category-wise spending report
router.get("/top-categories", getTopCategoriesController); // Get top spending categories

module.exports = router;
