const dotenv = require("dotenv");
const colors = require("colors");
const connectDb = require("./config/connectDb");
const {initializeSystemCategories} = require("./models/categoryModel");

dotenv.config();

(async () => {
    const dbConnected = await connectDb().catch(() => {
        console.log("Database connection failed, continuing without DB...".yellow);
        return false;
    });

    if (dbConnected) {
        await require("./models/userModel").init();
        setTimeout(() => {
            initializeSystemCategories().catch(() => {
                console.log("Failed to initialize system categories".yellow);
            });
        }, 2000);
    } else {
        console.log("Database not connected - skipping system categories initialization".yellow);
        console.log("For development, you can use local MongoDB or MongoDB Atlas free tier".yellow);
        console.log("Setup guide: https://www.mongodb.com/atlas/database".yellow);
    }

    const app = require("./app").createApp();

    const PORT = process.env.PORT || 8080;
    console.log("Expense Management System Server Starting...".green);

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`.bgGreen.white);
    });
})().catch(async () => {
    console.error('Server initialization failed. Check backend configuration.');
    process.exitCode = 1;
    await require('mongoose').disconnect().catch(() => {});
});
