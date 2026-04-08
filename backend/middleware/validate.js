const { validationResult } = require('express-validator');

// Validate request using express-validator
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Async error handler wrapper
exports.asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
exports.AppError = AppError;

// Pagination helper
exports.paginate = (req) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// Build filter from query params
exports.buildFilter = (query, allowedFields) => {
  const filter = {};
  allowedFields.forEach(field => {
    if (query[field] !== undefined && query[field] !== '') {
      filter[field] = query[field];
    }
  });
  return filter;
};
