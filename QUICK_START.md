# ⚡ Quick Start - Enable Firebase Authentication

## 5-Minute Setup (Google Login Only)

### 1. Create Firebase Project
- Go to https://console.firebase.google.com/
- Click **Add project** → Enter name → **Create**

### 2. Enable Google Sign-In
- Go to **Authentication** → **Sign-in method**
- Click **Google** → **Enable** → **Save**

### 3. Get Web Config
- Go to **Project settings** (gear icon)
- Scroll to **Your apps** → Add app → **Web**
- Copy `firebaseConfig`

### 4. Update Frontend Config
Edit `public/firebase-config.js`:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

### 5. Download Service Account
- Go to **Project settings** → **Service accounts**
- Click **Generate new private key**
- Save JSON file as `serviceAccountKey.json` in project root

### 6. Update .env
```env
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
COOKIE_SECURE=false
NODE_ENV=development
```

### 7. Add Authorized Domain
- Go to **Authentication** → **Settings**
- Add `localhost` to **Authorized domains**

### 8. Start Server
```bash
npm start
```

Visit http://localhost:3000 and test login!

---

## Full Setup (Google + Facebook)

See [FIREBASE_SETUP_STEPS.md](FIREBASE_SETUP_STEPS.md) for complete Facebook login setup.

---

## Rate Limiting - Now Fixed!

Rate limits are now applied correctly:
- **100 requests per 15 minutes** - General API
- **20 requests per 15 minutes** - AI generation endpoints
- Limits are per-user (if logged in) or per-IP

---

## Test Authentication

1. **Without login:** Generate button disabled
2. **Click "Continue with Google"** → Select account
3. **After login:** Your email shows, Generate button enabled
4. **Try generating:** Should work!
5. **Click Logout:** Returns to logged-out state

---

## Common Issues

| Problem | Solution |
|---------|----------|
| "Firebase not configured" | Update `public/firebase-config.js` |
| "Unauthorized domain" | Add `localhost` in Firebase Console |
| Popup blocked | Allow popups for localhost:3000 |
| 401 after login | Check `COOKIE_SECURE=false` in .env |
| Private key error | Use `FIREBASE_SERVICE_ACCOUNT_PATH` instead |

---

## Files Checklist

- [ ] `public/firebase-config.js` - Updated with your config
- [ ] `serviceAccountKey.json` - Downloaded to project root
- [ ] `.env` - Firebase config added
- [ ] `localhost` - Added to Authorized domains
- [ ] Server restarted with `npm start`

---

## Demo Mode

Don't want to configure Firebase? No problem!

The app works in **demo mode** without authentication:
- Just don't configure Firebase
- All features still work
- No login required

Perfect for testing the core functionality!
