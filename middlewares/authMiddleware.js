const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const users = require("../models/userModel");
const { ApiError, fail } = require("../utils/apiError");
async function authenticate(req) {
    if (!process.env.JWT_SECRET)
        throw new ApiError(503, "AUTH_UNAVAILABLE", "Authentication is temporarily unavailable.");
    const header = req.headers.authorization;
    if (typeof header !== "string" || !/^Bearer [^\s]+$/.test(header))
        throw new ApiError(401, "UNAUTHENTICATED", "A valid sign-in is required.");
    let decoded;
    try {
        decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET, {
            algorithms: ["HS256"],
        });
    } catch {
        throw new ApiError(401, "UNAUTHENTICATED", "Sign-in expired or invalid. Please sign in again.");
    }
    if (!mongoose.isObjectIdOrHexString(decoded.user?.id))
        throw new ApiError(401, "UNAUTHENTICATED", "Invalid session identity.");
    let account;
    try {
        account = await users.findById(decoded.user.id).select("_id email role isActive sessionVersion").lean();
    } catch {
        throw new ApiError(503, "AUTH_UNAVAILABLE", "Authentication is temporarily unavailable. Please retry.");
    }
    if (!account) throw new ApiError(401, "UNAUTHENTICATED", "This session is no longer valid.");
    if (account.isActive !== true) throw new ApiError(403, "ACCOUNT_DISABLED", "Account is deactivated.");
    if ((decoded.ver ?? 0) !== (account.sessionVersion ?? 0))
        throw new ApiError(401, "SESSION_REVOKED", "This session has ended. Please sign in again.");
    req.user = {
        id: String(account._id),
        email: account.email,
        role: account.role,
    };
}
const protect = async (req, res, next) => {
    try {
        await authenticate(req);
        return next();
    } catch (error) {
        return fail(res, error);
    }
};
const admin = (req, res, next) =>
    req.user?.role === "admin" ? next() : fail(res, new ApiError(403, "FORBIDDEN", "Admin rights required."));
const optionalAuth = async (req, res, next) => {
    try {
        await authenticate(req);
    } catch {
        req.user = null;
    }
    return next();
};
const requireSigningKey = (req, res, next) =>
    process.env.JWT_SECRET
        ? next()
        : fail(res, new ApiError(503, "AUTH_UNAVAILABLE", "Authentication is temporarily unavailable."));
module.exports = { protect, admin, optionalAuth, requireSigningKey };
