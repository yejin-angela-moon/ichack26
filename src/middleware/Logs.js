const crypto = require("crypto");

function addRequestId(req, res, next) {
  req.id = crypto.randomUUID();
  res.setHeader("X-Request-Id", req.id);
  next();
}

const errorHandler = (err, req, res, next) => {
  const status = err.status && Number.isInteger(err.status) ? err.status : 500;

  console.error({
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    status,
    message: err.message,
    stack: err.stack,
    details: err.details,
  });

  const isProd = process.env.NODE_ENV === "production";

  res.status(status).json({
    info: "Error handler middleware response",
    error: {
      message: status === 500 && isProd ? "Internal Server Error" : err.message,
      // Include details only for “expected” errors or non-prod
      details: !isProd ? err.details : undefined,
      requestId: req.id,
    },
  });
};

module.exports = {
  addRequestId,
  errorHandler,
};