exports.successResponse = (message, data = null) => ({
    success: "true",
    message,
    data
});

exports.errorResponse = (message, data = null) => ({
    success: "false",
    message,
    data
});