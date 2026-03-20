const mongoose = require("mongoose");
const colors = require("colors");

const connectDb = async () => {
    const primaryUrl = process.env.MONGO_URL;
    const localFallbackUrl = process.env.MONGO_LOCAL_URL || "mongodb://127.0.0.1:27017/expense_management";

    try {
        if (!primaryUrl) {
            console.log("MONGO_URL is not set. Skipping database connection.".yellow);
            return false;
        }

        const urlWithoutPassword = primaryUrl.replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@");
        console.log(`Attempting to connect to: ${urlWithoutPassword}`.cyan);

        const connectionOptions = {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            heartbeatFrequencyMS: 10000,
        };

        console.log("Connecting to MongoDB...".yellow);
        await mongoose.connect(primaryUrl, connectionOptions);
        console.log(`MongoDB Connected: ${mongoose.connection.host}`.bgGreen.white);

        mongoose.connection.on("error", (err) => {
            console.log(`MongoDB connection error: ${err}`.bgRed.white);
        });

        mongoose.connection.on("disconnected", () => {
            console.log("MongoDB disconnected".yellow);
        });

        mongoose.connection.on("reconnected", () => {
            console.log("MongoDB reconnected".green);
        });

        return true;
    } catch (error) {
        console.log(`MongoDB Connection Error: ${error.message}`.bgRed.white);

        if (primaryUrl.startsWith("mongodb+srv://")) {
            try {
                console.log("Trying local MongoDB fallback...".yellow);
                await mongoose.connect(localFallbackUrl);
                console.log(`MongoDB Connected (local fallback): ${mongoose.connection.host}`.bgGreen.white);
                return true;
            } catch (fallbackError) {
                console.log(`Local fallback failed: ${fallbackError.message}`.red);
            }
        }

        if (error.message.includes("ENOTFOUND") || error.message.includes("ENODATA")) {
            console.log("DNS resolution error detected.".yellow);
            console.log("Check internet/firewall settings and Atlas cluster name.".yellow);
        } else {
            console.log("Check MongoDB Atlas access list and credentials.".yellow);
        }

        return false;
    }
};

module.exports = connectDb;
