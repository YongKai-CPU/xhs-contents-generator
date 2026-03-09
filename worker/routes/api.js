/**
 * API Request Handler for Cloudflare Workers
 * 
 * Routes API requests to Railway backend
 * Handles job creation, status checks, and content generation
 * 
 * All heavy processing (video download, transcription, AI generation)
 * is delegated to the Railway backend server
 */

/**
 * Handle API request
 * @param {Request} request - Incoming request
 * @param {Object} env - Worker environment
 * @param {ExecutionContext} ctx - Execution context
 * @param {Object} user - Authenticated user info
 * @returns {Promise<Response>} Response
 */
export async function handleAPIRequest(request, env, ctx, user) {
  const url = new URL(request.url);
  const path = url.pathname;

  try {
    // Route handling
    if (path === '/api/jobs' && request.method === 'POST') {
      return await handleCreateJob(request, env, ctx, user);
    }

    if (path.match(/^\/api\/jobs\/[a-zA-Z0-9-]+$/) && request.method === 'GET') {
      const jobId = path.split('/').pop();
      return await handleGetJobStatus(request, env, ctx, user, jobId);
    }

    if (path.match(/^\/api\/jobs\/[a-zA-Z0-9-]+\/regenerate$/) && request.method === 'POST') {
      const jobId = path.split('/')[3];
      return await handleRegenerateJob(request, env, ctx, user, jobId);
    }

    // Default: proxy to Railway backend
    return await proxyToBackend(request, env, path);

  } catch (error) {
    console.error('API handler error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Internal server error'
        }
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Handle job creation
 * POST /api/jobs
 */
async function handleCreateJob(request, env, ctx, user) {
  try {
    // Parse request body
    const body = await request.json();
    const { videoUrl, transcript, options = {} } = body;

    // Validate input
    if (!videoUrl && !transcript) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'MISSING_INPUT',
            message: 'videoUrl or transcript is required'
          }
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Add user info to request
    const modifiedBody = {
      ...body,
      _user: user,
      _timestamp: new Date().toISOString()
    };

    // Proxy to Railway backend
    const backendUrl = env.RAILWAY_BACKEND_URL;
    if (!backendUrl) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'BACKEND_NOT_CONFIGURED',
            message: 'Railway backend URL not configured'
          }
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const backendRequest = new Request(`${backendUrl}/api/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-UID': user.uid,
        'X-User-Email': user.email || '',
        'X-User-Name': user.name || '',
        'X-CSRF-Token': request.headers.get('X-CSRF-Token') || ''
      },
      body: JSON.stringify(modifiedBody)
    });

    const response = await fetch(backendRequest);
    const data = await response.json();

    // Add rate limit headers if available
    const headers = new Headers({
      'Content-Type': 'application/json'
    });

    if (response.ok) {
      console.log(`Job created: ${data.jobId} for user ${user.uid}`);
    }

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers
    });

  } catch (error) {
    console.error('Create job error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to create job'
        }
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Handle job status check
 * GET /api/jobs/:id
 */
async function handleGetJobStatus(request, env, ctx, user, jobId) {
  try {
    const backendUrl = env.RAILWAY_BACKEND_URL;
    if (!backendUrl) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'BACKEND_NOT_CONFIGURED',
            message: 'Railway backend URL not configured'
          }
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const backendRequest = new Request(`${backendUrl}/api/jobs/${jobId}`, {
      method: 'GET',
      headers: {
        'X-User-UID': user.uid,
        'X-User-Email': user.email || ''
      }
    });

    const response = await fetch(backendRequest);
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get job status error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to get job status'
        }
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Handle job regeneration
 * POST /api/jobs/:id/regenerate
 */
async function handleRegenerateJob(request, env, ctx, user, jobId) {
  try {
    const body = await request.json();
    const backendUrl = env.RAILWAY_BACKEND_URL;

    if (!backendUrl) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'BACKEND_NOT_CONFIGURED',
            message: 'Railway backend URL not configured'
          }
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const backendRequest = new Request(`${backendUrl}/api/jobs/${jobId}/regenerate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-UID': user.uid,
        'X-User-Email': user.email || '',
        'X-CSRF-Token': request.headers.get('X-CSRF-Token') || ''
      },
      body: JSON.stringify({
        ...body,
        _user: user
      })
    });

    const response = await fetch(backendRequest);
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Regenerate job error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to regenerate job'
        }
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

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
        headers: { 'Content-Type': 'application/json' }
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

    // Clone response with CORS headers
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText
    });

    // Copy headers except connection-related ones
    response.headers.forEach((value, key) => {
      if (!['connection', 'transfer-encoding', 'content-length'].includes(key.toLowerCase())) {
        newResponse.headers.set(key, value);
      }
    });

    return newResponse;

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
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
