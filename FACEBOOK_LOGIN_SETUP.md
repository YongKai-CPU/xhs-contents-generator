# 🔵 Facebook Login Setup Guide

Quick step-by-step guide to enable Facebook authentication for your Xiaohongshu Content Generator.

**Time required:** 10-15 minutes

---

## Prerequisites

- ✅ Firebase project created (`contents-generator-e39c4`)
- ✅ Google login working
- ✅ Facebook account (for developers.facebook.com)

---

## Step 1: Create Facebook App (5 min)

### 1.1 Go to Facebook Developers

Visit: https://developers.facebook.com/

Log in with your Facebook account.

### 1.2 Create New App

1. Click **My Apps** (top right)
2. Click **Create app** button
3. Select **Consumer** as app type
4. Click **Next**

### 1.3 Fill App Details

| Field | Value |
|-------|-------|
| **App name** | `Xiaohongshu Content Generator` |
| **App contact email** | Your email address |
| **Business account** | Select None (if available) |

5. Click **Create app**
6. Complete the security check (captcha)

---

## Step 2: Add Facebook Login Product (3 min)

### 2.1 Add Product

1. In your App Dashboard, scroll down to **Add products to your app**
2. Find **Facebook Login** card
3. Click **Set up**

### 2.2 Configure Facebook Login

1. In the left sidebar, click **Facebook Login** → **Settings**
2. Configure these fields:

**Valid OAuth Redirect URIs:**
```
https://contents-generator-e39c4.firebaseapp.com/__/auth/handler
```
Click **Add**

**App Domains:**
```
localhost
```

**Privacy Policy URL:** (Optional for development)
```
https://contents-generator-e39c4.firebaseapp.com/privacy.html
```

3. Click **Save changes** (blue button at bottom)

---

## Step 3: Get Facebook App Credentials (2 min)

### 3.1 Find App ID

