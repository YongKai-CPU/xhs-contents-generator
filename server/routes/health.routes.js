/**
 * Health Check Routes
 * System health and status endpoints
 */

const express = require('express');
const os = require('os');
const packageJson = require('../../package.json');

const router = express.Router();

/**
 * GET /health
 * Basic health check - returns 200 if server is running
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /health/ready
 * Readiness check - verifies all dependencies are available
 */
router.get('/ready', async (req, res) => {
  const checks = {
    database: true,
    firebase: false,
    ai: false
  };

  // Check Firebase
  try {
    const { getAdmin } = require('../config/firebaseAdmin');
    const admin = getAdmin();
    checks.firebase = !!admin;
  } catch (e) {
    checks.firebase = false;
  }

  // Check AI config
  const config = require('../config/env');
  checks.ai = !!config.ai.apiKey;

  const allHealthy = Object.values(checks).every(v => v === true);
  const status = allHealthy ? 'ready' : 'degraded';

  res.status(allHealthy ? 200 : 200).json({
    status,
    checks,
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /health/live
 * Liveness check - verifies server is responsive
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /health/info
 * Detailed system information
 */
router.get('/info', (req, res) => {
  const config = require('../config/env');
  
  res.json({
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description,
    environment: config.nodeEnv,
    platform: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      cpus: os.cpus().length,
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem()
      }
    },
    features: {
      auth: !!config.firebase.serviceAccountPath,
      ai: !!config.ai.apiKey
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
