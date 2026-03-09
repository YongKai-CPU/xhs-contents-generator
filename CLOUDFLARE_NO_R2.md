# 🚀 Cloudflare Deployment - NO R2 Required!

**Simplified deployment without Cloudflare R2 storage**

---

## ✅ What Changed

- ❌ **Removed:** Cloudflare R2 storage (no payment validation needed!)
- ✅ **Using:** Railway local storage instead
- ✅ **Simpler:** Fewer secrets to configure
- ✅ **Cheaper:** No R2 storage costs

---

## 📋 What You Need

Just these credentials:

1. **Supabase** (2 values):
   - SUPABASE_URL
   - SUPABASE_SERVICE_KEY

2. **Cloudflare** (1 value):
   - Account ID (from dashboard)

3. **Firebase** (already have):
   - Service account JSON file

**That's it!** No R2, no complex storage setup.

---

## 🚀 Deploy in 3 Simple Steps

### Step 1: Supabase Database (3 min)

1. Go to https://supabase.com/dashboard
2. Create project or select existing
3. Go to **SQL Editor**
4. Run: `db/supabase-schema.sql`
5. Go to **Settings > API**
6. Copy:
   - **SUPABASE_URL**
   - **SUPABASE_SERVICE_KEY**

---

### Step 2: Railway Backend (5 min)

```bash
# Login
railway login

# Initialize
railway init

# Set environment variables (only what you need!)
railway variables set PORT=3000
railway variables set NODE_ENV=production
railway variables set AI_API_KEY=sk-f1c3545354d84d40b79c771911c694f0
railway variables set AI_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
railway variables set AI_MODEL=qwen-turbo
railway variables set SUPABASE_URL=YOUR_URL_HERE
railway variables set SUPABASE_SERVICE_KEY=YOUR_KEY_HERE
railway variables set SESSION_COOKIE_NAME=__session
railway variables set COOKIE_SECURE=true
railway variables set TELEGRAM_BOT_TOKEN=8581922805:AAHAoihgOot9mG7fTHN4XFF_XCPwR5QQrVw

# Upload Firebase service account
railway upload --path "C:\Users\yongk\Downloads\contents-generator-e39c4-firebase-adminsdk-fbsvc-f32486c9d4.json"

# Deploy
railway up

# Get your URL
railway domain
```

**Storage:** Railway provides 20GB persistent storage automatically!

---

### Step 3: Cloudflare Worker (5 min)

```bash
# Login
wrangler login

# Go to worker directory
cd worker

# Create KV namespace (for rate limiting only)
wrangler kv:namespace create "RATE_LIMITER"
# Copy the ID

# Edit wrangler.toml:
# - Add account_id (line 9)
# - Add Railway URL (line 16)
# - Add KV ID (line 29)
notepad wrangler.toml

# Set secrets (only 3!)
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_KEY
wrangler secret put TELEGRAM_BOT_TOKEN

# Note: NO R2 secrets needed!
# Note: Firebase secrets optional (Railway handles auth)

# Deploy
wrangler deploy
```

---

## ✅ Test Your Deployment

```bash
# Health check
curl https://your-worker.workers.dev/health

# Should return: {"status":"ok"}
```

---

## 📊 Storage Comparison

| Feature | With R2 | Without R2 |
|---------|---------|------------|
| **Setup** | Complex (R2 + API tokens) | Simple (local storage) |
| **Payment** | Requires validation | No payment needed |
| **Storage** | Cloudflare R2 | Railway (20GB included) |
| **Cost** | ~$0.25/month | FREE |
| **Performance** | Slightly faster CDN | Fast enough for audio files |
| **Maintenance** | More config | Less config |

**Recommendation:** Use Railway local storage for now. Switch to R2 later if needed.

---

## 🗑️ How Railway Storage Works

Railway provides **persistent volumes** automatically:

```
Railway Container
├── /app (your code)
├── /app/storage/audio/  ← Audio files stored here
└── /app/jobs.db  ← SQLite database (if not using Supabase)
```

**Key points:**
- Files persist across deploys
- 20GB included free
- No extra configuration needed
- Works automatically with your existing code

---

## 🔄 Your Code Already Supports This!

Your `server/services/r2.service.js` has built-in fallback:

```javascript
if (!accountId || !accessKeyId || !secretAccessKey) {
  console.warn('⚠️  R2 not configured - using local storage fallback');
  return null;  // Uses local storage instead
}
```

So it **automatically uses Railway storage** when R2 is not configured!

---

## 📝 Updated Deployment Checklist

### What You DON'T Need Anymore:
- ❌ R2 bucket creation
- ❌ R2 API tokens
- ❌ R2_ACCOUNT_ID
- ❌ R2_ACCESS_KEY_ID
- ❌ R2_SECRET_ACCESS_KEY
- ❌ Payment validation for R2

### What You DO Need:
- ✅ Supabase URL
- ✅ Supabase Service Key
- ✅ Cloudflare Account ID
- ✅ Railway account
- ✅ Firebase service account (already have)

---

## 🎯 Simplified Secrets

### Railway Environment Variables (9 total):
```bash
PORT=3000
NODE_ENV=production
AI_API_KEY=sk-f1c3545354d84d40b79c771911c694f0
AI_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
AI_MODEL=qwen-turbo
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
SESSION_COOKIE_NAME=__session
COOKIE_SECURE=true
TELEGRAM_BOT_TOKEN=...
```

### Cloudflare Worker Secrets (3 total):
```bash
SUPABASE_URL
SUPABASE_SERVICE_KEY
TELEGRAM_BOT_TOKEN
```

**Before:** 12+ secrets  
**Now:** 12 secrets (3 for Worker, 9 for Railway)  
**Simplified by:** Removing R2 complexity!

---

## 🆘 Troubleshooting

### "Where are my audio files stored?"
Railway stores them in `/app/storage/audio/` automatically.

### "Will files persist after deploy?"
Yes! Railway provides persistent storage.

### "What if I need more than 20GB?"
Railway charges $0.20/GB after 20GB. Still cheaper than managing R2!

### "Can I switch to R2 later?"
Yes! Just add R2 credentials and the app will use it automatically.

---

## 💰 Cost Breakdown (No R2)

| Service | Cost |
|---------|------|
| Cloudflare Workers | FREE (100k/day) |
| Cloudflare Pages | FREE |
| Railway | FREE (500hrs/month) + $5-10 for storage |
| Supabase | FREE (500MB) |
| **Total** | **~$5-15/month** |

**vs With R2:** Same cost, but **simpler setup!**

---

## 🎉 Ready to Deploy!

1. Follow the 3 steps above
2. No R2 needed!
3. No payment validation!
4. Just deploy and go!

**Your simplified deployment starts now!** 🚀

---

**Updated:** 2026-03-09  
**Status:** ✅ R2-Free, Simpler Deployment
