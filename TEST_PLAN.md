# 🧪 Comprehensive Test Plan - Xiaohongshu Content Generator

**Version:** 3.0.0 (Local)  
**Date:** 2026-03-06  
**Status:** Ready for Testing

---

## 📋 Test Overview

**Goal:** Test all components to ensure everything works correctly.

**Estimated Time:** 90-120 minutes

**Test Environment:**
- **Web App:** http://localhost:3000
- **Health:** http://localhost:3000/health
- **Telegram Bot:** @xhs54321_bot

**Test Videos:**
- **YouTube:** https://www.youtube.com/watch?v=iDbdXTMnOmE
- **TikTok:** Any TikTok video URL

---

## ✅ Test Checklist

### 1. Server Startup (5 min)

```bash
cd "C:\Users\yongk\OneDrive\Desktop\xhs contents generator"
npm start
```

**Expected Output:**
```
Connected to SQLite database
✅ Database initialized
Initializing Firebase Admin...
✅ Firebase Admin initialized successfully
🚀 Xiaohongshu Content Generator v3.0
📺 Server running at http://localhost:3000
```

**Checklist:**
- [ ] No errors on startup
- [ ] Database connected
- [ ] Firebase initialized
- [ ] Server listening on port 3000

---

### 2. Health Endpoints (2 min)

**Test URLs in browser:**
- [ ] http://localhost:3000/health
- [ ] http://localhost:3000/health/ready
- [ ] http://localhost:3000/health/info
- [ ] http://localhost:3000/auth/status

**Expected:** All return JSON with status 200

---

### 3. Web Application (10 min)

**Visit:** http://localhost:3000

**Checklist:**
- [ ] Homepage loads successfully
- [ ] Header displays correctly
- [ ] Login buttons visible (Google, Facebook)
- [ ] Video URL input field visible
- [ ] Generate button visible
- [ ] No console errors (F12)
- [ ] CSS loads correctly
- [ ] JavaScript loads correctly

---

### 4. User Authentication (10 min)

**Google Login:**
- [ ] Click "Continue with Google"
- [ ] Login popup opens
- [ ] Can select account
- [ ] User info appears in header
- [ ] Logout button appears
- [ ] Generate button enabled

**Session:**
- [ ] Refresh page (F5)
- [ ] Still logged in
- [ ] Session persists

**Logout:**
- [ ] Click logout button
- [ ] Session cleared
- [ ] Login buttons reappear

---

### 5. YouTube Video Processing (15 min)

**Test URL:** https://www.youtube.com/watch?v=iDbdXTMnOmE

**Steps:**
1. Login to web app
2. Enter YouTube URL
3. Click "Generate Content"
4. Watch progress bar
5. Wait for completion

**Expected Flow:**
```
CREATED (0%) → DOWNLOADING_AUDIO (15%) → 
ASR_TRANSCRIBING (40%) → CLEANING_TRANSCRIPT (60%) → 
GENERATING_COPY (80%) → DONE (100%)
```

**Checklist:**
- [ ] Progress bar updates
- [ ] No errors in console
- [ ] Content generates successfully
- [ ] 3 style cards display
- [ ] Content is about actual video
- [ ] Each card has: title, hook, body, CTA, hashtags
- [ ] Copy button works on each card
- [ ] "Copy All" button works
- [ ] Toast notification appears

**Content Quality Check:**
- [ ] Titles: 15-25 characters
- [ ] Hooks: 2-4 lines
- [ ] Body: 900-1300 characters
- [ ] Hashtags: 8-12 tags
- [ ] Content relevant to video

---

### 6. TikTok Video Processing (15 min)

**Test:** Any TikTok video URL

**Steps:**
1. Login to web app
2. Enter TikTok URL
3. Click "Generate Content"
4. Wait 2-3 minutes

**Checklist:**
- [ ] Video downloads successfully
- [ ] Whisper transcription works
- [ ] Content generates successfully
- [ ] 3 style cards display
- [ ] Content is about actual video

**Note:** TikTok takes longer (2-3 min) due to Whisper transcription

---

### 7. AI Content Generation (10 min)

**Check Generated Content:**

**种草风 (Recommendation):**
- [ ] Emotional, enthusiastic tone
- [ ] Personal recommendation style
- [ ] Call-to-action for engagement

**干货风 (Tutorial):**
- [ ] Step-by-step instructions
- [ ] High information density
- [ ] Practical tips

**真实分享风 (Authentic):**
- [ ] Personal experience narrative
- [ ] Storytelling approach
- [ ] Relatable and genuine

**Check Server Logs:**
```
=== AI RESPONSE RECEIVED ===
Content length: [2000+]
=== AI RESPONSE PARSED SUCCESSFULLY ===
Summary: {...}
Number of cards: 3
```

