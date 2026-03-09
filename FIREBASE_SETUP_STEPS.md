# 🔐 Firebase Configuration - Quick Start Guide

Follow these steps to enable Google and Facebook login for your Xiaohongshu Content Generator.

---

## Step 1: Create Firebase Project (5 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `xhs-content-generator` (or your preferred name)
4. Click **Continue**
5. (Optional) Enable Google Analytics
6. Click **Create project**
7. Wait for project creation, click **Continue**

---

## Step 2: Enable Google Sign-In (3 minutes)

1. In Firebase Console, select your project
2. Go to **Authentication** (left sidebar)
3. Click **Get started** if prompted
4. Go to **Sign-in method** tab
5. Click on **Google**
6. Toggle **Enable**
7. Enter project support email (your email)
8. Click **Save**

✅ Google login is now enabled!

---

## Step 3: Enable Facebook Sign-In (10 minutes)

### Part A: Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **My Apps** → **Create app**
3. Select **Consumer** as app type
4. Click **Next**
5. Enter app name: `Xiaohongshu Content Generator`
6. Enter contact email
7. Click **Create app**
8. Complete security check if prompted

### Part B: Configure Facebook Login

1. In Facebook App Dashboard, scroll down
2. Click **Add product** → **Facebook Login** → **Set up**
3. Go to **Facebook Login** → **Settings**
4. Add **Valid OAuth Redirect URIs**:
   ```
   https://your-firebase-project-id.firebaseapp.com/__/auth/handler
   ```
   (Replace `your-firebase-project-id` with your actual Firebase project ID)
5. Set **App Domain** to: `localhost` (for development)
6. Click **Save changes**

### Part C: Connect to Firebase

1. Copy **App ID** and **App Secret** from Facebook
2. Go back to Firebase Console
3. Go to **Authentication** → **Sign-in method**
4. Click on **Facebook**
5. Toggle **Enable**
6. Paste **App ID** and **App Secret**
7. Copy the **OAuth redirect URI** shown in Firebase
8. Go back to Facebook Developers and add this URI to **Valid OAuth Redirect URIs**
9. Click **Save changes** on both sides
10. Back in Firebase, click **Save**

✅ Facebook login is now enabled!

---

## Step 4: Get Web App Configuration (2 minutes)

1. In Firebase Console, click **Project Overview** (gear icon) → **Project settings**
2. Scroll to **Your apps** section
3. Click **Add app** → **Web** (</> icon)
4. Register app nickname: `Xiaohongshu Web`
5. (Optional) Set up hosting (skip for now)
6. Copy the `firebaseConfig` object:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

---

## Step 5: Configure Frontend (1 minute)

1. Open `public/firebase-config.js` in your project
2. Replace the placeholder config with your actual config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

3. Save the file

---

## Step 6: Get Service Account Key (3 minutes)

### Option A: Use Service Account File (Recommended)

1. In Firebase Console, go to **Project settings**
2. Go to **Service accounts** tab
3. Click **Generate new private key**
4. Read the warning and click **Generate key**
5. A JSON file will download (e.g., `serviceAccountKey.json`)
6. Move this file to your project root directory
7. **IMPORTANT:** Add to `.gitignore`:
   ```
   serviceAccountKey.json
   *.json
   ```

### Option B: Use Environment Variables

1. Open the downloaded JSON file
2. Copy the values to `.env` (see Step 7)

---

## Step 7: Configure Backend (2 minutes)

1. Open `.env` in your project root
2. Add or update these lines:

**If using service account file:**
```env
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
```

**OR if using environment variables:**
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

3. Save the file

---

## Step 8: Add Authorized Domains (1 minute)

1. In Firebase Console, go to **Authentication** → **Settings**
2. Scroll to **Authorized domains**
3. Add these domains:
   - `localhost` (for development)
   - `127.0.0.1` (for development)
   - Your production domain (e.g., `yourdomain.com`)

---

## Step 9: Test Authentication (2 minutes)

1. Start your server:
   ```bash
   npm start
   ```

2. Open browser: http://localhost:3000

3. You should see:
   - "Continue with Google" button
   - "Continue with Facebook" button

4. Click **Continue with Google**
5. Select your Google account
6. You should see your email in the header
7. The "Generate" button should be enabled

✅ Authentication is working!

---

## Troubleshooting

### ❌ "Firebase not configured" warning

**Problem:** `public/firebase-config.js` still has placeholder values

**Solution:** Replace with your actual Firebase config from Step 4

---

### ❌ "Unauthorized domain" error

**Problem:** Domain not in Firebase Authorized domains

**Solution:** Add `localhost` in Firebase Console → Authentication → Settings → Authorized domains

---

### ❌ "Network error" or popup closed immediately

**Problem:** Browser blocking popups

**Solution:** Allow popups for `localhost:3000` in your browser

---

### ❌ Facebook login not working

**Problem:** Facebook App not configured correctly

**Solution:**
1. Verify Facebook App ID and Secret in Firebase Console
2. Add Firebase OAuth redirect URI to Facebook App settings
3. Make sure App Domain is set to `localhost`

---

### ❌ Cookie not being set / 401 after login

**Problem:** HTTP/HTTPS mismatch

**Solution:** In `.env`, ensure:
```env
COOKIE_SECURE=false  # For localhost (HTTP)
NODE_ENV=development
```

For production (HTTPS):
```env
COOKIE_SECURE=true
NODE_ENV=production
```

---

### ❌ Private key error

**Problem:** Private key has literal `\n` instead of actual newlines

**Solution:** Use the file path method instead:
```env
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
```

---

## Production Deployment

When deploying to production:

1. **Update `.env`:**
   ```env
   NODE_ENV=production
   COOKIE_SECURE=true  # Requires HTTPS
   ```

2. **Add production domain** to Firebase Authorized domains

3. **Add production domain** to Facebook App Valid OAuth Redirect URIs

4. **Deploy service account file** securely (never commit to Git)

5. **Use environment variables** from your hosting provider

---

## Testing Checklist

- [ ] Google login works
- [ ] Facebook login works
- [ ] User info displays after login
- [ ] Logout works
- [ ] "Generate" button is enabled when logged in
- [ ] "Generate" button is disabled when logged out
- [ ] API calls work when logged in
- [ ] API calls return 401 when logged out

---

## Quick Reference

### Firebase Console URLs
- Main Console: https://console.firebase.google.com/
- Authentication: https://console.firebase.google.com/project/YOUR_PROJECT/authentication
- Service Accounts: https://console.firebase.google.com/project/YOUR_PROJECT/settings/serviceaccounts/adminsdk

### Facebook Developer URLs
- My Apps: https://developers.facebook.com/apps/
- App Dashboard: https://developers.facebook.com/apps/YOUR_APP_ID/dashboard/

### Environment Variables
```env
# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
# OR
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Session
SESSION_COOKIE_NAME=__session
SESSION_EXPIRES_DAYS=5
COOKIE_SECURE=false  # true in production

# CSRF
CSRF_COOKIE_NAME=csrf_token

# Environment
NODE_ENV=development  # production in deployment
```

---

## Need Help?

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Google Sign-In Setup](https://firebase.google.com/docs/auth/web/google-signin)
- [Facebook Login Setup](https://firebase.google.com/docs/auth/web/facebook-login)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
