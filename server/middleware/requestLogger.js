/**
 * Request Logger Middleware
 * Logs all incoming requests for debugging and monitoring
 */

const config = require('../config/env');

// Skip logging for static files and health checks
const skipPaths = [
  '/health',
  '/favicon.ico',
  /\.css$/,
  /\.js$/,
  /\.svg$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.gif$/
];

function shouldSkipLogging(path) {
  return skipPaths.some(pattern => {
    if (pattern.startsWith('.')) {
      return new RegExp(pattern).test(path);
    }
    return path === pattern;
  });
}

/**
 * Request Logger Middleware
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  // Skip logging for static files in production
  if (config.isProduction && shouldSkipLogging(originalUrl)) {
    return next();
  }

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    // Determine log level based on status code
    let logLevel = 'info';
    if (statusCode >= 500) {
      logLevel = 'error';
    } else if (statusCode >= 400) {
      logLevel = 'warn';
    }

    const logMessage = {
      timestamp: new Date().toISOString(),
      method,
      path: originalUrl,
      status: statusCode,
      duration: `${duration}ms`,
      ip,
      userId: req.user?.uid || 'anonymous'
    };

    // Log based on level
    if (logLevel === 'error') {
      console.error('❌', JSON.stringify(logMessage));
    } else if (logLevel === 'warn') {
      console.warn('⚠️', JSON.stringify(logMessage));
    } else {
      console.log('✅', JSON.stringify(logMessage));
    }
  });

  next();
}

/**
 * Log successful operations
 */
function logSuccess(message, data = {}) {
  console.log('✅', message, data);
}

/**
 * Log warnings
 */
function logWarning(message, data = {}) {
  console.warn('⚠️', message, data);
}

/**
 * Log errors
 */
function logError(message, error) {
  console.error('❌', message, error);
}

module.exports = {
  requestLogger,
  logSuccess,
  logWarning,
  logError
};
