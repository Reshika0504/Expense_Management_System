const express = require("express");
const {rateLimit} = require("express-rate-limit");
const {
    loginController,
    firebaseLoginController,
    registerController,
    getProfileController,
    updateProfileController,
    changePasswordController,
    deleteAccountController,
} = require("../controllers/userController");
const {protect} = require("../middlewares/authMiddleware");

// Router object
const router = express.Router();

// Limits are per API instance; use a shared store before horizontal scaling.
const authLimiter = rateLimit({windowMs: 15 * 60 * 1000, limit: 30,
    standardHeaders: "draft-8", legacyHeaders: false,
    message: {success: false, message: "Too many sign-in attempts. Please try again in 15 minutes."}});

// Public routes
router.post("/login", authLimiter, loginController);
router.post("/firebase", authLimiter, firebaseLoginController);
router.post("/register", authLimiter, registerController);

// Protected routes
router.use(protect);
router.get("/profile", getProfileController);
router.put("/profile", updateProfileController);
router.delete("/profile", deleteAccountController);
router.put("/change-password", changePasswordController);

module.exports = router;
