const userModel = require("../models/userModel");
const transactionModel = require("../models/transactionModel");
const { categoryModel } = require("../models/categoryModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const { fail, ApiError } = require("../utils/apiError");
const { verifyFirebaseToken } = require("../services/firebaseAuth");

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { user: { id: user._id, email: user.email, role: user.role }, ver: user.sessionVersion || 0 },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d",
        },
    );
};

// Validation schemas
const registerSchema = Joi.object({
    name: Joi.string().min(2).max(50).required().trim(),
    email: Joi.string().email().required().trim().lowercase(),
    password: Joi.string()
        .min(6)
        .custom((value, helpers) => (Buffer.byteLength(value, "utf8") <= 72 ? value : helpers.error("any.invalid")))
        .required(),
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
    categoryBudgets:
        user.categoryBudgets instanceof Map ? Object.fromEntries(user.categoryBudgets) : user.categoryBudgets || {},
});

// Register callback
const registerController = async (req, res) => {
    try {
        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const { name, email, password, phone } = value;

        const existingUser = await userModel.findOne({ email });
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
        return fail(res, error);
    }
};

// Login callback
const loginController = async (req, res) => {
    try {
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const { email, password } = value;
        const user = await userModel.findOne({ email }).select("+password +sessionVersion");
        if (!user) {
            return res.status(401).json({
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

        const isMatch = user.password && (await bcrypt.compare(password, user.password));
        if (!isMatch) {
            return res.status(401).json({
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
        return fail(res, error);
    }
};

// Exchange a provider-verified identity for the existing application session.
const firebaseLoginController = async (req, res) => {
    const { error, value } = Joi.object({ idToken: Joi.string().max(10000).required() }).validate(req.body);
    if (error) return res.status(400).json({ success: false, message: "A valid identity token is required" });
    let identity;
    try {
        identity = await verifyFirebaseToken(value.idToken);
    } catch (error) {
        const invalidCodes = [
            "auth/argument-error",
            "auth/invalid-id-token",
            "auth/id-token-expired",
            "auth/id-token-revoked",
            "auth/user-disabled",
        ];
        const unavailable =
            error.status === 503 ||
            ["app/network-error", "auth/internal-error", "app/invalid-credential"].includes(error.code);
        return fail(
            res,
            new ApiError(
                unavailable ? 503 : invalidCodes.includes(error.code) ? 401 : 500,
                unavailable
                    ? "AUTH_UNAVAILABLE"
                    : invalidCodes.includes(error.code)
                      ? "UNAUTHENTICATED"
                      : "INTERNAL_ERROR",
                unavailable
                    ? "Google sign-in is temporarily unavailable. Please retry or use email and password."
                    : invalidCodes.includes(error.code)
                      ? "Sign-in expired or invalid. Please try again."
                      : "Unable to complete Google sign-in. Please try again.",
            ),
        );
    }
    const provider = identity.firebase?.sign_in_provider;
    if (provider !== "google.com" || !identity.email_verified || !identity.email) {
        return res.status(401).json({ success: false, message: "A verified Google account is required" });
    }
    try {
        let user = await userModel.findOne({ firebaseUid: identity.uid }).select("+sessionVersion");
        const email = identity.email?.trim().toLowerCase();
        if (!user) {
            user = await userModel.findOne({ email }).select("+sessionVersion");
            // Only Google-authoritative addresses may link automatically.
            if (user && !email.endsWith("@gmail.com") && !identity.hd) {
                return res
                    .status(409)
                    .json({
                        success: false,
                        message:
                            "An email/password account already uses this email. Please sign in with your password.",
                    });
            }
            if (user?.firebaseUid && user.firebaseUid !== identity.uid) {
                return res
                    .status(409)
                    .json({ success: false, message: "This email is linked to another sign-in identity." });
            }
        }
        if (!user) {
            user = new userModel({
                firebaseUid: identity.uid,
                email,
                name: (identity.name || email.split("@")[0]).slice(0, 50),
                avatar: identity.picture || "",
            });
        }
        if (!user.isActive) return res.status(403).json({ success: false, message: "Account is deactivated" });
        user.firebaseUid = identity.uid;
        user.lastLogin = new Date();
        await user.save();
        return res.json({ success: true, token: generateToken(user), user: formatUserResponse(user) });
    } catch (error) {
        return res
            .status(error.code === 11000 ? 409 : 500)
            .json({
                success: false,
                message:
                    error.code === 11000
                        ? "This identity is already registered. Please try signing in again."
                        : "Unable to finish sign-in. Please try again.",
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
        return fail(res, error);
    }
};

// Update profile
const updateProfileController = async (req, res) => {
    try {
        const { error, value } = profileSchema.validate(req.body);
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
        } = value;

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
        return fail(res, error);
    }
};

// Change password
const changePasswordController = async (req, res) => {
    try {
        const { value, error } = Joi.object({
            currentPassword: Joi.string().max(1024).required(),
            newPassword: Joi.string()
                .min(6)
                .custom((value, helpers) =>
                    Buffer.byteLength(value, "utf8") <= 72 ? value : helpers.error("any.invalid"),
                )
                .required(),
        }).validate(req.body);
        if (error)
            throw new ApiError(
                400,
                "VALIDATION_ERROR",
                "Use the current password and a new password of at least 6 characters and at most 72 UTF-8 bytes.",
            );
        const { currentPassword, newPassword } = value;

        const user = await userModel.findById(req.user.id).select("+password +sessionVersion");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const isMatch = user.password && (await bcrypt.compare(currentPassword, user.password));
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect",
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Atomic increment preserves revocation if password changes race with logout.
        await userModel.updateOne(
            { _id: user._id },
            { $set: { password: hashedPassword }, $inc: { sessionVersion: 1 } },
        );

        res.status(200).json({
            success: true,
            message: "Password changed successfully",
        });
    } catch (error) {
        return fail(res, error);
    }
};

// Delete account
const deleteAccountController = async (req, res) => {
    try {
        const userId = req.user.id;

        // Cascade delete transactions
        await transactionModel.deleteMany({ userId });

        // Cascade delete custom categories
        await categoryModel.deleteMany({ userId });

        // Delete user
        await userModel.findByIdAndDelete(userId);

        res.status(200).json({
            success: true,
            message: "Account and associated data deleted successfully",
        });
    } catch (error) {
        return fail(res, error);
    }
};

const logoutController = async (req, res) => {
    try {
        await userModel.updateOne({ _id: req.user.id }, { $inc: { sessionVersion: 1 } });
        return res.json({ success: true, message: "Signed out. Existing sessions have been revoked." });
    } catch (error) {
        return fail(res, error);
    }
};

module.exports = {
    logoutController,
    registerController,
    loginController,
    firebaseLoginController,
    getProfileController,
    updateProfileController,
    changePasswordController,
    deleteAccountController,
};
