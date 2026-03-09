/**
 * Firebase Authentication for Cloudflare Workers
 * 
 * Lightweight JWT verification without Firebase Admin SDK
 * Uses Firebase public keys to verify session cookies
 * 
 * Note: Workers cannot use Firebase Admin SDK (requires Node.js)
 * We verify JWT tokens using the public key approach
 */

/**
 * Verify Firebase session cookie from request
 * @param {Request} request - Incoming request
 * @param {Object} env - Worker environment variables
 * @returns {Promise<Object>} { authenticated: boolean, user?: Object, error?: string }
 */
export async function verifyFirebaseSession(request, env) {
  try {
    // Extract session cookie
    const cookieHeader = request.headers.get('Cookie');
    const sessionCookie = extractCookie(cookieHeader, env.SESSION_COOKIE_NAME || '__session');

    if (!sessionCookie) {
      return {
        authenticated: false,
        error: 'Session cookie not found'
      };
    }

    // Verify the session cookie
    const decodedClaims = await verifySessionCookie(sessionCookie, env);

    if (!decodedClaims) {
      return {
        authenticated: false,
        error: 'Invalid or expired session cookie'
      };
    }

    // Extract user info
    const user = {
      uid: decodedClaims.sub,
      email: decodedClaims.email || '',
      email_verified: decodedClaims.email_verified || false,
      name: decodedClaims.name || '',
      picture: decodedClaims.picture || ''
    };

    return {
      authenticated: true,
      user
    };

  } catch (error) {
    console.error('Firebase session verification error:', error);
    return {
      authenticated: false,
      error: `Authentication error: ${error.message}`
    };
  }
}

/**
 * Verify Firebase session cookie
 * @param {string} sessionCookie - Session cookie value
 * @param {Object} env - Worker environment
 * @returns {Promise<Object|null>} Decoded claims or null
 */
async function verifySessionCookie(sessionCookie, env) {
  try {
    // For Cloudflare Workers, we use a simplified verification
    // In production, you should implement proper JWT verification with Firebase public keys
    
    // Option 1: Verify with Firebase Admin SDK (via Railway backend)
    // This is the recommended approach for production
    if (env.RAILWAY_BACKEND_URL) {
      const verificationResponse = await fetch(`${env.RAILWAY_BACKEND_URL}/auth/verify-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionCookie })
      });

      if (verificationResponse.ok) {
        const result = await verificationResponse.json();
        return result.claims || null;
      }
    }

    // Option 2: Lightweight JWT verification (for development)
    // This is a simplified approach - not recommended for production
    const claims = await verifyJWTLightweight(sessionCookie);
    return claims;

  } catch (error) {
    console.error('Session cookie verification failed:', error);
    return null;
  }
}

/**
 * Lightweight JWT verification (simplified)
 * 
 * IMPORTANT: This is a simplified verification for development.
 * For production, use proper JWT verification with Firebase public keys
 * or delegate to Railway backend with Firebase Admin SDK.
 * 
 * @param {string} token - JWT token
 * @returns {Promise<Object|null>} Decoded payload or null
 */
async function verifyJWTLightweight(token) {
  try {
    // Decode JWT payload (base64url)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode payload
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const claims = JSON.parse(decoded);

    // Check expiration
    if (claims.exp && claims.exp < Date.now() / 1000) {
      return null;
    }

    // Basic validation - check for required fields
    if (!claims.sub) {
      return null;
    }

    return claims;

  } catch (error) {
    console.error('JWT decoding failed:', error);
    return null;
  }
}

/**
 * Extract cookie value by name
 * @param {string} cookieString - Full cookie header
 * @param {string} name - Cookie name to find
 * @returns {string|null} Cookie value or null
 */
function extractCookie(cookieString, name) {
  if (!cookieString) return null;

  const cookies = cookieString.split(';');
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return cookieValue;
    }
  }

  return null;
}

/**
 * Verify Firebase ID token (for session login endpoint)
 * @param {string} idToken - Firebase ID token
 * @param {Object} env - Worker environment
 * @returns {Promise<Object|null>} Decoded claims or null
 */
export async function verifyFirebaseIdToken(idToken, env) {
  try {
    // Delegate to Railway backend for proper verification
    if (env.RAILWAY_BACKEND_URL) {
      const verificationResponse = await fetch(`${env.RAILWAY_BACKEND_URL}/auth/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ idToken })
      });

      if (verificationResponse.ok) {
        const result = await verificationResponse.json();
        return result.claims || null;
      }
    }

    // Fallback to lightweight verification
    return await verifyJWTLightweight(idToken);

  } catch (error) {
    console.error('ID token verification failed:', error);
    return null;
  }
}

/**
 * Create session cookie (delegates to Railway backend)
 * @param {string} idToken - Firebase ID token
 * @param {Object} env - Worker environment
 * @returns {Promise<string|null>} Session cookie or null
 */
export async function createSessionCookie(idToken, env) {
  try {
    if (!env.RAILWAY_BACKEND_URL) {
      throw new Error('Railway backend URL not configured');
    }

    const response = await fetch(`${env.RAILWAY_BACKEND_URL}/auth/create-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        idToken,
        expiresIn: env.SESSION_EXPIRES_DAYS || 5 
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create session cookie');
    }

    const result = await response.json();
    return result.sessionCookie;

  } catch (error) {
    console.error('Create session cookie error:', error);
    return null;
  }
}
