const { categoryModel } = require("../models/categoryModel");
const { ApiError } = require("../utils/apiError");
const visibility = (userId) => ({
    $or: [
        { userId, isSystem: false },
        { userId: null, isSystem: true },
    ],
});
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
async function permittedCategory(userId, name, type) {
    const category = await categoryModel
        .findOne({ ...visibility(userId), name, type, isActive: true })
        .sort({ isSystem: 1, _id: 1 })
        .lean();
    if (!category)
        throw new ApiError(
            400,
            "INVALID_CATEGORY",
            "Choose an active category available to your account and transaction type.",
        );
    return category;
}
function metadataLookup(userId) {
    return [
        {
            $lookup: {
                from: "categories",
                let: { name: "$_id.category", type: "$_id.type" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$name", "$$name"] },
                                    { $eq: ["$type", "$$type"] },
                                    {
                                        $or: [
                                            {
                                                $and: [
                                                    {
                                                        $eq: [
                                                            "$userId",
                                                            userId,
                                                        ],
                                                    },
                                                    {
                                                        $eq: [
                                                            "$isSystem",
                                                            false,
                                                        ],
                                                    },
                                                ],
                                            },
                                            {
                                                $and: [
                                                    { $eq: ["$userId", null] },
                                                    {
                                                        $eq: [
                                                            "$isSystem",
                                                            true,
                                                        ],
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                        },
                    },
                    { $sort: { isSystem: 1, _id: 1 } },
                    { $limit: 1 },
                    { $project: { _id: 0, icon: 1, color: 1, isSystem: 1 } },
                ],
                as: "categoryInfo",
            },
        },
        { $set: { categoryInfo: { $arrayElemAt: ["$categoryInfo", 0] } } },
    ];
}
module.exports = { visibility, escapeRegex, permittedCategory, metadataLookup };
