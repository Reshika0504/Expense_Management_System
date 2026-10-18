const Joi = require("joi");
const { validate, ApiError } = require("./apiError");
const baseFields = {
    type: Joi.string().valid("income", "expense").empty(""),
    period: Joi.string().valid("week", "month", "year").empty(""),
    startDate: Joi.string().max(40).empty(""),
    endDate: Joi.string().max(40).empty(""),
};
const reportQuery = (query) =>
    validate(
        Joi.object({
            ...baseFields,
            limit: Joi.number().integer().min(1).max(100),
        }),
        query,
    );
const listQuery = (query) =>
    validate(
        Joi.object({
            type: baseFields.type,
            startDate: baseFields.startDate,
            endDate: baseFields.endDate,
            page: Joi.number().integer().min(1).max(100000).default(1),
            limit: Joi.number().integer().min(1).max(100).default(10),
            category: Joi.string().max(50).empty(""),
            search: Joi.string().max(200).empty(""),
            sortBy: Joi.string()
                .valid(
                    "date",
                    "amount",
                    "createdAt",
                    "updatedAt",
                    "category",
                    "type",
                )
                .default("date"),
            sortOrder: Joi.string().valid("asc", "desc").default("desc"),
        }),
        query,
    );
const idParam = (id) => {
    if (typeof id !== "string" || !/^[a-f\d]{24}$/i.test(id))
        throw new ApiError(
            400,
            "VALIDATION_ERROR",
            "Invalid record identifier.",
        );
    return id;
};
module.exports = { reportQuery, listQuery, idParam };
