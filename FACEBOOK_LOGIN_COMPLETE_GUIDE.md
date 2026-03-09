# 🔵 Facebook Login - Complete Setup Guide

**Status:** You've created Facebook App - Now configure it for login

---

## 📋 What You Need

### From Facebook Developer
- ✅ Facebook App created
- ⏳ Facebook Login product configured
- ⏳ OAuth redirect URI added

### From Firebase Console
- ⏳ Facebook provider enabled
- ⏳ App ID and App Secret configured

---

## 🎯 Step-by-Step Configuration

### Step 1: Get Your Firebase OAuth Redirect URI

1. **Open Firebase Console:**
   - Go to: https://console.firebase.google.com/project/contents-generator-e39c4/authentication/providers

2. **Click on Facebook:**
   - Find "Facebook" in the Sign-in providers list
   - Click on it

3. **Copy the OAuth Redirect URI:**
   - You'll see: `https://contents-generator-e39c4.firebaseapp.com/__/auth/handler`
   - Click the **copy icon** 📋
   - **Save this somewhere** (you'll need it in Step 3)

---

### Step 2: Configure Facebook App

1. **Open Facebook Developer:**
   - Go to: https://developers.facebook.com/apps/

2. **Select Your App:**
   - Find "Xiaohongshu Content Generator" (or your app name)
   - Click on it

3. **Add Facebook Login Product:**
   - Scroll down to "Add products to your app"
   - Find **Facebook Login** card
   - Click **Set up**

4. **Configure Facebook Login Settings:**
   - In the left sidebar, click **Facebook Login** → **Settings**
   
   **Fill in these fields:**

   | Field | Value |
   |-------|-------|
   | **Valid OAuth Redirect URIs** | `https://contents-generator-e39c4.firebaseapp.com/__/auth/handler` |
   | **App Domain** | `localhost` (for development) |
   
   **For Valid OAuth Redirect URIs:**
   - Click **Add Platform** button
   - Select **Website**
   - Paste the URI you copied from Firebase
   - Click **Save**

   **For App Domain:**
   - Enter: `localhost`
   - This allows testing on your local machine

5. **Click Save Changes** (blue button at bottom)

---

### Step 3: Get Facebook App ID and Secret

1. **Go to App Dashboard:**
   - In Facebook Developer, click **App Dashboard** (left sidebar)

2. **Find App ID:**
   - At the top of the page
   - You'll see **App ID: 123456789012345**
   - Click the **copy icon** 📋
   - **Save this**

3. **Get App Secret:**
   - Find **App secret** section
   - Click **Show** button
   - Enter your Facebook password if prompted
   - Click the **copy icon** 📋
   - **Save this securely**

---

### Step 4: Configure Firebase with Facebook Credentials

1. **Go back to Firebase Console:**
   - https://console.firebase.google.com/project/contents-generator-e39c4/authentication/providers

2. **Click on Facebook again:**

3. **Enable Facebook Provider:**
   - Toggle **Enable** to ON (green)

4. **Enter Credentials:**
   - **App ID:** Paste the App ID from Step 3
   - **App Secret:** Paste the App Secret from Step 3

5. **Verify OAuth Redirect URI:**
   - Make sure it shows: `https://contents-generator-e39c4.firebaseapp.com/__/auth/handler`

6. **Click Save** (blue button)

---

### Step 5: Add Authorized Domain to Firebase

1. **Go to Firebase Auth Settings:**
   - https://console.firebase.google.com/project/contents-generator-e39c4/authentication/settings

2. **Find Authorized Domains:**
   - Scroll to "Authorized domains" section

3. **Add These Domains:**
   - `localhost` (should already be there)
   - `contents-generator-e39c4.firebaseapp.com` (should be auto-added)

4. **Click Add Domain** if any are missing

---

### Step 6: Test Facebook Login

1. **Restart Your Server:**
   ```bash
   # Stop current server (Ctrl+C)
   # Then restart
   npm start
   ```

2. **Open Browser:**
   - Go to: http://localhost:3000/

3. **Click "Continue with Facebook":**
   - You should see Facebook login popup

4. **What You'll See in Facebook Login Popup:**

   **First Time:**
   ```
   ┌─────────────────────────────────────────┐
   │  [Facebook Logo]                        │
   │                                         │
   │  Xiaohongshu Content Generator          │
   │  wants to:                              │
   │                                         │
   │  ✓ See your public profile              │
   │  ✓ See your email address               │
   │                                         │
   │  [Continue as Your Name]  [Cancel]      │
   └─────────────────────────────────────────┘
   ```

   **What to Select:**
   - Click **"Continue as [Your Name]"** button
   - This grants permission to see your public profile and email

5. **After Successful Login:**
   - Popup closes automatically
   - You return to your app
   - Your Facebook email appears in the header
   - Logout button appears
   - Generate button becomes enabled

---

## 🔧 Troubleshooting

### ❌ Error: "Invalid OAuth Redirect URI"

**What You See:**
```
Error: Invalid OAuth redirect URI
```

**Solution:**
1. Go to Facebook Developer → Your App → Facebook Login → Settings
2. Make sure this exact URI is in **Valid OAuth Redirect URIs**:
   ```
   https://contents-generator-e39c4.firebaseapp.com/__/auth/handler
   ```
3. Click **Save Changes**
4. Wait 1-2 minutes for changes to propagate
5. Try again

---

### ❌ Error: "App Not Public" or "This app is in development mode"

**What You See:**
```
This app is in development mode. Only admins, developers, and testers can use it.
```

**Solution (for testing):**
This is **NORMAL** during development! You have two options:

**Option A: Add Yourself as Test User (Recommended for Development)**
1. Go to Facebook Developer → Your App
2. Go to **App Review** → **Test Users**
3. Click **Add** → **Create test user**
4. Use the test user credentials to log in

**Option B: Switch App to Public Mode (For Production)**
1. Go to **App Review** → **Permissions and features**
2. Toggle **Make [App Name] public?** to **Yes**
3. Submit for App Review (required for public access)

---

### ❌ Error: "Unauthorized domain"

**What You See:**
```
This domain is not authorized for Firebase Auth
```

**Solution:**
1. Go to Firebase Console → Authentication → Settings
2. Under **Authorized domains**, add:
   - `localhost`
   - `contents-generator-e39c4.firebaseapp.com`
3. Click **Save**
4. Try again

---

### ❌ Popup Blocked

**What You See:**
- Popup doesn't open
- Browser shows popup blocker icon

**Solution:**
1. Look for popup blocker icon in browser address bar
2. Click it
3. Select **Always allow popups from localhost:3000**
4. Click **Done**
5. Try logging in again

---

### ❌ Facebook Login Button Not Working

**What You See:**
- Click button, nothing happens
- Console shows error

**Solution:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for errors
4. Common fixes:
   - Clear browser cache (Ctrl+Shift+Delete)
   - Hard refresh (Ctrl+F5)
   - Check `public/firebase-config.js` has correct config
   - Verify Facebook App ID is correct in Firebase Console

---

## 📱 What Happens During Facebook Login

### Login Flow Diagram

```
┌─────────────┐
│   User      │
│  Clicks FB  │
│   Button    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│  Firebase Auth Popup Opens      │
│  - Shows your app name          │
│  - Requests permissions         │
│  - User clicks "Continue"       │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Facebook Verifies User         │
│  - User logs in (if needed)     │
│  - Grants permissions           │
│  - Returns Firebase ID token    │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Frontend Receives ID Token     │
│  - Sends to backend:            │
│    POST /auth/sessionLogin      │
│  - Body: { idToken: "..." }     │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Backend Creates Session        │
│  - Verifies ID token            │
│  - Creates session cookie       │
│  - Sets cookie: __session=...   │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  UI Updates to Logged In        │
│  - Shows user email             │
│  - Shows logout button          │
│  - Enables Generate button      │
└─────────────────────────────────┘
```

---

## ✅ Verification Checklist

After setup, verify these:

### Facebook Developer
- [ ] Facebook Login product added
- [ ] Valid OAuth Redirect URI added
- [ ] App Domain set to `localhost`
- [ ] App ID copied
- [ ] App Secret copied

### Firebase Console
- [ ] Facebook provider enabled
- [ ] App ID pasted correctly
- [ ] App Secret pasted correctly
- [ ] OAuth redirect URI matches Facebook
- [ ] Authorized domains include `localhost`

### Your App
- [ ] `public/firebase-config.js` has correct config
- [ ] Server restarted after changes
- [ ] Facebook login button visible
- [ ] Clicking button opens popup
- [ ] Can log in with Facebook account
- [ ] After login, user info appears
- [ ] Generate button enabled

---

## 🎯 Quick Reference

### Important URLs

| Service | URL |
|---------|-----|
| **Facebook Developer** | https://developers.facebook.com/apps/ |
| **Firebase Auth** | https://console.firebase.google.com/project/contents-generator-e39c4/authentication/providers |
| **Firebase Settings** | https://console.firebase.google.com/project/contents-generator-e39c4/authentication/settings |

### Required Configuration

**Facebook App Settings:**
```
Valid OAuth Redirect URI:
https://contents-generator-e39c4.firebaseapp.com/__/auth/handler

App Domain:
localhost
```

**Firebase Facebook Provider:**
```
App ID: [Copy from Facebook Developer]
App Secret: [Copy from Facebook Developer]
```

---

## 🎉 Success Indicators

You'll know it's working when:

1. ✅ Click "Continue with Facebook" button
2. ✅ Facebook popup opens
3. ✅ See your app name in popup
4. ✅ Can log in with Facebook account
5. ✅ After login, popup closes
6. ✅ Your Facebook email appears in header
7. ✅ Logout button appears
8. ✅ Generate button becomes enabled
9. ✅ Can generate content successfully

---

## 📞 Need Help?

If you get stuck:

1. **Check Console:** Open DevTools (F12) → Console tab
2. **Check Network:** DevTools → Network tab → Look for failed requests
3. **Check Logs:** Server console for error messages
4. **Compare Settings:** Make sure Facebook and Firebase settings match exactly

---

**Once Facebook login works, you'll have both Google AND Facebook authentication ready!** 🎊
