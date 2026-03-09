/**
 * API Client
 * Fetch helpers with CSRF token support
 */

let csrfToken = null;

/**
 * Fetch CSRF token from server
 */
export async function fetchCSRFToken() {
  try {
    const response = await fetch('/csrf-token', {
      credentials: 'include'
    });
    const data = await response.json();
    csrfToken = data.token;
    return csrfToken;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    return null;
  }
}

/**
 * Get current CSRF token
 */
export function getCSRFToken() {
  return csrfToken;
}

/**
 * API fetch wrapper with auth and CSRF
 */
export async function apiFetch(url, options = {}) {
  console.log('[API] Fetching:', url, 'Method:', options.method);
  
  // Ensure we have a CSRF token for state-changing requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method)) {
    if (!csrfToken) {
      console.log('[API] Fetching CSRF token...');
      await fetchCSRFToken();
      console.log('[API] CSRF token:', csrfToken ? '✅' : '❌');
    }
  }

  const defaultHeaders = {
    'Content-Type': 'application/json'
  };

  // Add CSRF token header for state-changing requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method)) {
    defaultHeaders['X-CSRF-Token'] = csrfToken;
    console.log('[API] Headers:', JSON.stringify(defaultHeaders));
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {})
    },
    credentials: 'include'
  };

  try {
    console.log('[API] Sending request...');
    const response = await fetch(url, config);
    console.log('[API] Response status:', response.status);

    // Handle 401 Unauthorized
    if (response.status === 401) {
      console.error('[API] 401 Unauthorized - Session expired');
      window.authFunctions?.handleSessionExpired?.();
      throw new Error('Session expired. Please log in again.');
    }

    const data = await response.json();
    console.log('[API] Response data:', data);

    if (!response.ok) {
      console.error('[API] Error response:', data);
      throw new Error(data.error?.message || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('[API] Fetch error:', error);
    throw error;
  }
}

/**
 * Create a new content generation job
 */
export async function createJob(videoUrl, transcript = null, options = {}) {
  return apiFetch('/api/jobs', {
    method: 'POST',
    body: JSON.stringify({ videoUrl, transcript, options })
  });
}

/**
 * Get job status
 */
export async function getJobStatus(jobId) {
  return apiFetch(`/api/jobs/${jobId}`);
}

/**
 * Regenerate content
 */
export async function regenerateJob(jobId, options = {}) {
  return apiFetch(`/api/jobs/${jobId}/regenerate`, {
    method: 'POST',
    body: JSON.stringify({ options })
  });
}

/**
 * Get current user info
 */
export async function getCurrentUser() {
  return apiFetch('/auth/me');
}

/**
 * Login with Firebase ID token
 */
export async function sessionLogin(idToken) {
  if (!csrfToken) {
    await fetchCSRFToken();
  }

  const response = await fetch('/auth/sessionLogin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken
    },
    credentials: 'include',
    body: JSON.stringify({ idToken })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Login failed');
  }

  return data;
}

/**
 * Logout
 */
export async function sessionLogout() {
  if (!csrfToken) {
    await fetchCSRFToken();
  }

  const response = await fetch('/auth/sessionLogout', {
    method: 'POST',
    headers: {
      'X-CSRF-Token': csrfToken
    },
    credentials: 'include'
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Logout failed');
  }

  return data;
}

/**
 * Get auth status
 */
export async function getAuthStatus() {
  const response = await fetch('/auth/status');
  return response.json();
}

// Initialize CSRF token on load
fetchCSRFToken();
