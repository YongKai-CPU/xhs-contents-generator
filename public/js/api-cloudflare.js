/**
 * API Client for Cloudflare Deployment
 * 
 * Updated API client that works with Cloudflare Workers + Railway backend
 * Handles authentication, CSRF tokens, and job polling
 * 
 * Usage:
 *   import { initAPI, createJob, getJobStatus } from './api-cloudflare.js';
 *   await initAPI();
 *   const job = await createJob(videoUrl);
 */

// API Base URL - Update this for your deployment
const API_BASE_URL = window.location.origin; // Uses current domain (Cloudflare Worker)

let csrfToken = null;
let isInitialized = false;

/**
 * Initialize API client
 * Fetches CSRF token for subsequent requests
 */
export async function initAPI() {
  if (isInitialized) {
    console.log('[API] Already initialized');
    return true;
  }

  try {
    console.log('[API] Initializing...');
    await fetchCSRFToken();
    isInitialized = true;
    console.log('[API] Initialized successfully');
    return true;
  } catch (error) {
    console.error('[API] Initialization failed:', error);
    return false;
  }
}

/**
 * Fetch CSRF token
 * Required for all state-changing operations
 */
async function fetchCSRFToken() {
  try {
    const response = await fetch(`${API_BASE_URL}/csrf-token`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch CSRF token: ${response.status}`);
    }

    const data = await response.json();
    csrfToken = data.token;

    console.log('[API] CSRF token fetched');

    // Store CSRF token in cookie for double-submit pattern
    document.cookie = `csrf_token=${csrfToken}; path=/; SameSite=Lax`;

    return csrfToken;
  } catch (error) {
    console.error('[API] CSRF fetch error:', error);
    throw error;
  }
}

/**
 * Create content generation job
 * @param {string} videoUrl - YouTube/TikTok video URL
 * @param {string} transcript - Optional manual transcript
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Job response
 */
export async function createJob(videoUrl, transcript = null, options = {}) {
  console.log('[API] Creating job...', { videoUrl, hasTranscript: !!transcript });

  try {
    const response = await fetch(`${API_BASE_URL}/api/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken || getCSRFTokenFromCookie()
      },
      credentials: 'include',
      body: JSON.stringify({ videoUrl, transcript, options })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('[API] Job created:', data.jobId);

    return data;
  } catch (error) {
    console.error('[API] Create job error:', error);
    throw error;
  }
}

/**
 * Get job status and results
 * @param {string} jobId - Job ID
 * @returns {Promise<Object>} Job status
 */
export async function getJobStatus(jobId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[API] Get job status error:', error);
    throw error;
  }
}

/**
 * Regenerate content with existing transcript
 * @param {string} jobId - Job ID
 * @param {Object} options - Regeneration options
 * @returns {Promise<Object>} Job response
 */
export async function regenerateJob(jobId, options = {}) {
  console.log('[API] Regenerating job...', jobId);

  try {
    const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/regenerate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken || getCSRFTokenFromCookie()
      },
      credentials: 'include',
      body: JSON.stringify({ options })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('[API] Regeneration started:', data.jobId);

    return data;
  } catch (error) {
    console.error('[API] Regenerate job error:', error);
    throw error;
  }
}

/**
 * Get current user info
 * @returns {Promise<Object|null>} User info or null
 */
export async function getCurrentUser() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user || null;
  } catch (error) {
    console.error('[API] Get current user error:', error);
    return null;
  }
}

/**
 * Logout user
 * @returns {Promise<void>}
 */
export async function logout() {
  try {
    await fetch(`${API_BASE_URL}/auth/sessionLogout`, {
      method: 'POST',
      credentials: 'include'
    });

    // Clear CSRF token
    csrfToken = null;
    document.cookie = 'csrf_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

    console.log('[API] Logged out');
  } catch (error) {
    console.error('[API] Logout error:', error);
    throw error;
  }
}

/**
 * Get CSRF token from cookie
 * @returns {string|null} CSRF token
 */
function getCSRFTokenFromCookie() {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrf_token') {
      return value;
    }
  }
  return null;
}

/**
 * Health check
 * @returns {Promise<Object>} Health status
 */
export async function healthCheck() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[API] Health check error:', error);
    throw error;
  }
}

/**
 * Readiness check
 * @returns {Promise<Object>} Readiness status
 */
export async function readinessCheck() {
  try {
    const response = await fetch(`${API_BASE_URL}/health/ready`, {
      method: 'GET'
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[API] Readiness check error:', error);
    throw error;
  }
}

/**
 * API Error class
 */
export class APIError extends Error {
  constructor(message, code, status) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.status = status;
  }
}
