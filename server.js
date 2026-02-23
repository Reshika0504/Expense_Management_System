const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const colors = require("colors");
const connectDb = require("./config/connectDb");
const {initializeSystemCategories} = require("./models/categoryModel");

// Config dot env file
dotenv.config();

// Connect to database
(async () => {
    const dbConnected = await connectDb().catch((err) => {
        console.log("Database connection failed, continuing without DB...".yellow);
        return false;
    });

    // Only initialize system categories if DB is connected
    if (dbConnected) {
        setTimeout(() => {
            initializeSystemCategories().catch((err) => {
                console.log("Failed to initialize system categories".yellow);
            });
        }, 2000);
    } else {
        console.log("⚠️  Database not connected - skipping system categories initialization".yellow);
        console.log("💡 For development, you can use a local MongoDB instance or MongoDB Atlas free tier".yellow);
        console.log("🔗 Visit: https://www.mongodb.com/atlas/database to set up your free cluster".yellow);
    }

    const app = express();

    // Middlewares
    app.use(morgan("dev"));
    app.use(express.json());
    app.use(cors());

    // Routes
    app.use("/api/v1/users", require("./routes/userRoute"));
    app.use("/api/v1/transactions", require("./routes/transactionRoute"));
    app.use("/api/v1/categories", require("./routes/categoryRoute"));
    app.use("/api/v1/dashboard", require("./routes/dashboardRoute"));

    // Error handling middleware
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).json({
            success: false,
            message: "Something went wrong!",
            error: process.env.NODE_ENV === "development" ? err.message : {},
        });
    });

    // 404 handler
    app.use((req, res) => {
        res.status(404).json({
            success: false,
            message: "Route not found",
        });
    });

    const PORT = process.env.PORT || 8080;

    console.log("🚀 Expense Management System Server Starting...".green);

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`.bgGreen.white);
    });
})();
