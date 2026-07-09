const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "name is required"],
            trim: true,
            maxlength: 50,
        },
        email: {
            type: String,
            required: [true, "email is required and should be unique"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
        },
        password: {
            type: String,
            required: [true, "password is required"],
            minlength: 6,
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },
        avatar: {
            type: String,
            default: "",
        },
        phone: {
            type: String,
            trim: true,
            default: "",
        },
        dateOfBirth: {
            type: Date,
            default: null,
        },
        monthlyBudget: {
            type: Number,
            default: 0,
            min: 0,
        },
        monthlyIncome: {
            type: Number,
            default: 0,
            min: 0,
        },
        monthlySavingsGoal: {
            type: Number,
            default: 0,
            min: 0,
        },
        lastLogin: {
            type: Date,
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        gender: {
            type: String,
            default: "",
        },
        occupation: {
            type: String,
            default: "",
        },
        currency: {
            type: String,
            default: "USD",
        },
        themePreference: {
            type: String,
            enum: ["light", "dark"],
            default: "dark",
        },
        categoryBudgets: {
            type: Map,
            of: Number,
            default: {},
        },
    },
    {timestamps: true}
);

const userModel = mongoose.model("users", userSchema);
module.exports = userModel;
