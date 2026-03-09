/**
 * AI Routes
 * Handles AI content generation endpoints
 */

const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const aiController = require('../controllers/ai.controller');
const { requireAuth } = require('../middleware/requireAuth');
const { validateCSRFToken } = require('../middleware/csrf');

const router = express.Router();

/**
 * POST /api/jobs
 * Create a new content generation job
 * 
 * Request body: { videoUrl?: string, transcript?: string, options?: object }
 * Response: { jobId, status, pollUrl }
 */
router.post('/jobs', 
  requireAuth, 
  validateCSRFToken, 
  asyncHandler(aiController.createJob)
);

/**
 * GET /api/jobs/:id
 * Get job status and results
 * 
 * Response: { id, status, progress, transcript?, output? }
 */
router.get('/jobs/:id', 
  requireAuth, 
  asyncHandler(aiController.getJobStatus)
);

/**
 * POST /api/jobs/:id/regenerate
 * Regenerate content with existing transcript
 * 
 * Request body: { options?: object }
 * Response: { jobId, status }
 */
router.post('/jobs/:id/regenerate',
  requireAuth,
  validateCSRFToken,
  asyncHandler(aiController.regenerateJob)
);

module.exports = router;
