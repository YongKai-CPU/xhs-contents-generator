/**
 * Cloudflare Worker - API Gateway & Telegram Bot
 * 
 * This Worker handles:
 * - Authentication verification (Firebase JWT)
 * - API routing/proxying to Railway backend
 * - Rate limiting
 * - Telegram bot webhook
 * - CORS headers
 * 
 * Heavy processing (video download, Whisper, ffmpeg) is forwarded to Railway backend
 */

// Import modules
import { verifyFirebaseSession } from './auth/firebase.js';
import { checkRateLimit, rateLimitMiddleware } from './middleware/rateLimit.js';
import { handleAPIRequest } from './routes/api.js';
import { handleTelegramWebhook } from './routes/telegram.js';

// CORS headers for all responses
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-Token, Authorization, X-User-UID, X-Session-Token',
  'Access-Control-Max-Age': '86400',
};

/**
 * Main Worker entry point
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Log request for debugging
    console.log(`[${method}] ${path}`);

    try {
      // Handle CORS preflight requests
      if (method === 'OPTIONS') {
        return new Response(null, { 
          status: 204,
          headers: CORS_HEADERS 
        });
      }

      // ============================================
      // Telegram Webhook Handler
      // ============================================
      if (path.startsWith('/telegram/webhook') || path.startsWith('/telegram/')) {
        const response = await handleTelegramWebhook(request, env, ctx);
        return addCorsHeaders(response);
      }

      // ============================================
      // Health Check Endpoints
      // ============================================
      if (path === '/health' || path === '/health/') {
        return new Response(
          JSON.stringify({ 
            status: 'ok', 
            worker: 'cloudflare',
            timestamp: new Date().toISOString()
          }), 
          {
            status: 200,
            headers: { 
              'Content-Type': 'application/json',
              ...CORS_HEADERS 
            }
          }
        );
      }

      if (path === '/health/ready') {
        // Check if backend is reachable
        const backendUrl = env.RAILWAY_BACKEND_URL || 'https://localhost:3000';
        try {
          const healthCheck = await fetch(`${backendUrl}/health`, { 
            method: 'GET',
            timeout: 5000 
          });
          
          if (healthCheck.ok) {
            return new Response(
              JSON.stringify({ 
                status: 'ready',
                worker: 'cloudflare',
                backend: 'connected'
              }), 
              {
                status: 200,
                headers: { 
                  'Content-Type': 'application/json',
                  ...CORS_HEADERS 
                }
              }
            );
          }
        } catch (e) {
          // Backend not reachable
        }

        return new Response(
          JSON.stringify({ 
            status: 'not_ready',
            worker: 'cloudflare',
            backend: 'disconnected'
          }), 
          {
            status: 503,
            headers: { 
              'Content-Type': 'application/json',
              ...CORS_HEADERS 
            }
          }
        );
      }

      if (path === '/health/info') {
        return new Response(
          JSON.stringify({ 
            version: '4.0.0',
            worker: 'cloudflare',
            features: {
              auth: 'firebase',
              processing: 'railway',
              storage: 'r2',
              database: 'supabase'
            }
          }), 
          {
            status: 200,
            headers: { 
              'Content-Type': 'application/json',
              ...CORS_HEADERS 
            }
          }
        );
      }

      // ============================================
      // CSRF Token Endpoint (Public)
      // ============================================
      if (path === '/csrf-token') {
        const csrfToken = crypto.randomUUID();
        
        const response = new Response(
          JSON.stringify({ token: csrfToken }),
          {
            status: 200,
            headers: { 
              'Content-Type': 'application/json',
              ...CORS_HEADERS 
            }
          }
        );

        // Set CSRF cookie
        response.headers.set(
          'Set-Cookie',
          `csrf_token=${csrfToken}; Path=/; Max-Age=86400; SameSite=Lax`
        );

        return response;
      }

      // ============================================
      // Auth Endpoints (Public)
      // ============================================
      if (path.startsWith('/auth/')) {
        // Proxy auth requests to Railway backend
        return await proxyToBackend(request, env, path);
      }

      // ============================================
      // API Routes (Protected)
      // ============================================
      if (path.startsWith('/api/')) {
        // Apply rate limiting
        const rateLimitResult = await rateLimitMiddleware(request, env);
        if (!rateLimitResult.allowed) {
          return new Response(
            JSON.stringify({ 
              error: { 
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests. Please try again later.'
              } 
            }),
            {
              status: 429,
              headers: { 
                'Content-Type': 'application/json',
                ...CORS_HEADERS,
                'Retry-After': '60'
              }
            }
          );
        }

        // Verify authentication
        const authResult = await verifyFirebaseSession(request, env);
        
        if (!authResult.authenticated) {
          return new Response(
            JSON.stringify({ 
              error: { 
                code: 'UNAUTHORIZED',
                message: authResult.error || 'Authentication required'
              } 
            }),
            {
              status: 401,
              headers: { 
                'Content-Type': 'application/json',
                ...CORS_HEADERS 
              }
            }
          );
        }

        // Add user info to headers for backend
        const modifiedRequest = new Request(request);
        modifiedRequest.headers.set('X-User-UID', authResult.user.uid);
        modifiedRequest.headers.set('X-User-Email', authResult.user.email || '');
        modifiedRequest.headers.set('X-User-Name', authResult.user.name || '');

        // Handle API request
        return await handleAPIRequest(modifiedRequest, env, ctx, authResult.user);
      }

      // ============================================
      // Frontend (Cloudflare Pages)
      // ============================================
      // Static assets are served by Cloudflare Pages
      // This fallback is for API-only Worker deployment
      return new Response(
        JSON.stringify({ 
          error: 'Not Found',
          message: 'Frontend is served by Cloudflare Pages'
        }),
        {
          status: 404,
          headers: { 
            'Content-Type': 'application/json',
            ...CORS_HEADERS 
          }
        }
      );

    } catch (error) {
      console.error('Worker error:', error);
      
      return new Response(
        JSON.stringify({ 
          error: { 
            code: 'INTERNAL_ERROR',
            message: error.message || 'Internal server error'
          } 
        }),
        {
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            ...CORS_HEADERS 
          }
        }
      );
    }
  }
};

/**
 * Proxy request to Railway backend
 */
async function proxyToBackend(request, env, path) {
  const backendUrl = env.RAILWAY_BACKEND_URL;
  
  if (!backendUrl) {
    return new Response(
      JSON.stringify({ 
        error: { 
          code: 'BACKEND_NOT_CONFIGURED',
          message: 'Railway backend URL not configured'
        } 
      }),
      {
        status: 503,
        headers: { 
          'Content-Type': 'application/json',
          ...CORS_HEADERS 
        }
      }
    );
  }

  try {
    // Clone request for backend
    const backendRequest = new Request(`${backendUrl}${path}`, {
      method: request.method,
      headers: request.headers,
      body: request.body
    });

    const response = await fetch(backendRequest);
    return addCorsHeaders(response);
    
  } catch (error) {
    console.error('Backend proxy error:', error);
    return new Response(
      JSON.stringify({ 
        error: { 
          code: 'BACKEND_ERROR',
          message: 'Failed to connect to backend'
        } 
      }),
      {
        status: 503,
        headers: { 
          'Content-Type': 'application/json',
          ...CORS_HEADERS 
        }
      }
    );
  }
}

/**
 * Add CORS headers to response
 */
function addCorsHeaders(response) {
  const newResponse = new Response(response.body, response);
  
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    newResponse.headers.set(key, value);
  });
  
  return newResponse;
}
