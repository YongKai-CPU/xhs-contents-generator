# 🚀 Cloudflare Deployment - Quick Start

**Xiaohongshu Content Generator v4.0 - Production Ready**

This document provides a quick reference for deploying your Xiaohongshu Content Generator to Cloudflare + Railway.

---

## 📁 Files Created

### Cloudflare Worker (Edge Layer)
- `worker/index.js` - Main Worker entry point
- `worker/wrangler.toml` - Worker configuration
- `worker/auth/firebase.js` - Firebase JWT verification
- `worker/middleware/rateLimit.js` - Rate limiting
- `worker/routes/api.js` - API routing
- `worker/routes/telegram.js` - Telegram bot handler

### Railway Backend (Processing Layer)
- `railway.json` - Railway deployment config
- `nixpacks.toml` - Build configuration
- `server/db/supabase.js` - Supabase client
- `server/services/r2.service.js` - R2 storage service
- `server/app.js` - Updated for production

### Database & Storage
- `db/supabase-schema.sql` - PostgreSQL schema

### Frontend
- `public/js/api-cloudflare.js` - Cloudflare-compatible API client

### Configuration
- `.env.production.example` - Production environment template
- `DEPLOYMENT.md` - Complete deployment guide (400+ lines)

---

## ⚡ Quick Deploy (5 Minutes)

### 1. Supabase (1 min)
```bash
# 1. Create project at https://supabase.com
# 2. Go to SQL Editor
# 3. Run: db/supabase-schema.sql
# 4. Copy SUPABASE_URL and SUPABASE_SERVICE_KEY
```

### 2. Cloudflare R2 (1 min)
```bash
# 1. Cloudflare Dashboard > R2 > Create Bucket: xhs-artifacts
# 2. Create API Token (Read/Write)
# 3. Copy Account ID, Access Key, Secret Key
```

### 3. Railway Backend (2 min)
```bash
# Install CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway init
railway variables set SUPABASE_URL=your_url
railway variables set SUPABASE_SERVICE_KEY=your_key
railway variables set R2_ACCOUNT_ID=your_id
railway variables set R2_ACCESS_KEY_ID=your_key
railway variables set R2_SECRET_ACCESS_KEY=your_secret
railway variables set AI_API_KEY=sk-your_key
railway upload --path ./serviceAccountKey.json

# Deploy
railway up
```

### 4. Cloudflare Worker (1 min)
```bash
# Install Wrangler
npm install -g wrangler

# Login
wrangler login

# Configure
cd worker
# Edit wrangler.toml with your account_id

# Set secrets
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_KEY
wrangler secret put TELEGRAM_BOT_TOKEN

# Deploy
wrangler deploy
```

### 5. Cloudflare Pages (< 1 min)
```bash
# 1. Cloudflare Dashboard > Pages > Create Project
# 2. Connect GitHub repository
# 3. Build output directory: public
# 4. Deploy
```

---

## 🔑 Required Credentials

Get these before starting:

| Service | Where to Get | Required For |
|---------|-------------|--------------|
| **Supabase URL** | Supabase Dashboard > Settings > API | Railway + Worker |
| **Supabase Service Key** | Supabase Dashboard > Settings > API | Railway + Worker |
| **R2 Account ID** | Cloudflare Dashboard (right sidebar) | Railway + Worker |
| **R2 Access Key** | R2 > API Tokens | Railway + Worker |
| **R2 Secret Key** | R2 > API Tokens | Railway + Worker |
| **AI API Key** | https://dashscope.console.aliyun.com | Railway |
| **Firebase Service Account** | Firebase Console > Service Accounts | Railway |
| **Telegram Bot Token** | @BotFather on Telegram | Railway + Worker |

---

## 📊 Architecture

```
User → Cloudflare Pages (Frontend)
          ↓
User → Cloudflare Worker (API Gateway + Telegram Bot)
          ↓
User → Railway Backend (Video Processing + AI)
          ↓
      Supabase (DB) + R2 (Storage)
```

---

## 🧪 Testing Checklist

After deployment, verify:

```bash
# 1. Health Check
curl https://your-worker.workers.dev/health

# 2. Backend Connection
curl https://your-worker.workers.dev/health/ready

# 3. Frontend
open https://your-pages.pages.dev

# 4. Authentication
# Login with Google/Facebook

# 5. Content Generation
# Paste YouTube URL and generate

# 6. Telegram Bot
# Send /start to @xhs54321_bot
```

---

## 📝 Environment Variables

### Railway (Backend)
```bash
PORT=3000
NODE_ENV=production
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=xxx
R2_ACCOUNT_ID=xxx
R2_BUCKET_NAME=xhs-artifacts
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
AI_API_KEY=sk-xxx
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
SESSION_COOKIE_NAME=__session
COOKIE_SECURE=true
TELEGRAM_BOT_TOKEN=xxx
TELEGRAM_WEBHOOK_URL=https://your-domain.com/telegram/webhook
```

### Cloudflare Worker (Secrets)
```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_KEY
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put FIREBASE_PROJECT_ID
wrangler secret put FIREBASE_CLIENT_EMAIL
wrangler secret put FIREBASE_PRIVATE_KEY
```

---

## 🐛 Common Issues

### Worker returns 503
```bash
# Check Railway backend
curl https://your-app.railway.app/health

# Check Railway logs
railway logs
```

### CORS errors
```bash
# Update Railway CORS
railway variables set CORS_ALLOWED_ORIGINS=https://www.yourdomain.com

# Update Worker CORS (wrangler.toml)
[vars]
CORS_ALLOWED_ORIGIN = "https://www.yourdomain.com"
```

### Authentication fails
```bash
# Re-upload Firebase service account
railway upload --path ./serviceAccountKey.json
```

---

## 💰 Cost Estimation

| Service | 1k users/mo | 10k users/mo | 100k users/mo |
|---------|-------------|--------------|---------------|
| Cloudflare Pages | FREE | FREE | FREE |
| Cloudflare Workers | FREE | FREE | $5 |
| Supabase | FREE | FREE → $25 | $25 |
| R2 Storage | ~$0.03 | ~$0.25 | ~$3 |
| Railway | ~$5 | ~$15 | ~$50 |
| DashScope (AI) | ~$10 | ~$100 | ~$1000 |
| **Total** | **~$15** | **~$115-140** | **~$1078** |

---

## 📚 Documentation

- **Complete Guide:** `DEPLOYMENT.md` (400+ lines)
- **Environment Template:** `.env.production.example`
- **Database Schema:** `db/supabase-schema.sql`
- **Worker Code:** `worker/` directory
- **Backend Code:** `server/` directory

---

## 🆘 Getting Help

1. Check `DEPLOYMENT.md` for detailed instructions
2. Review Railway logs: `railway logs`
3. Check Worker logs: `wrangler tail`
4. Test endpoints with curl
5. Verify environment variables are set

---

## ✅ Deployment Complete!

When everything is working:

- ✅ Frontend loads at https://your-pages.pages.dev
- ✅ Login with Google/Facebook works
- ✅ Video URL generates content in 3 styles
- ✅ Telegram bot responds to commands
- ✅ Database stores jobs in Supabase
- ✅ Files upload to R2 storage

**🎉 Congratulations! Your Xiaohongshu Content Generator is production-ready!**

---

**Version:** 4.0.0  
**Last Updated:** 2026-03-09  
**Status:** Production Ready
