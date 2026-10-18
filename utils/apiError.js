class ApiError extends Error {
    constructor(status, code, message) {
        super(message);
        this.status = status;
        this.code = code;
    }
}
const fail = (res, error) => {
    const known = error instanceof ApiError;
    const status = known
        ? error.status
        : error.name === "CastError" || error.name === "ValidationError"
          ? 400
          : 500;
    return res
        .status(status)
        .json({
            success: false,
            code: known
                ? error.code
                : status === 400
                  ? "VALIDATION_ERROR"
                  : "INTERNAL_ERROR",
            message: known
                ? error.message
                : status === 400
                  ? "Invalid request data."
                  : "Unable to complete the request. Please try again.",
        });
};
const validate = (schema, input) => {
    const { error, value } = schema.validate(input);
    if (error)
        throw new ApiError(
            400,
            "VALIDATION_ERROR",
            "Invalid request fields. Check the documented types and limits.",
        );
    return value;
};
module.exports = { ApiError, fail, validate };
