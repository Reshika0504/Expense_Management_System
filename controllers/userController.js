const userModel = require("../models/userModel");
const transactionModel = require("../models/transactionModel");
const {categoryModel} = require("../models/categoryModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign({user: {id: user._id, email: user.email, role: user.role}}, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });
};

// Validation schemas
const registerSchema = Joi.object({
    name: Joi.string().min(2).max(50).required().trim(),
    email: Joi.string().email().required().trim().lowercase(),
    password: Joi.string().min(6).required(),
    phone: Joi.string().optional().allow("").trim(),
});

const loginSchema = Joi.object({
    email: Joi.string().email().required().trim().lowercase(),
    password: Joi.string().required(),
});

const profileSchema = Joi.object({
    name: Joi.string().min(2).max(50).optional().trim(),
    phone: Joi.string().optional().allow("").trim(),
    avatar: Joi.string().optional().allow("").trim(),
    dateOfBirth: Joi.date().optional().allow(null, ""),
    monthlyBudget: Joi.number().min(0).optional(),
    monthlyIncome: Joi.number().min(0).optional(),
    monthlySavingsGoal: Joi.number().min(0).optional(),
    gender: Joi.string().optional().allow("").trim(),
    occupation: Joi.string().optional().allow("").trim(),
    currency: Joi.string().optional().allow("").trim(),
    themePreference: Joi.string().valid("light", "dark").optional(),
    categoryBudgets: Joi.object().pattern(Joi.string(), Joi.number().min(0)).optional(),
});

const formatUserResponse = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    phone: user.phone,
    dateOfBirth: user.dateOfBirth,
    monthlyBudget: user.monthlyBudget,
    monthlyIncome: user.monthlyIncome,
    monthlySavingsGoal: user.monthlySavingsGoal,
    gender: user.gender,
    occupation: user.occupation,
    currency: user.currency,
    themePreference: user.themePreference,
    categoryBudgets: user.categoryBudgets instanceof Map ? Object.fromEntries(user.categoryBudgets) : user.categoryBudgets || {},
});

// Register callback
const registerController = async (req, res) => {
    try {
        const {error} = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const {name, email, password, phone} = req.body;

        const existingUser = await userModel.findOne({email});
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists with this email",
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new userModel({
            name,
            email,
            password: hashedPassword,
            phone: phone || "",
        });

        await newUser.save();
        const token = generateToken(newUser);

        res.status(201).json({
            success: true,
            message: "Registration successful",
            token,
            user: formatUserResponse(newUser),
        });
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({
            success: false,
            message: "Registration failed",
            error: error.message,
        });
    }
};

// Login callback
const loginController = async (req, res) => {
    try {
        const {error} = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const {email, password} = req.body;

        const user = await userModel.findOne({email}).select("+password");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Account is deactivated",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        user.lastLogin = new Date();
        await user.save();
        const token = generateToken(user);

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: formatUserResponse(user),
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({
            success: false,
            message: "Login failed",
            error: error.message,
        });
    }
};

// Get user profile
const getProfileController = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            user: formatUserResponse(user),
        });
    } catch (error) {
        console.error("Get Profile Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch profile",
            error: error.message,
        });
    }
};

// Update profile
const updateProfileController = async (req, res) => {
    try {
        const {error} = profileSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const {
            name,
            phone,
            avatar,
            dateOfBirth,
            monthlyBudget,
            monthlyIncome,
            monthlySavingsGoal,
            gender,
            occupation,
            currency,
            themePreference,
            categoryBudgets,
        } = req.body;

        const user = await userModel.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (name !== undefined) user.name = name;
        if (phone !== undefined) user.phone = phone;
        if (avatar !== undefined) user.avatar = avatar;
        if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth || null;
        if (monthlyBudget !== undefined) user.monthlyBudget = monthlyBudget;
        if (monthlyIncome !== undefined) user.monthlyIncome = monthlyIncome;
        if (monthlySavingsGoal !== undefined) user.monthlySavingsGoal = monthlySavingsGoal;
        if (gender !== undefined) user.gender = gender;
        if (occupation !== undefined) user.occupation = occupation;
        if (currency !== undefined) user.currency = currency;
        if (themePreference !== undefined) user.themePreference = themePreference;
        if (categoryBudgets !== undefined) user.categoryBudgets = categoryBudgets;

        await user.save();

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: formatUserResponse(user),
        });
    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update profile",
            error: error.message,
        });
    }
};

// Change password
const changePasswordController = async (req, res) => {
    try {
        const {currentPassword, newPassword} = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Current password and new password are required",
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters long",
            });
        }

        const user = await userModel.findById(req.user.id).select("+password");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect",
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password changed successfully",
        });
    } catch (error) {
        console.error("Change Password Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to change password",
            error: error.message,
        });
    }
};

// Delete account
const deleteAccountController = async (req, res) => {
    try {
        const userId = req.user.id;

        // Cascade delete transactions
        await transactionModel.deleteMany({userId});

        // Cascade delete custom categories
        await categoryModel.deleteMany({userId});

        // Delete user
        await userModel.findByIdAndDelete(userId);

        res.status(200).json({
            success: true,
            message: "Account and associated data deleted successfully",
        });
    } catch (error) {
        console.error("Delete Account Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete account",
            error: error.message,
        });
    }
};

module.exports = {
    registerController,
    loginController,
    getProfileController,
    updateProfileController,
    changePasswordController,
    deleteAccountController,
};
