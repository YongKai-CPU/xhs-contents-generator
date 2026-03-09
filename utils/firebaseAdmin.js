/**
 * Firebase Admin SDK Initialization
 * Supports both file-based and environment variable-based configuration
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

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

  try {
    let serviceAccount = null;

    // Option 1: Service account file path
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
      console.log('Initializing Firebase Admin from file:', serviceAccountPath);
      serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    }

    // Option 2: Service account JSON from env (base64 encoded or plain)
    if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.log('Initializing Firebase Admin from FIREBASE_SERVICE_ACCOUNT env');
      try {
        // Try to parse as JSON directly first
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      } catch (e) {
        // Try base64 decode
        try {
          const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8');
          serviceAccount = JSON.parse(decoded);
        } catch (e2) {
          console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT');
        }
      }
    }

    // Option 3: Individual environment variables
    if (!serviceAccount) {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;

      if (projectId && clientEmail && privateKey) {
        console.log('Initializing Firebase Admin from individual env vars');
        // Handle private key newline replacement
        const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
        serviceAccount = {
          project_id: projectId,
          client_email: clientEmail,
          private_key: formattedPrivateKey
        };
      }
    }

    if (!serviceAccount) {
      console.warn('Firebase Admin not configured - auth features will be disabled');
      console.warn('Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY');
      return null;
    }

    // Initialize Firebase Admin
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    console.log('Firebase Admin initialized successfully');
    return admin;

  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error.message);
    return null;
  }
}

/**
 * Get Firebase Admin instance
 */
function getAdmin() {
  if (!adminApp && process.env.FIREBASE_PROJECT_ID) {
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
