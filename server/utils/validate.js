/**
 * Validation Utility
 * Simple schema validation helpers
 * 
 * Note: For production, consider using Zod or Joi
 * This is a lightweight alternative
 */

/**
 * Validate required fields in an object
 * @param {object} data - Data to validate
 * @param {string[]} requiredFields - List of required field names
 * @returns {{valid: boolean, errors: string[]}}
 */
function validateRequired(data, requiredFields) {
  const errors = [];

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push(`${field} is required`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 * @param {string} url
 * @returns {boolean}
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate YouTube URL
 * @param {string} url
 * @returns {boolean}
 */
function isValidYouTubeUrl(url) {
  const patterns = [
    /youtube\.com\/watch\?v=[\w-]+/,
    /youtu\.be\/[\w-]+/,
    /youtube\.com\/shorts\/[\w-]+/
  ];
  return patterns.some(pattern => pattern.test(url));
}

/**
 * Validate TikTok URL
 * @param {string} url
 * @returns {boolean}
 */
function isValidTikTokUrl(url) {
  const patterns = [
    /tiktok\.com\/@[\w.-]+\/video\/\d+/,
    /vm\.tiktok\.com\/[\w]+/,
    /vt\.tiktok\.com\/[\w]+/
  ];
  return patterns.some(pattern => pattern.test(url));
}

/**
 * Validate video URL (YouTube or TikTok)
 * @param {string} url
 * @returns {{valid: boolean, platform: string|null}}
 */
function validateVideoUrl(url) {
  if (isValidYouTubeUrl(url)) {
    return { valid: true, platform: 'youtube' };
  }
  if (isValidTikTokUrl(url)) {
    return { valid: true, platform: 'tiktok' };
  }
  return { valid: false, platform: null };
}

/**
 * Validate string length
 * @param {string} str
 * @param {number} min
 * @param {number} max
 * @returns {boolean}
 */
function isValidLength(str, min, max) {
  return typeof str === 'string' && str.length >= min && str.length <= max;
}

/**
 * Sanitize string (remove HTML tags)
 * @param {string} str
 * @returns {string}
 */
function sanitizeString(str) {
  if (typeof str !== 'string') {
    return str;
  }
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Validate object structure
 * @param {object} data
 * @param {object} schema - { fieldName: { type: 'string', required: true, minLength: 1 } }
 * @returns {{valid: boolean, errors: string[]}}
 */
function validateSchema(data, schema) {
  const errors = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    // Check required
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      continue;
    }

    // Skip further validation if not required and value is empty
    if (value === undefined || value === null || value === '') {
      continue;
    }

    // Check type
    if (rules.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rules.type) {
        errors.push(`${field} must be of type ${rules.type}`);
        continue;
      }
    }

    // Check string length
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters`);
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${field} must be at most ${rules.maxLength} characters`);
      }
    }

    // Check number range
    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push(`${field} must be at least ${rules.min}`);
      }
      if (rules.max !== undefined && value > rules.max) {
        errors.push(`${field} must be at most ${rules.max}`);
      }
    }

    // Check enum
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
    }

    // Check pattern
    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push(`${field} format is invalid`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateRequired,
  isValidEmail,
  isValidUrl,
  isValidYouTubeUrl,
  isValidTikTokUrl,
  validateVideoUrl,
  isValidLength,
  sanitizeString,
  validateSchema
};
