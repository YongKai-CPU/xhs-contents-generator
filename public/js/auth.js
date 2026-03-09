/**
 * Firebase Authentication Client
 * Handles login, logout, and auth state management
 */

import { fetchCSRFToken, sessionLogin, sessionLogout, getCurrentUser } from './api.js';

// Firebase state
let auth = null;
let currentUser = null;
let app = null;

/**
 * Initialize Firebase Auth
 */
export async function initFirebaseAuth() {
  try {
    // Import Firebase modules from CDN
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const { getAuth, onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');

    // Initialize Firebase
    const firebaseConfig = window.firebaseConfig;
    
    if (!firebaseConfig || firebaseConfig.apiKey === 'YOUR_API_KEY_HERE') {
      console.warn('Firebase not configured. Please update public/firebase-config.js');
      return false;
    }

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);

    // Listen for auth state changes
    onAuthStateChanged(auth, async (user) => {
      currentUser = user;
      
      if (user) {
        console.log('User signed in:', user.email);
        await handleUserSignedIn(user);
      } else {
        console.log('User signed out');
        handleUserSignedOut();
      }
    });

    return true;

  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    return false;
  }
}

/**
 * Handle user signed in - create server session
 */
async function handleUserSignedIn(user) {
  try {
    // Get Firebase ID token
    const idToken = await user.getIdToken();

    // Send ID token to server to create session cookie
    await sessionLogin(idToken);

    console.log('Session created successfully');
    
    // Trigger UI update
    window.uiFunctions?.updateUIForLoggedInUser?.({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      picture: user.photoURL
    });

  } catch (error) {
    console.error('Session login error:', error);
    // Still show as logged in on frontend
    window.uiFunctions?.updateUIForLoggedInUser?.({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    });
  }
}

/**
 * Handle user signed out
 */
function handleUserSignedOut() {
  currentUser = null;
  window.uiFunctions?.updateUIForLoggedOutUser?.();
}

/**
 * Login with Google
 */
export async function loginWithGoogle() {
  if (!auth) {
    throw new Error('Firebase authentication is not configured');
  }

  try {
    const { GoogleAuthProvider, signInWithPopup } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
    
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    console.log('Logged in with Google:', result.user.email);
    return result.user;

  } catch (error) {
    console.error('Google login error:', error);
    
    if (error.code === 'auth/popup-closed-by-user') {
      return null; // User closed popup
    }
    
    if (error.code === 'auth/unauthorized-domain') {
      throw new Error('This domain is not authorized. Add it in Firebase Console.');
    }
    
    throw error;
  }
}

/**
 * Login with Facebook
 */
export async function loginWithFacebook() {
  if (!auth) {
    throw new Error('Firebase authentication is not configured');
  }

  try {
    const { FacebookAuthProvider, signInWithPopup } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
    
    const provider = new FacebookAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    console.log('Logged in with Facebook:', result.user.email);
    return result.user;

  } catch (error) {
    console.error('Facebook login error:', error);
    
    if (error.code === 'auth/popup-closed-by-user') {
      return null; // User closed popup
    }
    
    if (error.code === 'auth/unauthorized-domain') {
      throw new Error('This domain is not authorized. Add it in Firebase Console.');
    }
    
    throw error;
  }
}

/**
 * Logout
 */
export async function logout() {
  if (!auth) {
    // If Firebase not configured, just clear UI
    handleUserSignedOut();
    return;
  }

  try {
    // Call server logout to clear session cookie
    await sessionLogout();

    // Sign out from Firebase
    const { signOut } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
    await signOut(auth);

    console.log('Logged out successfully');
    handleUserSignedOut();

  } catch (error) {
    console.error('Logout error:', error);
    // Still clear UI even if server logout fails
    handleUserSignedOut();
  }
}

/**
 * Check if user is logged in by calling /auth/me
 */
export async function checkAuthStatus() {
  try {
    const user = await getCurrentUser();
    currentUser = user;
    window.uiFunctions?.updateUIForLoggedInUser?.(user);
    return true;
  } catch (error) {
    handleUserSignedOut();
    return false;
  }
}

/**
 * Get current user
 */
export function getCurrentUserLocal() {
  return currentUser;
}

/**
 * Check if authenticated
 */
export function isAuthenticated() {
  return !!currentUser;
}

/**
 * Handle session expired
 */
export function handleSessionExpired() {
  console.log('Session expired');
  if (auth) {
    signOut(auth);
  }
  handleUserSignedOut();
}

// Export for global access
window.authFunctions = {
  loginWithGoogle,
  loginWithFacebook,
  logout,
  checkAuthStatus,
  getCurrentUser: getCurrentUserLocal,
  isAuthenticated,
  handleSessionExpired,
  updateUIForLoggedInUser: window.uiFunctions?.updateUIForLoggedInUser,
  updateUIForLoggedOutUser: window.uiFunctions?.updateUIForLoggedOutUser
};
