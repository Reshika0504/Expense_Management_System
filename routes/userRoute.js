const express = require("express");
const {
    loginController,
    registerController,
    getProfileController,
    updateProfileController,
    changePasswordController,
} = require("../controllers/userController");
const {protect} = require("../middlewares/authMiddleware");

// Router object
const router = express.Router();

// Public routes
router.post("/login", loginController);
router.post("/register", registerController);

// Protected routes
router.use(protect);
router.get("/profile", getProfileController);
router.put("/profile", updateProfileController);
router.put("/change-password", changePasswordController);

module.exports = router;
