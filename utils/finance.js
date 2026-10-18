const { ApiError } = require("./apiError");
const MAX_AMOUNT = 1000000000;
const validAmount = (value) =>
    typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0 &&
    value <= MAX_AMOUNT &&
    /^(?:\d+)(?:\.\d{1,2})?$/.test(String(value));
const invalidData = () =>
    new ApiError(
        422,
        "DATA_INTEGRITY_ERROR",
        "Stored financial data needs review before this report can be calculated. No records were changed.",
    );
function minorToNumber(value) {
    const n = Number(value?.toString() ?? 0);
    if (!Number.isSafeInteger(n)) throw invalidData();
    return n / 100;
}
function parseDate(value, end = false) {
    if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2}))?$/.test(
            value,
        )
    )
        throw new ApiError(
            400,
            "VALIDATION_ERROR",
            "Use an ISO date or timestamp with an explicit timezone.",
        );
    const date = new Date(value);
    if (
        !Number.isFinite(date.getTime()) ||
        new Date(value.slice(0, 10)).toISOString().slice(0, 10) !==
            value.slice(0, 10)
    )
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid date.");
    if (value.length === 10 && end) date.setUTCDate(date.getUTCDate() + 1);
    return date;
}
function dateWindow(query = {}, now = new Date()) {
    const { startDate, endDate, period = "month" } = query;
    if (startDate || endDate) {
        const range = {};
        if (startDate) range.$gte = parseDate(startDate);
        if (endDate)
            range[endDate.length === 10 ? "$lt" : "$lte"] = parseDate(
                endDate,
                true,
            );
        if (
            range.$gte &&
            (range.$lt || range.$lte) &&
            range.$gte >= (range.$lt || range.$lte) &&
            !(range.$lte && +range.$gte === +range.$lte)
        )
            throw new ApiError(
                400,
                "VALIDATION_ERROR",
                "Start date must not follow end date.",
            );
        return range;
    }
    let start;
    if (period === "week") start = new Date(+now - 7 * 86400000);
    else if (period === "month")
        start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    else if (period === "year")
        start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    else
        throw new ApiError(
            400,
            "VALIDATION_ERROR",
            "Period must be week, month or year.",
        );
    return { $gte: start, $lte: now };
}
module.exports = {
    MAX_AMOUNT,
    validAmount,
    invalidData,
    minorToNumber,
    parseDate,
    dateWindow,
};
