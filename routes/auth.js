/**
 * Authentication Routes
 * Handles Firebase session cookie creation, deletion, and user info
 */

const express = require('express');
const { getAuth } = require('../utils/firebaseAdmin');
const { requireAuth } = require('../middleware/auth');
const { CSRF_COOKIE_NAME } = require('../middleware/csrf');

const router = express.Router();

// Session cookie configuration
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || '__session';
const SESSION_EXPIRES_DAYS = parseInt(process.env.SESSION_EXPIRES_DAYS) || 5;
const COOKIE_SECURE = process.env.NODE_ENV === 'production';

/**
 * POST /auth/sessionLogin
 * Creates a session cookie from Firebase ID token
 * 
 * Request body: { idToken: string }
 * Response: { status: 'ok', user: { uid, email, displayName } }
 */
router.post('/sessionLogin', async (req, res) => {
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
        secure: COOKIE_SECURE,
        sameSite: 'lax',
        maxAge: SESSION_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
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
      expiresIn: SESSION_EXPIRES_DAYS * 24 * 60 * 60 * 1000 // 5 days
    });

    // Set cookie
    res.cookie(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: COOKIE_SECURE,
      sameSite: 'lax',
      maxAge: SESSION_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
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
});

/**
 * POST /auth/sessionLogout
 * Clears the session cookie
 * 
 * Response: { status: 'ok' }
 */
router.post('/sessionLogout', async (req, res) => {
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

    // Clear cookie
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
});

/**
 * GET /auth/me
 * Returns current user info if logged in
 * 
 * Response: { uid, email, displayName, picture } or 401
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    // User is already attached by requireAuth middleware
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
});

/**
 * GET /auth/status
 * Returns auth configuration status (for debugging)
 */
router.get('/status', async (req, res) => {
  const auth = getAuth();
  
  res.json({
    firebaseConfigured: !!auth,
    sessionCookieName: SESSION_COOKIE_NAME,
    sessionExpiresDays: SESSION_EXPIRES_DAYS,
    cookieSecure: COOKIE_SECURE,
    nodeEnv: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;
