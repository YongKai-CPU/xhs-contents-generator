/**
 * Express Application Initialization
 * Sets up middleware, routes, and error handlers
 * 
 * Production-Ready v4.0 - Cloudflare + Railway + Supabase + R2
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');

// Import config
const config = require('./config/env');

// Import middleware
const { requestLogger } = require('./middleware/requestLogger');
const { generateCSRFToken, validateCSRFToken } = require('./middleware/csrf');
const { requireAuth } = require('./middleware/requireAuth');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth.routes');
const aiRoutes = require('./routes/ai.routes');
const webhookRoutes = require('./routes/webhook.routes');
const healthRoutes = require('./routes/health.routes');
const telegramRoutes = require('./routes/telegram.routes');

// Import database (SQLite for local, Supabase for production)
const { db } = require('../db/database');
const supabase = require('./db/supabase');

// Import R2 storage service
const r2Service = require('./services/r2.service');

/**
 * Create and configure Express app
 */
function createApp() {
  const app = express();

  // Trust proxy for production (behind reverse proxy/Cloudflare)
  app.set('trust proxy', 1);

  // CORS with credentials support
  // In production, restrict to specific origins
  const corsOrigins = process.env.CORS_ALLOWED_ORIGINS 
    ? process.env.CORS_ALLOWED_ORIGINS.split(',') 
    : true;

  app.use(cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'Authorization', 'X-User-UID', 'X-Session-Token']
  }));

  // JSON parser with limit
  app.use(express.json({ limit: config.paths.jsonLimit || '10mb' }));

  // URL-encoded parser
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Cookie parser (required for session cookies and CSRF)
  app.use(cookieParser());

  // Request logging
  app.use(requestLogger);

  // CSRF token generation on all requests
  app.use(generateCSRFToken);

  // Static files (disabled in production - served by Cloudflare Pages)
  if (config.nodeEnv === 'development') {
    app.use(express.static(path.join(__dirname, '..', 'public')));
  }

  // ============================================================
  // Public Routes (no auth required)
  // ============================================================

  // Health checks
  app.use('/health', healthRoutes);

  // CSRF token endpoint
  app.get('/csrf-token', (req, res) => {
    res.json({ token: req.cookies[config.csrf.cookieName] });
  });

  // Auth routes (login, logout, me) - NO CSRF required for login
  app.use('/auth', authRoutes);

  // Webhook routes (public, verified by signature)
  app.use('/webhooks', webhookRoutes);

  // Telegram Bot webhook (public)
  app.use('/telegram', telegramRoutes);

  // ============================================================
  // Protected API Routes (auth required)
  // ============================================================

  // All /api routes require authentication and CSRF validation
  app.use('/api', requireAuth);
  app.use('/api', validateCSRFToken);
  app.use('/api', aiRoutes);

  // ============================================================
  // Error Handling
  // ============================================================

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  return app;
}

/**
 * Start the server
 */
async function startServer() {
  try {
    console.log('\n🚀 Initializing Xiaohongshu Content Generator v4.0...\n');

    // Initialize primary database (Supabase for production, SQLite for local)
    let databaseInitialized = false;
    
    // Try Supabase first (production)
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      try {
        supabase.initSupabase();
        console.log('✅ Supabase database initialized');
        databaseInitialized = true;
      } catch (error) {
        console.warn('⚠️  Supabase initialization failed, falling back to SQLite');
      }
    }

    // Fallback to SQLite (local development)
    if (!databaseInitialized) {
      await db.init();
      console.log('✅ SQLite database initialized');
    }

    // Initialize R2 storage
    const r2Initialized = r2Service.initR2();
    if (r2Initialized) {
      console.log('✅ Cloudflare R2 storage initialized');
    } else {
      console.log('ℹ️  Using local file storage (R2 not configured)');
    }

    // Initialize Firebase Admin
    const { initFirebaseAdmin } = require('./config/firebaseAdmin');
    initFirebaseAdmin();

    // Create app
    const app = createApp();

    // Start server
    app.listen(config.port, () => {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🚀 Xiaohongshu Content Generator v4.0');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log(`📺 Server running at http://localhost:${config.port}`);
      console.log(`📊 Health: http://localhost:${config.port}/health`);
      console.log(`🔐 Auth: http://localhost:${config.port}/auth`);
      console.log(`🤖 Telegram: POST /telegram/webhook`);
      console.log(`\n📁 Environment: ${config.nodeEnv}`);
      
      console.log(`\n📦 Services:`);
      console.log(`  ${databaseInitialized ? '✅' : '⚠️'} Database: ${databaseInitialized ? 'Supabase (PostgreSQL)' : 'SQLite (local)'}`);
      console.log(`  ${r2Initialized ? '✅' : '⚠️'} Storage: ${r2Initialized ? 'Cloudflare R2' : 'Local filesystem'}`);
      
      console.log(`\n✨ Features:`);
      console.log(`  - YouTube/TikTok caption extraction`);
      console.log(`  - Job-based processing with status tracking`);
      console.log(`  - Transcript caching`);
      console.log(`  - Firebase Authentication (Google + Facebook)`);
      console.log(`  - Protected API endpoints`);
      console.log(`  - CSRF protection`);
      console.log(`  - Telegram Bot integration`);
      console.log(`  - Cloudflare Workers ready`);
      console.log(`  - Railway deployment ready`);

      console.log(`\n🔐 Auth Setup:`);
      if (config.firebase.serviceAccountPath) {
        console.log(`  ✅ Firebase configured`);
      } else {
        console.log(`  ⚠️  Firebase not configured - running in demo mode`);
      }

      // Telegram Bot setup info
      if (config.telegram?.botToken) {
        console.log(`\n🤖 Telegram Bot: Configured`);
        console.log(`   Webhook: ${config.telegram.webhookUrl || 'Not set (use /telegram/setWebhook)'}`);
      }

      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    });

    return app;

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

module.exports = {
  createApp,
  startServer
};