1. In your Facebook App Dashboard (home page)
2. Look for **App ID** at the top
3. Click the **copy icon** next to it
4. Save this somewhere (you'll need it in Step 4)

### 3.2 Get App Secret

1. On the App Dashboard, find **App secret**
2. Click **Show** button
3. Enter your Facebook password if prompted
4. Click the **copy icon** to copy the secret
5. Save this securely (you'll need it in Step 4)

**⚠️ Important:** Never share your App Secret or commit it to Git!

---

## Step 4: Configure Firebase with Facebook (3 min)

### 4.1 Open Firebase Console

Visit: https://console.firebase.google.com/project/contents-generator-e39c4/authentication/providers

### 4.2 Enable Facebook Provider

1. Click on **Sign-in method** tab
2. Find **Facebook** in the providers list
3. Click on **Facebook**

### 4.3 Enter Credentials

1. Toggle **Enable** to ON
2. Paste your **App ID** (from Step 3.1)
3. Paste your **App Secret** (from Step 3.2)

### 4.4 Configure OAuth Redirect

1. Copy the **OAuth redirect URI** shown in Firebase (it should be):
   ```
   https://contents-generator-e39c4.firebaseapp.com/__/auth/handler
   ```

2. Go back to **Facebook Developers** → Your App → **Facebook Login** → **Settings**

3. Make sure this exact URI is in **Valid OAuth Redirect URIs**

4. If not, add it and click **Save changes**

### 4.5 Save Firebase Settings

1. Back in Firebase Console, click **Save**
2. You should see a green checkmark

✅ **Facebook login is now enabled in Firebase!**

---

## Step 5: Add Authorized Domains (1 min)

### 5.1 Open Firebase Auth Settings

Visit: https://console.firebase.google.com/project/contents-generator-e39c4/authentication/settings

### 5.2 Add Domains

Under **Authorized domains**, ensure these are listed:

1. `localhost` (for development)
2. `contents-generator-e39c4.firebaseapp.com`
3. `firebaseapp.com` (should be auto-added)

If any are missing:
1. Click **Add domain**
2. Enter the domain
3. Click **Save**

---

## Step 6: Test Facebook Login (2 min)

### 6.1 Restart Your Server

If your server is running, stop it and restart:

```bash
# Stop current server (Ctrl+C)
# Then restart
node server.js
```

### 6.2 Test in Browser

1. Open: http://localhost:3000
2. You should see the login section with:
   - "Continue with Google" button
   - "or" divider
   - "Continue with Facebook" button

3. Click **Continue with Facebook**
4. Facebook popup should appear
5. Log in with your Facebook account
6. After successful login:
   - Your Facebook email should appear in the header
   - "Generate Content" button should be enabled

---

## Troubleshooting

### ❌ "Invalid OAuth Redirect URI"

**Problem:** The redirect URI doesn't match

**Solution:**
1. Go to Facebook Developers → Your App → Facebook Login → Settings
2. Copy the exact OAuth redirect URI from Firebase Console
3. Paste it in **Valid OAuth Redirect URIs** on Facebook
4. Click **Save changes**

---

### ❌ "App Not Public" or "This app is in development mode"

**Problem:** Facebook App is in Development Mode

**Solution (for testing):**
1. Go to Facebook Developers → Your App
2. Go to **App Review** → **Test Users**
3. Click **Add** → **Create test user**
4. Use the test user credentials to log in

**Solution (for production):**
1. Go to **App Review** → **Permissions and features**
2. Submit your app for review (required for public access)
3. Add `public_profile` and `email` permissions

---

### ❌ "Invalid App ID"

**Problem:** App ID is incorrect in Firebase

**Solution:**
1. Go to Facebook Developers → Your App Dashboard
2. Copy the **App ID** exactly as shown
3. Go to Firebase Console → Authentication → Sign-in method → Facebook
4. Re-paste the App ID
5. Click **Save**

---

### ❌ Popup Blocked

**Problem:** Browser is blocking the Facebook login popup

**Solution:**
1. Look for the popup blocker icon in your browser's address bar
2. Click it and select **Always allow popups from localhost:3000**
3. Try logging in again

---

### ❌ "Facebook login failed: auth/popup-closed-by-user"

**Problem:** User closed the popup manually

**Solution:** This is normal - just click the Facebook button again and complete the login.

---

### ❌ "Facebook login failed: auth/argument-error"

**Problem:** Facebook App ID or Secret is incorrect

**Solution:**
1. Double-check App ID and Secret in Facebook Developers
2. Make sure there are no extra spaces when copying
3. Re-enter them in Firebase Console
4. Save and try again

---

## Production Deployment

When deploying to production:

### 1. Add Production Domain to Facebook

1. Go to Facebook Developers → Your App → Facebook Login → Settings
2. Add your production domain to **App Domains**:
   ```
   yourdomain.com
   ```
3. Add production redirect URI to **Valid OAuth Redirect URIs**:
   ```
   https://yourdomain.com/__/auth/handler
   ```

### 2. Add Production Domain to Firebase

1. Go to Firebase Console → Authentication → Settings
2. Add your production domain to **Authorized domains**

### 3. Switch Facebook App to Live Mode

1. Go to Facebook Developers → Your App → **App Review**
2. Toggle **Make [App Name] public?** to **Yes**
3. Submit for App Review if required for certain permissions

---

## Quick Reference

### Important URLs

| Service | URL |
|---------|-----|
| Facebook Developers | https://developers.facebook.com/ |
| My Facebook Apps | https://developers.facebook.com/apps/ |
| Firebase Auth | https://console.firebase.google.com/project/contents-generator-e39c4/authentication/providers |
| Firebase Settings | https://console.firebase.google.com/project/contents-generator-e39c4/authentication/settings |

### Required Configuration

**Facebook App Settings:**
- **Valid OAuth Redirect URI**: `https://contents-generator-e39c4.firebaseapp.com/__/auth/handler`
- **App Domain**: `localhost`

**Firebase Facebook Provider:**
- **App ID**: (from Facebook App Dashboard)
- **App Secret**: (from Facebook App Dashboard)

**Firebase Authorized Domains:**
- `localhost`
- `contents-generator-e39c4.firebaseapp.com`

---

## Security Notes

⚠️ **Never commit these to Git:**
- Facebook App Secret
- Firebase Service Account Key
- Any API keys or passwords

Add to `.gitignore`:
```
.env
*.json
serviceAccountKey.json
```

---

## Need Help?

- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/)
- [Firebase Facebook Auth Guide](https://firebase.google.com/docs/auth/web/facebook-login)
- [Facebook App Review Guide](https://developers.facebook.com/docs/app-review/)

---

## Checklist

Before testing, ensure:

- [ ] Facebook App created
- [ ] Facebook Login product added
- [ ] OAuth redirect URI added to Facebook
- [ ] App ID copied to Firebase
- [ ] App Secret copied to Firebase
- [ ] Facebook provider enabled in Firebase
- [ ] `localhost` added to Firebase Authorized domains
- [ ] Server restarted
- [ ] Popups allowed for localhost:3000

---

**🎉 Once everything is set up, users can log in with both Google AND Facebook!**
