/**
 * Application Constants
 * Centralized constants for the application
 */

// Job status constants
const JOB_STATUS = {
  CREATED: 'CREATED',
  DOWNLOADING_AUDIO: 'DOWNLOADING_AUDIO',
  ASR_TRANSCRIBING: 'ASR_TRANSCRIBING',
  CLEANING_TRANSCRIPT: 'CLEANING_TRANSCRIPT',
  GENERATING_COPY: 'GENERATING_COPY',
  DONE: 'DONE',
  FAILED: 'FAILED'
};

// Platform constants
const PLATFORMS = {
  YOUTUBE: 'youtube',
  TIKTOK: 'tiktok',
  BILIBILI: 'bilibili',
  MANUAL: 'manual',
  UNKNOWN: 'unknown'
};

// Content style constants
const CONTENT_STYLES = {
  ZHONGCAO: '种草风',      // Recommendation style
  GANHUO: '干货风',        // Tutorial/Educational style
  ZHISHI: '真实分享风'     // Authentic sharing style
};

// API error codes
const ERROR_CODES = {
  // Authentication
  UNAUTHORIZED: 'UNAUTHORIZED',
  AUTH_ERROR: 'AUTH_ERROR',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_INPUT: 'MISSING_INPUT',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Resource
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  
  // Processing
  PROCESSING_ERROR: 'PROCESSING_ERROR',
  TIMEOUT: 'TIMEOUT',
  
  // External services
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  
  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  
  // Security
  CSRF_INVALID: 'CSRF_INVALID',
  CSRF_MISSING: 'CSRF_MISSING',
  
  // Rate limiting (not used but defined for future)
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
};

// HTTP status codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Cookie names
const COOKIES = {
  SESSION: '__session',
  CSRF: 'csrf_token'
};

// Header names
const HEADERS = {
  CSRF_TOKEN: 'X-CSRF-Token',
  AUTHORIZATION: 'Authorization',
  CONTENT_TYPE: 'Content-Type'
};

// Pagination defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
};

// File size limits
const FILE_LIMITS = {
  MAX_JSON_SIZE: '10mb',
  MAX_UPLOAD_SIZE: '50mb'
};

// Timeout values (in milliseconds)
const TIMEOUTS = {
  API_REQUEST: 30000,      // 30 seconds
  VIDEO_DOWNLOAD: 120000,  // 2 minutes
  TRANSCRIPTION: 300000,   // 5 minutes
  AI_GENERATION: 60000     // 1 minute
};

// Cache durations (in seconds)
const CACHE = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 3600,    // 1 hour
  LONG: 86400,     // 24 hours
  PERMANENT: 0     // No expiry
};

module.exports = {
  JOB_STATUS,
  PLATFORMS,
  CONTENT_STYLES,
  ERROR_CODES,
  HTTP_STATUS,
  COOKIES,
  HEADERS,
  PAGINATION,
  FILE_LIMITS,
  TIMEOUTS,
  CACHE
};
