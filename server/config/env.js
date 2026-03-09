/**
 * Environment Configuration
 * Loads and validates all environment variables
 */

const dotenv = require('dotenv');
const path = require('path');

// Load .env file
dotenv.config();

// Required environment variables
const requiredEnvVars = [
  'PORT',
  'NODE_ENV',
  'AI_API_KEY',
  'AI_BASE_URL',
  'AI_MODEL',
  'SESSION_COOKIE_NAME',
  'SESSION_EXPIRES_DAYS',
  'CSRF_COOKIE_NAME'
];

// Firebase-specific (required for auth)
const firebaseEnvVars = [
  'FIREBASE_SERVICE_ACCOUNT_PATH'
];

// Validate required variables
function validateEnv() {
  const missing = [];
  
  // Check core required vars
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });
  
  // Check Firebase vars (warn if missing, but don't block)
  const missingFirebase = [];
  firebaseEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missingFirebase.push(varName);
    }
  });
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please copy .env.example to .env and fill in the values.`
    );
  }
  
  if (missingFirebase.length > 0) {
    console.warn('⚠️  Firebase not configured. Auth features will run in demo mode.');
    console.warn('   Set FIREBASE_SERVICE_ACCOUNT_PATH to enable authentication.');
  }
  
  return true;
}

// Configuration object
const config = {
  // Server
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  
  // AI Provider (DashScope / Qwen)
  ai: {
    apiKey: process.env.AI_API_KEY,
    baseURL: process.env.AI_BASE_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    model: process.env.AI_MODEL || 'qwen-turbo'
  },
  
  // DashScope (for speech-to-text)
  dashScope: {
    apiKey: process.env.DASHSCOPE_API_KEY || process.env.AI_API_KEY
  },
  
  // Firebase Admin SDK
  firebase: {
    serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY
  },
  
  // Session Configuration
  session: {
    cookieName: process.env.SESSION_COOKIE_NAME || '__session',
    expiresDays: parseInt(process.env.SESSION_EXPIRES_DAYS, 10) || 5,
    cookieSecure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production'
  },
  
  // CSRF Configuration
  csrf: {
    cookieName: process.env.CSRF_COOKIE_NAME || 'csrf_token'
  },

  // Telegram Bot Configuration
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    webhookUrl: process.env.TELEGRAM_WEBHOOK_URL
  },

  // Paths
  paths: {
    root: path.join(__dirname, '..'),
    storage: path.join(__dirname, '..', 'storage'),
    audio: path.join(__dirname, '..', 'storage', 'audio'),
    ffmpeg: path.join(__dirname, '..', 'ffmpeg', 'ffmpeg-master-latest-win64-gpl', 'bin')
  }
};

// Validate environment on load
validateEnv();

// Add ffmpeg to PATH on Windows
if (process.platform === 'win32') {
  const ffmpegPath = config.paths.ffmpeg;
  process.env.PATH = `${ffmpegPath};${process.env.PATH}`;
}

module.exports = config;
