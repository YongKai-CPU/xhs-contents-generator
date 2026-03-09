/**
 * Authentication Middleware
 * Verifies Firebase session cookies and attaches user to request
 */

const { getAuth } = require('../utils/firebaseAdmin');

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || '__session';

/**
 * Middleware to require authentication
 * Verifies session cookie and attaches decoded user claims to req.user
 */
async function requireAuth(req, res, next) {
  try {
    const sessionCookie = req.cookies[SESSION_COOKIE_NAME];

    if (!sessionCookie) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Session cookie not found. Please log in.'
        }
      });
    }

    const auth = getAuth();
    if (!auth) {
      // Firebase not configured - allow in demo mode
      console.warn('Firebase Admin not configured - allowing request in demo mode');
      req.user = {
        uid: 'demo-user',
        email: 'demo@example.com',
        isDemo: true
      };
      return next();
    }

    // Verify session cookie
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

    // Attach user to request
    req.user = {
      uid: decodedClaims.sub,
      email: decodedClaims.email,
      email_verified: decodedClaims.email_verified,
      name: decodedClaims.name,
      picture: decodedClaims.picture,
      firebase: decodedClaims
    };

    next();

  } catch (error) {
    console.error('Auth middleware error:', error.message);

    // Session cookie invalid or expired
    if (error.code === 'auth/invalid-session-cookie' ||
        error.code === 'auth/session-cookie-expired' ||
        error.code === 'auth/argument-error') {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired session. Please log in again.'
        }
      });
    }

    // Other errors
    return res.status(500).json({
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication error: ' + error.message
      }
    });
  }
}

/**
 * Optional auth middleware - attaches user if logged in, but doesn't block
 * Useful for endpoints that behave differently for logged-in users
 */
async function optionalAuth(req, res, next) {
  try {
    const sessionCookie = req.cookies[SESSION_COOKIE_NAME];

    if (!sessionCookie) {
      return next();
    }

    const auth = getAuth();
    if (!auth) {
      return next();
    }

    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

    req.user = {
      uid: decodedClaims.sub,
      email: decodedClaims.email,
      email_verified: decodedClaims.email_verified,
      name: decodedClaims.name,
      picture: decodedClaims.picture,
      firebase: decodedClaims
    };

  } catch (error) {
    // Silently ignore auth errors for optional auth
    console.debug('Optional auth failed:', error.message);
  }

  next();
}

/**
 * Get user info from session cookie
 * Returns user profile or null if not authenticated
 */
async function getUserFromSession(sessionCookie) {
  if (!sessionCookie) {
    return null;
  }

  const auth = getAuth();
  if (!auth) {
    return null;
  }

  try {
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    return {
      uid: decodedClaims.sub,
      email: decodedClaims.email,
      email_verified: decodedClaims.email_verified,
      name: decodedClaims.name,
      picture: decodedClaims.picture
    };
  } catch (error) {
    return null;
  }
}

module.exports = {
  requireAuth,
  optionalAuth,
  getUserFromSession,
  SESSION_COOKIE_NAME
};
