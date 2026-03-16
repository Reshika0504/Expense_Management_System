const mongoose = require("mongoose");
const colors = require("colors");

const connectDb = async () => {
    try {
        if (!process.env.MONGO_URL) {
            console.log("MONGO_URL is not set. Skipping database connection.".yellow);
            return false;
        }

        // Log the connection URL (without password for security)
        const urlWithoutPassword = process.env.MONGO_URL.replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@");
        console.log(`Attempting to connect to: ${urlWithoutPassword}`.cyan);

        // Add connection options for better reliability
        const connectionOptions = {
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            maxPoolSize: 10, // Maintain up to 10 socket connections
            heartbeatFrequencyMS: 10000, // Send heartbeats every 10 seconds
        };

        console.log("Connecting to MongoDB...".yellow);
        await mongoose.connect(process.env.MONGO_URL, connectionOptions);
        console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`.bgGreen.white);

        // Handle connection events
        mongoose.connection.on("error", (err) => {
            console.log(`MongoDB connection error: ${err}`.bgRed.white);
        });

        mongoose.connection.on("disconnected", () => {
            console.log("MongoDB disconnected".yellow);
        });

        mongoose.connection.on("reconnected", () => {
            console.log("MongoDB reconnected".green);
        });

        return true; // Connection successful
    } catch (error) {
        console.log(`❌ MongoDB Connection Error: ${error.message}`.bgRed.white);

        if (error.message.includes("ENOTFOUND") || error.message.includes("ENODATA")) {
            console.log("⚠️  DNS Resolution Error: This could be due to:".yellow);
            console.log("   - Network connectivity issues".yellow);
            console.log("   - Firewall blocking DNS requests".yellow);
            console.log("   - MongoDB Atlas cluster not accessible from your location".yellow);
            console.log("   - Incorrect MongoDB Atlas cluster name".yellow);
            console.log("\n💡 SUGGESTIONS:".cyan);
            console.log("   1. Check your internet connection".cyan);
            console.log("   2. Verify the MongoDB Atlas cluster name is correct".cyan);
            console.log("   3. Ensure IP address is whitelisted in MongoDB Atlas".cyan);
            console.log("   4. Check if corporate firewall is blocking MongoDB connections".cyan);
        } else {
            console.log("Please check your internet connection and MongoDB Atlas settings".yellow);
        }

        // Don't exit the process, let the app continue without DB
        return false; // Connection failed
    }
};

module.exports = connectDb;
