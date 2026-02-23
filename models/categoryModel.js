const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "category name is required"],
            trim: true,
            maxlength: 50,
        },
        type: {
            type: String,
            enum: ["income", "expense"],
            required: [true, "category type is required"],
        },
        icon: {
            type: String,
            default: "",
        },
        color: {
            type: String,
            default: "#6B7280",
            match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Please enter a valid hex color"],
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            default: null, // null for system categories
            index: true,
        },
        isSystem: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {timestamps: true}
);

// Index for better query performance
categorySchema.index({userId: 1, type: 1});
categorySchema.index({isSystem: 1, type: 1});

const categoryModel = mongoose.model("categories", categorySchema);

// Predefined system categories
const systemCategories = [
    // Income categories
    {name: "Salary", type: "income", icon: "💰", color: "#10B981", isSystem: true},
    {name: "Freelance", type: "income", icon: "💼", color: "#3B82F6", isSystem: true},
    {name: "Investment", type: "income", icon: "📈", color: "#8B5CF6", isSystem: true},
    {name: "Gift", type: "income", icon: "🎁", color: "#EC4899", isSystem: true},
    {name: "Other Income", type: "income", icon: "💵", color: "#6B7280", isSystem: true},

    // Expense categories
    {name: "Food & Dining", type: "expense", icon: "🍔", color: "#EF4444", isSystem: true},
    {name: "Transportation", type: "expense", icon: "🚗", color: "#F59E0B", isSystem: true},
    {name: "Shopping", type: "expense", icon: "🛍️", color: "#8B5CF6", isSystem: true},
    {name: "Entertainment", type: "expense", icon: "🎬", color: "#EC4899", isSystem: true},
    {name: "Healthcare", type: "expense", icon: "🏥", color: "#10B981", isSystem: true},
    {name: "Utilities", type: "expense", icon: "💡", color: "#6B7280", isSystem: true},
    {name: "Rent/Mortgage", type: "expense", icon: "🏠", color: "#F97316", isSystem: true},
    {name: "Travel", type: "expense", icon: "✈️", color: "#06B6D4", isSystem: true},
    {name: "Education", type: "expense", icon: "📚", color: "#3B82F6", isSystem: true},
    {name: "Insurance", type: "expense", icon: "🛡️", color: "#8B5CF6", isSystem: true},
    {name: "Personal Care", type: "expense", icon: "💅", color: "#EC4899", isSystem: true},
    {name: "Other Expenses", type: "expense", icon: "💸", color: "#6B7280", isSystem: true},
];

// Initialize system categories
const initializeSystemCategories = async () => {
    try {
        console.log("Checking for existing system categories...");
        const existingCategories = await categoryModel.countDocuments({isSystem: true});
        console.log(`Found ${existingCategories} existing system categories`);

        if (existingCategories === 0) {
            console.log("Inserting system categories...");
            await categoryModel.insertMany(systemCategories);
            console.log("✅ System categories initialized successfully");
        } else {
            console.log("System categories already exist");
        }
    } catch (error) {
        console.error("❌ Error initializing system categories:", error.message);
        // Don't throw error, let the app continue
    }
};

module.exports = {categoryModel, initializeSystemCategories};
