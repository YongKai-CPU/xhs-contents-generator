/**
 * Auth Controller
 * Handles authentication logic for login, logout, and user info
 */

const { getAuth } = require('../config/firebaseAdmin');
const config = require('../config/env');

const SESSION_COOKIE_NAME = config.session.cookieName;
const CSRF_COOKIE_NAME = config.csrf.cookieName;

/**
 * Session Login
 * Creates a session cookie from Firebase ID token
 */
async function sessionLogin(req, res) {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        error: {
          code: 'MISSING_ID_TOKEN',
          message: 'idToken is required in request body'
        }
      });
    }

    const auth = getAuth();
    
    // If Firebase not configured, return demo session
    if (!auth) {
      console.warn('Firebase not configured - creating demo session');
      const demoUser = {
        uid: 'demo-user-' + Date.now(),
        email: 'demo@example.com',
        displayName: 'Demo User',
        isDemo: true
      };
      
      // Set demo session cookie
      res.cookie(SESSION_COOKIE_NAME, 'demo-session-' + demoUser.uid, {
        httpOnly: true,
        secure: config.session.cookieSecure,
        sameSite: 'lax',
        maxAge: config.session.expiresDays * 24 * 60 * 60 * 1000,
        path: '/'
      });
      
      return res.json({
        status: 'ok',
        user: demoUser
      });
    }

    // Verify the ID token
    const decodedClaims = await auth.verifyIdToken(idToken);
    
    // Create session cookie
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: config.session.expiresDays * 24 * 60 * 60 * 1000
    });

    // Set cookie
    res.cookie(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: config.session.cookieSecure,
      sameSite: 'lax',
      maxAge: config.session.expiresDays * 24 * 60 * 60 * 1000,
      path: '/'
    });

    // Return user info
    res.json({
      status: 'ok',
      user: {
        uid: decodedClaims.sub,
        email: decodedClaims.email,
        displayName: decodedClaims.name,
        picture: decodedClaims.picture,
        emailVerified: decodedClaims.email_verified
      }
    });

  } catch (error) {
    console.error('Session login error:', error);
    
    res.status(401).json({
      error: {
        code: 'SESSION_LOGIN_FAILED',
        message: 'Failed to create session: ' + error.message
      }
    });
  }
}

/**
 * Session Logout
 * Clears the session cookie
 */
async function sessionLogout(req, res) {
  try {
    const sessionCookie = req.cookies[SESSION_COOKIE_NAME];
    
    // If Firebase configured and we have a session, revoke refresh tokens
    if (sessionCookie) {
      const auth = getAuth();
      if (auth) {
        try {
          const decodedClaims = await auth.verifySessionCookie(sessionCookie);
          await auth.revokeRefreshTokens(decodedClaims.sub);
          console.log('Revoked refresh tokens for user:', decodedClaims.sub);
        } catch (e) {
          console.debug('Could not revoke tokens:', e.message);
        }
      }
    }

    // Clear cookies
    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    res.clearCookie(CSRF_COOKIE_NAME, { path: '/' });

    res.json({ status: 'ok' });

  } catch (error) {
    console.error('Session logout error:', error);
    
    // Still clear cookie even if revoke fails
    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    res.clearCookie(CSRF_COOKIE_NAME, { path: '/' });
    
    res.json({ status: 'ok' });
  }
}

/**
 * Get Current User
 * Returns current user info if logged in
 */
async function getCurrentUser(req, res) {
  try {
    // User is already attached by requireAuth middleware
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated. Please log in.'
        }
      });
    }

    res.json({
      uid: req.user.uid,
      email: req.user.email,
      displayName: req.user.name,
      picture: req.user.picture,
      emailVerified: req.user.email_verified,
      isDemo: req.user.isDemo || false
    });

  } catch (error) {
    console.error('Get user error:', error);

    res.status(500).json({
      error: {
        code: 'USER_FETCH_FAILED',
        message: 'Failed to get user info: ' + error.message
      }
    });
  }
}

/**
 * Get Auth Status
 * Returns auth configuration status
 */
async function getAuthStatus(req, res) {
  const auth = getAuth();
  
  res.json({
    firebaseConfigured: !!auth,
    sessionCookieName: SESSION_COOKIE_NAME,
    sessionExpiresDays: config.session.expiresDays,
    cookieSecure: config.session.cookieSecure,
    nodeEnv: config.nodeEnv
  });
}

module.exports = {
  sessionLogin,
  sessionLogout,
  getCurrentUser,
  getAuthStatus
};
