const express = require("express");
const {
    createTransactionController,
    getTransactionsController,
    getTransactionController,
    updateTransactionController,
    deleteTransactionController,
    getTransactionStatsController,
} = require("../controllers/transactionController");
const {protect} = require("../middlewares/authMiddleware");

// Router object
const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Routes
router.post("/", createTransactionController); // Create transaction
router.get("/", getTransactionsController); // Get all transactions with filtering
router.get("/:id", getTransactionController); // Get single transaction
router.put("/:id", updateTransactionController); // Update transaction
router.delete("/:id", deleteTransactionController); // Delete transaction
router.get("/stats/summary", getTransactionStatsController); // Get transaction statistics

module.exports = router;
