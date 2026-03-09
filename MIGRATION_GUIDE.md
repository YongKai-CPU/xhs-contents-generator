# 🔄 Migration Guide - v2.0 to v3.0

**Date:** 2026-03-05  
**Version:** 3.0.0 (Production-Ready Refactor)

---

## 📋 Overview

This guide helps you migrate from the old monolithic structure (v2.0) to the new production-ready modular structure (v3.0).

### What Changed

| Aspect | v2.0 (Old) | v3.0 (New) |
|--------|------------|------------|
| Entry Point | `server.js` | `server/index.js` |
| Structure | Flat | Modular (config, middleware, routes, controllers, services) |
| Frontend JS | `script.js`, `auth-ui.js` | `js/app.js`, `js/auth.js`, `js/api.js`, `js/ui.js` |
| CSS | `styles.css` | `css/styles.css` |
| Auth | Monolithic | Separated controllers + services |
| Error Handling | Inline | Centralized middleware |

---

## 🗂️ File Structure Comparison

### Old Structure (v2.0)
```
xhs contents generator/
├── server.js              # Monolithic server file
├── public/
│   ├── index.html
│   ├── script.js
│   ├── auth-ui.js
│   └── styles.css
├── middleware/
│   ├── auth.js
│   └── csrf.js
├── routes/
│   └── auth.js
├── utils/
│   └── [utilities]
└── db/
    └── database.js
```

### New Structure (v3.0)
```
xhs contents generator/
├── server/
│   ├── index.js           # Entry point
│   ├── app.js             # Express app setup
│   ├── config/
│   │   ├── env.js
│   │   └── firebaseAdmin.js
│   ├── middleware/
│   │   ├── requireAuth.js
│   │   ├── csrf.js
│   │   ├── errorHandler.js
│   │   └── requestLogger.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── ai.routes.js
│   │   ├── webhook.routes.js
│   │   └── health.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── ai.controller.js
│   │   └── webhook.controller.js
│   ├── services/
│   │   ├── ai.service.js
│   │   ├── video.service.js
│   │   └── whapi.service.js
│   └── utils/
│       ├── http.js
│       ├── validate.js
│       └── constants.js
├── public/
│   ├── index.html
│   ├── firebase-config.js
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── app.js
│       ├── auth.js
│       ├── api.js
│       └── ui.js
├── db/                    # Same as before
├── utils/                 # Legacy utilities (kept for compatibility)
└── worker/                # Same as before
```

---

## 🚀 Migration Steps

### Step 1: Backup Current Code

**Already done!** Your backup is at:
```
C:\Users\yongk\OneDrive\Desktop\xhs contents generator - backup before refactor
```

### Step 2: Review New Structure

The new structure has been created alongside your old code. Key changes:

1. **Server entry point** moved from `server.js` to `server/index.js`
2. **Frontend JS** reorganized into `public/js/`
3. **CSS** moved to `public/css/`
4. **New modules** created for better separation of concerns

### Step 3: Update Environment Variables

Your `.env` file is compatible. New optional variables for future features:

```env
# WHAPI (WhatsApp/Telegram) - Optional
WHAPI_BASE_URL=https://api.whapi.com
WHAPI_TOKEN=your_whapi_token

# Webhook verification - Optional
WHAPI_VERIFY_TOKEN=your_verify_token
```

### Step 4: Update Start Command

**Old:**
```bash
node server.js
```

**New:**
```bash
node server/index.js
```

Or use npm scripts:
```bash
npm start    # Production
npm run dev  # Development
```

### Step 5: Test Locally

1. Start the server:
   ```bash
   npm start
   ```

2. Open browser: http://localhost:3000

3. Test these endpoints:
   - Health: http://localhost:3000/health
   - Auth Status: http://localhost:3000/auth/status
   - Main App: http://localhost:3000

4. Test authentication:
   - Click "Continue with Google"
   - Verify login works
   - Test content generation

### Step 6: Verify All Features

| Feature | Test | Status |
|---------|------|--------|
| Google Login | Click login button | ⏳ To test |
| Facebook Login | Click login button | ⏳ To test |
| Content Generation | Submit YouTube URL | ⏳ To test |
| CSRF Protection | Check network tab | ⏳ To test |
| Session Management | Logout and re-login | ⏳ To test |