---

### 8. Telegram Bot (15 min)

**Test in Telegram:**

**Bot Start:**
- [ ] Open Telegram
- [ ] Find: @xhs54321_bot
- [ ] Send: `/start`
- [ ] Bot responds with welcome message

**YouTube URL:**
- [ ] Send YouTube URL to bot
- [ ] Bot responds: "🚀 Generation Started!"
- [ ] Wait 1-2 minutes
- [ ] Bot sends content with buttons
- [ ] 3 style buttons appear
- [ ] Copy All button appears

**Button Clicks:**
- [ ] Click style button → Shows content
- [ ] Click Copy button → Confirms copy
- [ ] Click Back button → Returns to styles

**TikTok URL:**
- [ ] Send TikTok URL to bot
- [ ] Bot processes successfully (2-3 min)
- [ ] Content generates

**Help Command:**
- [ ] Send: `/help`
- [ ] Bot shows help message

---

### 9. Database Operations (5 min)

**Check Database:**

**Job Creation:**
- [ ] Job record created in database
- [ ] Status: CREATED
- [ ] Video URL stored

**Status Updates:**
- [ ] Status updates through stages
- [ ] Progress percentage updates

**Completion:**
- [ ] Status: DONE
- [ ] Progress: 100
- [ ] Output JSON stored

**Caching:**
- [ ] Generate for same video twice
- [ ] Second time is much faster
- [ ] Returns cached result

---

### 10. Error Handling (10 min)

**Test Error Scenarios:**

**Invalid URL:**
- [ ] Enter invalid URL
- [ ] Error message displayed
- [ ] User-friendly message

**No Authentication:**
- [ ] Logout
- [ ] Try to generate
- [ ] Prompt to login appears

**Network Error:**
- [ ] Disconnect internet
- [ ] Try to generate
- [ ] Graceful error message

**Server Restart:**
- [ ] Stop server (Ctrl+C)
- [ ] Start again (npm start)
- [ ] No infinite loops
- [ ] Server starts cleanly

---

## 📊 Test Summary

### Overall Status

| Category | Tests | Pass | Fail | Notes |
|----------|-------|------|------|-------|
| Server Startup | 1 | ⏳ | ⏳ | |
| Health Endpoints | 4 | ⏳ | ⏳ | |
| Web Application | 7 | ⏳ | ⏳ | |
| Authentication | 6 | ⏳ | ⏳ | |
| YouTube Processing | 9 | ⏳ | ⏳ | |
| TikTok Processing | 4 | ⏳ | ⏳ | |
| AI Generation | 7 | ⏳ | ⏳ | |
| Telegram Bot | 8 | ⏳ | ⏳ | |
| Database | 4 | ⏳ | ⏳ | |
| Error Handling | 5 | ⏳ | ⏳ | |
| **TOTAL** | **55** | **0** | **0** | **0%** |

---

## 🎯 Pass/Fail Criteria

### Critical Tests (Must Pass)
- [ ] Server starts without errors
- [ ] Health endpoints respond
- [ ] Google login works
- [ ] YouTube content generation works
- [ ] AI generates real content (not demo)
- [ ] Telegram bot responds
- [ ] No infinite loops or crashes

### Non-Critical (Nice to Have)
- [ ] Facebook login works
- [ ] TikTok processing works
- [ ] Caching works
- [ ] All error messages user-friendly

---

## 📝 Issues Log

| # | Issue | Severity | Status | Notes |
|---|-------|----------|--------|-------|
| 1 | | High/Med/Low | Open/Fixed | |
| 2 | | | | |
| 3 | | | | |

---

## ✅ Final Checklist

**Before marking as complete:**

- [ ] All critical tests pass
- [ ] No critical bugs
- [ ] Server stable (no crashes)
- [ ] YouTube processing works
- [ ] Telegram bot works
- [ ] AI generates quality content
- [ ] Database operations work
- [ ] Error handling graceful

---

## 🚀 Getting Started

**1. Start Server:**
```bash
cd "C:\Users\yongk\OneDrive\Desktop\xhs contents generator"
npm start
```

**2. Open Browser:**
```
http://localhost:3000
```

**3. Test Web App:**
- Login with Google
- Enter YouTube URL
- Generate content
- Check 3 styles

**4. Test Telegram Bot:**
- Open Telegram
- Find: @xhs54321_bot
- Send: `/start`
- Send YouTube URL

**5. Mark Tests:**
- Check off each item as you complete it
- Note any issues in Issues Log
- Complete summary at the end

---

**Ready to test! Good luck!** 🎉
