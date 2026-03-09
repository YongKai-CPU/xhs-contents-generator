/**
 * Central Error Handler Middleware
 * Catches all errors and formats responses consistently
 */

const config = require('../config/env');

/**
 * 404 Not Found Handler
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
}

/**
 * Global Error Handler
 * Handles all errors from route handlers and middleware
 */
function errorHandler(err, req, res, next) {
  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: config.isDevelopment ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message,
        details: err.details
      }
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: err.message
      }
    });
  }

  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    return res.status(503).json({
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'External service unavailable. Please try again later.'
      }
    });
  }

  // Handle Firebase errors
  if (err.code && err.code.startsWith('auth/')) {
    return res.status(401).json({
      error: {
        code: 'AUTH_ERROR',
        message: err.message
      }
    });
  }

  // Handle AI API errors
  if (err.code === 'AI_API_ERROR') {
    return res.status(502).json({
      error: {
        code: 'AI_SERVICE_ERROR',
        message: err.message
      }
    });
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  const errorCode = err.code || 'INTERNAL_ERROR';

  res.status(statusCode).json({
    error: {
      code: errorCode,
      message: config.isDevelopment ? err.message : 'An unexpected error occurred',
      ...(config.isDevelopment && { stack: err.stack })
    }
  });
}

/**
 * Async handler wrapper to catch promise rejections
 * Usage: app.get('/route', asyncHandler(handler))
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  notFoundHandler,
  errorHandler,
  asyncHandler
};
