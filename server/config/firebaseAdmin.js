/**
 * Firebase Admin SDK Initialization
 * Supports both file-based and environment variable-based configuration
 */

const admin = require('firebase-admin');
const fs = require('fs');
const config = require('./env');

let adminApp = null;

/**
 * Initialize Firebase Admin SDK
 * Priority:
 * 1. Service account file path (FIREBASE_SERVICE_ACCOUNT_PATH)
 * 2. Service account JSON from env (FIREBASE_SERVICE_ACCOUNT)
 * 3. Individual env vars (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
 */
function initFirebaseAdmin() {
  if (admin.apps.length > 0) {
    console.log('Firebase Admin already initialized');
    return admin;
  }

  // Check if Firebase is configured
  if (!config.firebase.serviceAccountPath && 
      !config.firebase.projectId && 
      !process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.warn('Firebase Admin not configured - auth features will run in demo mode');
    return null;
  }

  try {
    let serviceAccount = null;

    // Option 1: Service account file path
    if (config.firebase.serviceAccountPath && fs.existsSync(config.firebase.serviceAccountPath)) {
      console.log('Initializing Firebase Admin from file:', config.firebase.serviceAccountPath);
      serviceAccount = JSON.parse(fs.readFileSync(config.firebase.serviceAccountPath, 'utf8'));
    }

    // Option 2: Service account JSON from env (base64 encoded or plain)
    if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.log('Initializing Firebase Admin from FIREBASE_SERVICE_ACCOUNT env');
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      } catch (e) {
        try {
          const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8');
          serviceAccount = JSON.parse(decoded);
        } catch (e2) {
          console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT');
        }
      }
    }

    // Option 3: Individual environment variables
    if (!serviceAccount && config.firebase.projectId && config.firebase.clientEmail && config.firebase.privateKey) {
      console.log('Initializing Firebase Admin from individual env vars');
      const formattedPrivateKey = config.firebase.privateKey.replace(/\\n/g, '\n');
      serviceAccount = {
        project_id: config.firebase.projectId,
        client_email: config.firebase.clientEmail,
        private_key: formattedPrivateKey
      };
    }

    if (!serviceAccount) {
      console.warn('Firebase Admin: No valid credentials found');
      return null;
    }

    // Initialize Firebase Admin
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    console.log('✅ Firebase Admin initialized successfully');
    return admin;

  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error.message);
    return null;
  }
}

/**
 * Get Firebase Admin instance
 */
function getAdmin() {
  if (!adminApp) {
    return initFirebaseAdmin();
  }
  return adminApp;
}

/**
 * Get Auth instance
 */
function getAuth() {
  const adminInstance = getAdmin();
  if (!adminInstance) {
    return null;
  }
  return adminInstance.auth();
}

module.exports = {
  initFirebaseAdmin,
  getAdmin,
  getAuth
};
