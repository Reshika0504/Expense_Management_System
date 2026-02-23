const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            required: [true, "userId is required"],
            index: true,
        },
        amount: {
            type: Number,
            required: [true, "amount is required"],
            min: 0,
        },
        type: {
            type: String,
            enum: ["income", "expense"],
            required: [true, "type is required"],
        },
        category: {
            type: String,
            required: [true, "category is required"],
            trim: true,
        },
        date: {
            type: Date,
            required: [true, "date is required"],
            index: true,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        paymentMethod: {
            type: String,
            enum: ["cash", "credit_card", "debit_card", "bank_transfer", "digital_wallet", "other"],
            default: "other",
        },
        tags: [
            {
                type: String,
                trim: true,
            },
        ],
        isRecurring: {
            type: Boolean,
            default: false,
        },
        recurrencePattern: {
            type: String,
            enum: ["daily", "weekly", "monthly", "yearly"],
        },
        notes: {
            type: String,
            trim: true,
            maxlength: 1000,
        },
    },
    {timestamps: true}
);

// Index for better query performance
transactionSchema.index({userId: 1, date: -1});
transactionSchema.index({userId: 1, category: 1});
transactionSchema.index({userId: 1, type: 1});

const transactionModel = mongoose.model("transactions", transactionSchema);
module.exports = transactionModel;
