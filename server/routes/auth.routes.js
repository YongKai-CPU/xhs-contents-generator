/**
 * Authentication Routes
 * Handles Firebase session cookie creation, deletion, and user info
 */

const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const authController = require('../controllers/auth.controller');

const router = express.Router();

/**
 * POST /auth/sessionLogin
 * Creates a session cookie from Firebase ID token
 * 
 * Request body: { idToken: string }
 * Response: { status: 'ok', user: { uid, email, displayName } }
 */
router.post('/sessionLogin', asyncHandler(authController.sessionLogin));

/**
 * POST /auth/sessionLogout
 * Clears the session cookie
 * 
 * Response: { status: 'ok' }
 */
router.post('/sessionLogout', asyncHandler(authController.sessionLogout));

/**
 * GET /auth/me
 * Returns current user info if logged in
 * 
 * Response: { uid, email, displayName, picture } or 401
 */
router.get('/me', asyncHandler(authController.getCurrentUser));

/**
 * GET /auth/status
 * Returns auth configuration status (for debugging)
 */
router.get('/status', asyncHandler(authController.getAuthStatus));

module.exports = router;
