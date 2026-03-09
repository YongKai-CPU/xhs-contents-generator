/**
 * Firebase Authentication UI Logic
 * Handles login, logout, and UI state management
 * 
 * Loaded as ES module from index.html
 */

// Firebase state
let auth = null;
let currentUser = null;
let csrfToken = null;

// DOM Elements
let loginSection = null;
let loggedInSection = null;
let userInfoElement = null;
let loginButtonsContainer = null;

/**
 * Initialize Firebase Auth
 */
async function initFirebaseAuth() {
  try {
    // Import Firebase modules from CDN
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const { getAuth, onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');

    // Initialize Firebase
    const firebaseConfig = window.firebaseConfig;
    
    if (!firebaseConfig || firebaseConfig.apiKey === 'YOUR_API_KEY_HERE') {
      console.warn('Firebase not configured. Please update public/firebase-config.js');
      showFirebaseNotConfigured();
      return false;
    }

    const app = initializeApp(firebaseConfig);
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
    showFirebaseNotConfigured();
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

    // Get CSRF token first
    await fetchCSRFToken();

    // Send ID token to server to create session cookie
    const response = await fetch('/auth/sessionLogin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      credentials: 'include'
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to create session');
    }

    console.log('Session created successfully');
    updateUIForLoggedInUser(data.user);

  } catch (error) {
    console.error('Session login error:', error);
    // Still show as logged in on frontend, but API calls may fail
    updateUIForLoggedInUser({
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
  updateUIForLoggedOutUser();
}

/**
 * Login with Google
 */
async function loginWithGoogle() {
  if (!auth) {
    alert('Firebase authentication is not configured. Please contact the administrator.');
    return;
  }

  try {
    const { GoogleAuthProvider, signInWithPopup } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
    
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    console.log('Logged in with Google:', result.user.email);
    // onAuthStateChanged will handle the rest

  } catch (error) {
    console.error('Google login error:', error);
    
    if (error.code === 'auth/popup-closed-by-user') {
      // User closed popup, ignore
      return;
    }
    
    if (error.code === 'auth/unauthorized-domain') {
      alert('This domain is not authorized for Firebase Auth. Please add it in Firebase Console > Authentication > Settings > Authorized domains');
    } else {
      alert('Google login failed: ' + error.message);
    }
  }
}

/**
 * Login with Facebook
 */
async function loginWithFacebook() {
  if (!auth) {
    alert('Firebase authentication is not configured. Please contact the administrator.');
    return;
  }

  try {
    const { FacebookAuthProvider, signInWithPopup } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
    
    const provider = new FacebookAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    console.log('Logged in with Facebook:', result.user.email);
    // onAuthStateChanged will handle the rest

  } catch (error) {
    console.error('Facebook login error:', error);
    
    if (error.code === 'auth/popup-closed-by-user') {
      // User closed popup, ignore
      return;
    }
    
    if (error.code === 'auth/unauthorized-domain') {
      alert('This domain is not authorized for Firebase Auth. Please add it in Firebase Console > Authentication > Settings > Authorized domains');
    } else if (error.code === 'auth/argument-error') {
      alert('Facebook login requires additional setup. Please configure Facebook App ID and Secret in Firebase Console.');
    } else {
      alert('Facebook login failed: ' + error.message);
    }
  }
}

/**
 * Logout
 */
async function logout() {
  if (!auth) {
    // If Firebase not configured, just clear UI
    handleUserSignedOut();
    return;
  }

  try {
    // Get CSRF token
    await fetchCSRFToken();

    // Call server logout to clear session cookie
    await fetch('/auth/sessionLogout', {
      method: 'POST',
      headers: {
        'X-CSRF-Token': csrfToken
      },
      credentials: 'include'
    });

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
 * Fetch CSRF token from server
 */
async function fetchCSRFToken() {
  try {
    const response = await fetch('/csrf-token', {
      credentials: 'include'
    });
    const data = await response.json();
    csrfToken = data.token;
    return csrfToken;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    return null;
  }
}

/**
 * Check if user is logged in by calling /auth/me
 */
async function checkAuthStatus() {
  try {
    const response = await fetch('/auth/me', {
      credentials: 'include'
    });

    if (response.ok) {
      const user = await response.json();
      currentUser = user;
      updateUIForLoggedInUser(user);
      return true;
    } else {
      handleUserSignedOut();
      return false;
    }
  } catch (error) {
    console.error('Auth status check error:', error);
    handleUserSignedOut();
    return false;
  }
}

/**
 * Update UI for logged in state
 */
function updateUIForLoggedInUser(user) {
  if (loginSection) loginSection.style.display = 'none';
  if (loggedInSection) loggedInSection.style.display = 'flex';

  if (userInfoElement) {
    const displayName = user.displayName || user.email || 'User';
    const avatar = user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=ff2442&color=fff`;

    // Update avatar and name
    const avatarImg = userInfoElement.querySelector('.user-avatar');
    const nameSpan = userInfoElement.querySelector('.user-name');
    
    if (avatarImg) avatarImg.src = avatar;
    if (nameSpan) nameSpan.textContent = displayName;
  }

  // Enable tool UI
  const generateBtn = document.getElementById('generateBtn');
  if (generateBtn) {
    generateBtn.disabled = false;
  }

  console.log('UI updated for logged in user:', user.email);
}

/**
 * Update UI for logged out state
 */
function updateUIForLoggedOutUser() {
  if (loginSection) loginSection.style.display = 'block';
  if (loggedInSection) loggedInSection.style.display = 'none';
  
  if (userInfoElement) {
    userInfoElement.innerHTML = '';
  }

  // Disable tool UI
  const generateBtn = document.getElementById('generateBtn');
  if (generateBtn) {
    generateBtn.disabled = true;
    generateBtn.title = 'Please log in to generate content';
  }

  console.log('UI updated for logged out state');
}

/**
 * Show Firebase not configured message
 */
function showFirebaseNotConfigured() {
  if (loginSection) {
    loginSection.innerHTML = `
      <div class="firebase-warning">
        <h3>⚠️ Firebase Not Configured</h3>
        <p>Please configure Firebase authentication:</p>
        <ol>
          <li>Create a Firebase project at <a href="https://console.firebase.google.com" target="_blank">console.firebase.google.com</a></li>
          <li>Enable Google and Facebook providers in Authentication</li>
          <li>Copy your web app config to <code>public/firebase-config.js</code></li>
          <li>Add your domain to Authorized Domains</li>
        </ol>
        <p><strong>Demo mode:</strong> You can still use the tool without authentication.</p>
      </div>
    `;
  }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Initialize auth UI when DOM is ready
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Find UI elements
  loginSection = document.getElementById('loginSection');
  loggedInSection = document.getElementById('loggedInSection');
  userInfoElement = document.getElementById('userInfo');
  loginButtonsContainer = document.getElementById('loginButtons');

  // Add event listeners to login buttons
  const googleBtn = document.getElementById('googleLoginBtn');
  const facebookBtn = document.getElementById('facebookLoginBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  if (googleBtn) {
    googleBtn.addEventListener('click', loginWithGoogle);
  }

  if (facebookBtn) {
    facebookBtn.addEventListener('click', loginWithFacebook);
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  // Initialize Firebase Auth
  const firebaseInitialized = await initFirebaseAuth();

  // Check auth status
  if (firebaseInitialized) {
    await checkAuthStatus();
  } else {
    // Firebase not configured - show demo mode
    updateUIForLoggedOutUser();
  }
});

// Export functions for global access
window.authFunctions = {
  loginWithGoogle,
  loginWithFacebook,
  logout,
  checkAuthStatus,
  getCurrentUser: () => currentUser,
  isAuthenticated: () => !!currentUser
};
