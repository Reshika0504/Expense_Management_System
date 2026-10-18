const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const { requireDb } = require("./middlewares/requireDb");
const {
    browserRoutes,
    frontendRedirect,
} = require("./middlewares/frontendRedirect");

const { ApiError, fail } = require("./utils/apiError");
function createApp({ logging = true, serveClient = true } = {}) {
    const app = express();

    app.set("trust proxy", 1);
    app.disable("x-powered-by");
    if (logging) app.use(morgan(":method :status :response-time ms"));
    app.use((req, res, next) => {
        res.set("X-Content-Type-Options", "nosniff");
        res.set("Referrer-Policy", "no-referrer");
        if (req.path.startsWith("/api/")) res.set("Cache-Control", "no-store");
        next();
    });
    app.use(
        cors({
            origin(origin, callback) {
                const allowed = [
                    process.env.FRONTEND_URL ||
                        "https://expense-management-system-frontend-3o3i.onrender.com",
                ];
                if (process.env.NODE_ENV !== "production")
                    allowed.push("http://localhost:3000");
                callback(null, !origin || allowed.includes(origin));
            },
            credentials: false,
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allowedHeaders: ["Authorization", "Content-Type"],
        }),
    );
    app.use(express.json({ limit: "100kb" }));

    app.get("/api/health", (req, res) => {
        res.status(200).json({
            success: true,
            message: "Server is running",
        });
    });

    app.use("/api/v1/users", requireDb, require("./routes/userRoute"));
    app.use(
        "/api/v1/transactions",
        requireDb,
        require("./routes/transactionRoute"),
    );
    app.use("/api/v1/categories", requireDb, require("./routes/categoryRoute"));
    app.use("/api/v1/dashboard", requireDb, require("./routes/dashboardRoute"));

    const clientBuildPath = path.join(__dirname, "client", "build");
    const clientIndexPath = path.join(clientBuildPath, "index.html");
    const hasClientBuild = fs.existsSync(clientIndexPath);

    if (serveClient && hasClientBuild) {
        app.use(express.static(clientBuildPath));

        app.get(/^\/(?!api).*/, (req, res) => {
            res.sendFile(clientIndexPath);
        });
    } else {
        app.get(browserRoutes, frontendRedirect);
    }

    app.use((err, req, res, next) => {
        if (err.type === "entity.too.large")
            return fail(
                res,
                new ApiError(
                    413,
                    "PAYLOAD_TOO_LARGE",
                    "Request body is too large.",
                ),
            );
        if (err.type === "entity.parse.failed")
            return fail(
                res,
                new ApiError(
                    400,
                    "VALIDATION_ERROR",
                    "Invalid JSON request body.",
                ),
            );
        return fail(res, err);
    });

    app.use((req, res) => {
        res.status(404).json({
            success: false,
            message: "Route not found",
        });
    });

    return app;
}
module.exports = { createApp };
