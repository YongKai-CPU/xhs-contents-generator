/**
 * CSRF Protection Middleware
 * Implements double-submit cookie pattern for CSRF protection
 * 
 * How it works:
 * 1. Server generates a random token and sets it in a cookie (csrf_token)
 * 2. Frontend reads the token and sends it in X-CSRF-Token header
 * 3. Server compares cookie token with header token
 * 4. If they match, the request is legitimate
 */

const crypto = require('crypto');
const config = require('../config/env');

const CSRF_COOKIE_NAME = config.csrf.cookieName;
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Generate a random CSRF token
 */
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Middleware to generate and set CSRF token cookie
 * Call this on all GET requests to ensure token is available
 */
function generateCSRFToken(req, res, next) {
  // Only set token if it doesn't exist or if explicitly requested
  const existingToken = req.cookies[CSRF_COOKIE_NAME];
  
  if (!existingToken || req.path === '/csrf-token') {
    const newToken = generateToken();
    
    // Set cookie with appropriate options
    res.cookie(CSRF_COOKIE_NAME, newToken, {
      httpOnly: false, // Must be readable by JavaScript
      secure: config.session.cookieSecure,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/'
    });
    
    // If this is the /csrf-token endpoint, return the token
    if (req.path === '/csrf-token') {
      return res.json({ token: newToken });
    }
  }
  
  next();
}

/**
 * Middleware to validate CSRF token
 * Apply to state-changing requests (POST, PUT, DELETE, PATCH)
 */
function validateCSRFToken(req, res, next) {
  // Skip validation for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip validation for auth endpoints (they have their own protection)
  if (req.path.startsWith('/auth/')) {
    return next();
  }

  const cookieToken = req.cookies[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME];

  if (!cookieToken) {
    return res.status(403).json({
      error: {
        code: 'CSRF_MISSING_COOKIE',
        message: 'CSRF token cookie not found'
      }
    });
  }

  if (!headerToken) {
    return res.status(403).json({
      error: {
        code: 'CSRF_MISSING_HEADER',
        message: 'CSRF token header not found. Include X-CSRF-Token header.'
      }
    });
  }

  // Compare tokens using constant-time comparison
  if (!safeCompare(cookieToken, headerToken)) {
    return res.status(403).json({
      error: {
        code: 'CSRF_INVALID',
        message: 'Invalid CSRF token'
      }
    });
  }

  next();
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Get CSRF token from request
 */
function getCSRFToken(req) {
  return req.cookies[CSRF_COOKIE_NAME] || null;
}

module.exports = {
  generateCSRFToken,
  validateCSRFToken,
  getCSRFToken,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME
};
