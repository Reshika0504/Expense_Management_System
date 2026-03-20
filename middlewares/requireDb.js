const mongoose = require("mongoose");

const requireDb = (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            success: false,
            message:
                "Database is not connected. Start local MongoDB or whitelist your current IP in MongoDB Atlas.",
        });
    }

    next();
};

module.exports = {requireDb};