---

## 📦 Module Mapping

### Backend Routes

| Old Path | New Path | Notes |
|----------|----------|-------|
| `server.js` (auth routes) | `server/routes/auth.routes.js` | Same functionality |
| `server.js` (API routes) | `server/routes/ai.routes.js` | Same functionality |
| N/A | `server/routes/webhook.routes.js` | New - for WhatsApp/Telegram |
| N/A | `server/routes/health.routes.js` | New - health checks |

### Controllers

| Old Location | New Location | Notes |
|--------------|--------------|-------|
| `routes/auth.js` | `controllers/auth.controller.js` | Logic extracted |
| `server.js` | `controllers/ai.controller.js` | Logic extracted |

### Services

| Old Location | New Location | Notes |
|--------------|--------------|-------|
| `utils/prompt.js` | `services/ai.service.js` | AI logic |
| `utils/videoProcessor.js` | `services/video.service.js` | Video processing |
| N/A | `services/whapi.service.js` | New - messaging |

### Middleware

| Old Location | New Location | Notes |
|--------------|--------------|-------|
| `middleware/auth.js` | `middleware/requireAuth.js` | Renamed |
| `middleware/csrf.js` | `middleware/csrf.js` | Same |
| N/A | `middleware/errorHandler.js` | New |
| N/A | `middleware/requestLogger.js` | New |

### Frontend

| Old File | New Files | Notes |
|----------|-----------|-------|
| `script.js` | `js/app.js`, `js/ui.js` | Split |
| `auth-ui.js` | `js/auth.js` | Reorganized |
| N/A | `js/api.js` | New - API client |
| `styles.css` | `css/styles.css` | Moved |

---

## 🔧 Configuration Changes

### package.json

**Changes:**
- Version: `2.0.0` → `3.0.0`
- Main: `server.js` → `server/index.js`
- Scripts updated for new entry point
- Added `engines` field

### .env

**No breaking changes.** Your existing `.env` is fully compatible.

---

## 🐛 Troubleshooting

### Server won't start

**Error:** `Cannot find module 'server/index.js'`

**Solution:** Make sure you're running from the project root:
```bash
cd "C:\Users\yongk\OneDrive\Desktop\xhs contents generator"
node server/index.js
```

### Frontend not loading

**Error:** 404 for CSS or JS files

**Solution:** Check the paths in `index.html`:
```html
<link rel="stylesheet" href="css/styles.css">
<script type="module" src="js/app.js"></script>
```

### Auth not working

**Error:** Firebase not configured

**Solution:** Verify `public/firebase-config.js` has your Firebase config.

### CSRF errors

**Error:** `CSRF token header not found`

**Solution:** The new `api.js` automatically handles CSRF. Make sure you're using the new frontend files.

---

## 📊 Rollback Plan

If you need to rollback to v2.0:

1. Stop the server
2. Delete current project folder
3. Rename backup folder:
   ```bash
   ren "xhs contents generator - backup before refactor" "xhs contents generator"
   ```
4. Start with old command:
   ```bash
   node server.js
   ```

---

## ✅ Migration Checklist

- [ ] Backup created (✅ Done)
- [ ] New structure created (✅ Done)
- [ ] Environment variables reviewed
- [ ] Server starts successfully
- [ ] Health endpoint works (`/health`)
- [ ] Frontend loads correctly
- [ ] Google login works
- [ ] Facebook login works (after setup)
- [ ] Content generation works
- [ ] All routes respond correctly
- [ ] Error handling works
- [ ] CSRF protection active

---

## 📞 Support

If you encounter issues:

1. Check server logs for errors
2. Verify all files exist in new locations
3. Compare with backup if needed
4. Review error messages in browser console

---

## 🎉 Benefits of New Structure

1. **Modular:** Easy to find and modify code
2. **Scalable:** Add new features without clutter
3. **Testable:** Each module can be tested independently
4. **Maintainable:** Clear separation of concerns
5. **Production-Ready:** Error handling, logging, validation
6. **Future-Proof:** Ready for WhatsApp/Telegram integration

---

**Migration complete! Your app is now running v3.0.** 🚀
