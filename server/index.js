#!/usr/bin/env node

/**
 * Xiaohongshu Content Generator - Server v3.0
 * Production-ready entry point
 *
 * This file bootstraps the server and handles graceful shutdown
 */

const { startServer } = require('./app');

// Start the server
startServer();

// ============================================================
// Graceful Shutdown
// ============================================================

// Prevent multiple shutdown calls
let isShuttingDown = false;

/**
 * Handle graceful shutdown
 */
async function gracefulShutdown(signal) {
  // Prevent multiple calls
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log(`\n${signal} received. Shutting down gracefully...`);

  // Close database connections
  try {
    const { db } = require('../db/database');
    await db.close();
    console.log('✅ Database connections closed');
  } catch (error) {
    // Ignore errors if database is already closed
    if (error.code !== 'SQLITE_MISUSE') {
      console.error('❌ Error closing database:', error.message);
    }
  }

  // Exit with appropriate code - ensure integer
  const signalNumbers = {
    'SIGTERM': 15,
    'SIGINT': 2,
    'SIGQUIT': 3
  };
  
  const signalNum = signalNumbers[signal] || 1;
  process.exit(128 + signalNum);
}

// Listen for shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGQUIT', () => gracefulShutdown('SIGQUIT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Handle process warnings
process.on('warning', (warning) => {
  console.warn('⚠️  Process Warning:', warning);
});
