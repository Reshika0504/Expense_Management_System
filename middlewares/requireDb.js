const mongoose = require("mongoose");

const requireDb = (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            success: false,
            code: 'DATABASE_UNAVAILABLE',
            message: 'Service is temporarily unavailable. Please retry.',
        });
    }

    next();
};

module.exports = {requireDb};
