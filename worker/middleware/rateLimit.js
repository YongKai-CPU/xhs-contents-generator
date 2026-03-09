/**
 * Rate Limiting Middleware for Cloudflare Workers
 * 
 * Uses Cloudflare KV storage to track request counts
 * Prevents API abuse and ensures fair usage
 * 
 * Configuration:
 * - RATE_LIMIT_REQUESTS: Max requests per window (default: 100)
 * - RATE_LIMIT_WINDOW: Time window in seconds (default: 3600 = 1 hour)
 */

/**
 * Rate limit result
 * @typedef {Object} RateLimitResult
 * @property {boolean} allowed - Whether request is allowed
 * @property {number} remaining - Remaining requests in window
 * @property {number} reset - Unix timestamp when window resets
 * @property {number} limit - Total requests allowed per window
 */

/**
 * Check rate limit for a user
 * @param {string} userId - User identifier (UID or IP)
 * @param {Object} env - Worker environment with KV binding
 * @returns {Promise<RateLimitResult>} Rate limit status
 */
export async function checkRateLimit(userId, env) {
  const limit = parseInt(env.RATE_LIMIT_REQUESTS || '100', 10);
  const windowSeconds = parseInt(env.RATE_LIMIT_WINDOW || '3600', 10);
  const now = Math.floor(Date.now() / 1000);
  
  // KV binding check
  if (!env.RATE_LIMITER) {
    console.warn('RATE_LIMITER KV not configured - allowing request');
    return {
      allowed: true,
      remaining: limit,
      reset: now + windowSeconds,
      limit
    };
  }

  try {
    const key = `rate_limit:${userId}`;
    
    // Get current count
    const data = await env.RATE_LIMITER.get(key, 'json');
    
    if (!data) {
      // First request in window
      await env.RATE_LIMITER.put(
        key,
        JSON.stringify({ count: 1, windowStart: now }),
        { expirationTtl: windowSeconds }
      );
      
      return {
        allowed: true,
        remaining: limit - 1,
        reset: now + windowSeconds,
        limit
      };
    }

    const { count, windowStart } = data;

    // Check if window has expired
    if (now - windowStart >= windowSeconds) {
      // Reset window
      await env.RATE_LIMITER.put(
        key,
        JSON.stringify({ count: 1, windowStart: now }),
        { expirationTtl: windowSeconds }
      );
      
      return {
        allowed: true,
        remaining: limit - 1,
        reset: now + windowSeconds,
        limit
      };
    }

    // Check if limit exceeded
    if (count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        reset: windowStart + windowSeconds,
        limit
      };
    }

    // Increment count
    await env.RATE_LIMITER.put(
      key,
      JSON.stringify({ count: count + 1, windowStart }),
      { expirationTtl: windowSeconds }
    );

    return {
      allowed: true,
      remaining: limit - count - 1,
      reset: windowStart + windowSeconds,
      limit
    };

  } catch (error) {
    console.error('Rate limit check error:', error);
    // Fail open - allow request if rate limiting fails
    return {
      allowed: true,
      remaining: limit,
      reset: now + windowSeconds,
      limit
    };
  }
}

/**
 * Rate limiting middleware
 * @param {Request} request - Incoming request
 * @param {Object} env - Worker environment
 * @returns {Promise<{allowed: boolean, result?: RateLimitResult}>}
 */
export async function rateLimitMiddleware(request, env) {
  // Check if rate limiting is enabled
  if (env.RATE_LIMIT_ENABLED !== 'true') {
    return { allowed: true };
  }

  // Extract user identifier
  const userId = await getUserIdFromRequest(request);

  // Check rate limit
  const result = await checkRateLimit(userId, env);

  return {
    allowed: result.allowed,
    result
  };
}

/**
 * Extract user identifier from request
 * @param {Request} request - Incoming request
 * @returns {Promise<string>} User identifier
 */
async function getUserIdFromRequest(request) {
  // Try to get user ID from headers (set by auth middleware)
  const userUid = request.headers.get('X-User-UID');
  if (userUid) {
    return `user:${userUid}`;
  }

  // Try to get session cookie
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const sessionCookie = extractCookie(cookieHeader, '__session');
    if (sessionCookie) {
      // Hash session cookie for privacy
      const hash = await hashString(sessionCookie);
      return `session:${hash}`;
    }
  }

  // Fallback to IP address
  const ip = request.headers.get('CF-Connecting-IP') || 
             request.headers.get('X-Forwarded-For') ||
             'unknown';
  
  return `ip:${ip}`;
}

/**
 * Extract cookie value by name
 * @param {string} cookieString - Full cookie header
 * @param {string} name - Cookie name
 * @returns {string|null} Cookie value
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
 * Simple string hash function
 * @param {string} str - String to hash
 * @returns {Promise<string>} Hash value
 */
async function hashString(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Get rate limit headers to include in response
 * @param {RateLimitResult} result - Rate limit result
 * @returns {Object} Headers object
 */
export function getRateLimitHeaders(result) {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString()
  };
}
