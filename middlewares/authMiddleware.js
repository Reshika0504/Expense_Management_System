const jwt = require("jsonwebtoken");

// JWT verification middleware
const protect = async (req, res, next) => {
    try {
        let token;

        // Check for token in Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            try {
                // Get token from header
                token = req.headers.authorization.split(" ")[1];

                // Verify token
                const decoded = jwt.verify(token, process.env.JWT_SECRET);

                // Add user info to request object
                req.user = decoded.user;
                next();
            } catch (error) {
                console.error("Token verification error:", error);
                return res.status(401).json({
                    success: false,
                    message: "Not authorized, token failed",
                });
            }
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not authorized, no token",
            });
        }
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Admin authorization middleware
const admin = async (req, res, next) => {
    try {
        if (req.user && req.user.role === "admin") {
            next();
        } else {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin rights required.",
            });
        }
    } catch (error) {
        console.error("Admin middleware error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Optional authentication middleware (doesn't require token but adds user info if present)
const optionalAuth = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];

            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = decoded.user;
            } catch (error) {
                // Token invalid, but we don't reject the request
                req.user = null;
            }
        } else {
            req.user = null;
        }

        next();
    } catch (error) {
        console.error("Optional auth middleware error:", error);
        req.user = null;
        next();
    }
};

module.exports = {protect, admin, optionalAuth};
