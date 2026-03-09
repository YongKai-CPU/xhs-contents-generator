/**
 * Firebase Client Configuration
 *
 * Firebase project: contents-generator-e39c4
 * Created: 2026-03-05
 */

const firebaseConfig = {
  apiKey: "AIzaSyAnBEYEUYScUnh8TrUVPD6-V8vdJTueluA",
  authDomain: "contents-generator-e39c4.firebaseapp.com",
  projectId: "contents-generator-e39c4",
  storageBucket: "contents-generator-e39c4.firebasestorage.app",
  messagingSenderId: "787050228223",
  appId: "1:787050228223:web:03836fe073f87a6cdadfca",
  measurementId: "G-JDFC2DXVGZ"
};

// Export for use in browser (browser-compatible way)
if (typeof window !== 'undefined') {
  window.firebaseConfig = firebaseConfig;
}
