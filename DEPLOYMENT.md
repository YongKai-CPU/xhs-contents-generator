# 🚀 Cloudflare Deployment Guide

**Xiaohongshu Content Generator v4.0 - Production Deployment**

Complete guide for deploying to Cloudflare Pages + Workers + Railway backend with Supabase database and R2 storage.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: Supabase Database Setup](#step-1-supabase-database-setup)
4. [Step 2: Cloudflare R2 Storage Setup](#step-2-cloudflare-r2-storage-setup)
5. [Step 3: Railway Backend Deployment](#step-3-railway-backend-deployment)
6. [Step 4: Cloudflare Worker Deployment](#step-4-cloudflare-worker-deployment)
7. [Step 5: Cloudflare Pages Deployment](#step-5-cloudflare-pages-deployment)
8. [Step 6: Telegram Bot Configuration](#step-6-telegram-bot-configuration)
9. [Step 7: Custom Domain Setup](#step-7-custom-domain-setup)
10. [Step 8: Testing & Verification](#step-8-testing--verification)
11. [Troubleshooting](#troubleshooting)
12. [Cost Estimation](#cost-estimation)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER LAYER                               │
│   Web Users (Browser)  │  Telegram Users (Mobile)               │
└───────────┬───────────┴──────────────┬──────────────────────────┘
            │                          │
            ▼                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EDGE LAYER (Cloudflare)                     │
│  ┌─────────────────────┐        ┌─────────────────────────────┐ │
│  │  Cloudflare Pages   │        │   Cloudflare Workers        │ │
│  │   (Frontend)        │        │   (API Gateway + Bot)       │ │
│  └─────────────────────┘        └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PROCESSING LAYER (Railway)                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Express.js + Python + ffmpeg + yt-dlp + Whisper          │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                  │
│  ┌─────────────────────┐        ┌─────────────────────────────┐ │
│  │   Supabase (DB)     │        │   Cloudflare R2 (Storage)   │ │
│  │   PostgreSQL        │        │   Audio, Transcripts        │ │
│  └─────────────────────┘        └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Service Responsibilities

| Service | Responsibility | Cost (10k users/mo) |
|---------|---------------|---------------------|
| **Cloudflare Pages** | Frontend hosting, CDN | FREE |
| **Cloudflare Workers** | API gateway, auth, Telegram bot | FREE |
| **Supabase** | PostgreSQL database, user data | FREE → $25 |
| **Cloudflare R2** | Audio files, transcripts, artifacts | ~$0.25 |
| **Railway** | Video processing, Whisper, ffmpeg | ~$15 |
| **DashScope** | Qwen AI content generation | ~$100 |
| **Firebase** | Authentication (Google, Facebook) | FREE |

**Total Estimated Cost:** ~$115-140/month for 10k users

---

## Prerequisites

### Accounts Required

- [ ] **Cloudflare Account** - https://cloudflare.com
- [ ] **Railway Account** - https://railway.app
- [ ] **Supabase Account** - https://supabase.com
- [ ] **Firebase Account** - https://firebase.google.com
- [ ] **Telegram Account** - For bot (@BotFather)
- [ ] **DashScope Account** - https://dashscope.console.aliyun.com (for Qwen AI)

### Tools Required

```bash
# Node.js (v18+)
node --version

# npm
npm --version

# Wrangler CLI (Cloudflare Workers)
npm install -g wrangler

# Railway CLI (optional, for easier deployment)
npm install -g @railway/cli
```

### Git Repository

Ensure your code is in a Git repository:

```bash
git init
git add .
git commit -m "Initial commit - Cloudflare deployment ready"
```

---

## Step 1: Supabase Database Setup

### 1.1 Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Fill in:
   - **Name:** `xhs-generator`
   - **Database Password:** (save this securely)
   - **Region:** Choose closest to your users
4. Click "Create new project"

### 1.2 Run Database Schema

1. In Supabase Dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy contents from `db/supabase-schema.sql`
4. Paste and click "Run"
5. Verify tables are created:
   - `users`
   - `jobs`
   - `artifacts`
   - `api_keys`
   - `usage_stats`

### 1.3 Get Supabase Credentials

1. Go to **Settings** > **API**
2. Copy these values:
   - **Project URL:** `https://xxx.supabase.co`
   - **Service Role Key:** `eyJhbG...` (keep secret!)
   - **Anon/Public Key:** `eyJhbG...` (for frontend if needed)

### 1.4 Test Database Connection

```bash
# Test with curl (replace with your values)
curl -X GET 'https://xxx.supabase.co/rest/v1/jobs' \
  -H "apikey: your_service_role_key" \
  -H "Authorization: Bearer your_service_role_key"
```

---

## Step 2: Cloudflare R2 Storage Setup

### 2.1 Create R2 Bucket

1. Go to Cloudflare Dashboard > **R2**
2. Click "Create Bucket"
3. Name: `xhs-artifacts`
4. Click "Create bucket"

### 2.2 Create R2 API Token

1. Go to **R2** > **API Tokens**
2. Click "Create API Token"
3. Name: `xhs-generator-worker`
4. Permissions: **Object Read & Write**
5. Click "Create API Token"
6. **Save these values:**
   - Access Key ID
   - Secret Access Key

### 2.3 Get Account ID

1. Go to Cloudflare Dashboard
2. Look at the right sidebar
3. Copy **Account ID**

### 2.4 (Optional) Configure Public Access

If you want public URLs for artifacts:

1. Go to R2 bucket > **Settings**
2. Under "Public Access", click "Edit"
3. Enable public access
4. Note the public URL format: `https://pub-ACCOUNT_ID.r2.cloudflarestorage.com`

---

## Step 3: Railway Backend Deployment

### 3.1 Install Railway CLI

```bash
npm install -g @railway/cli
```

### 3.2 Login to Railway

```bash
railway login
```

### 3.3 Initialize Project

```bash
# Navigate to project root
cd "xhs contents generator"

# Initialize Railway project
railway init

# Create new project
# Select: Create new project
# Name: xhs-generator-backend
```

### 3.4 Set Environment Variables

```bash
# Server Configuration
railway variables set PORT=3000
railway variables set NODE_ENV=production

# AI API (Qwen)
railway variables set AI_API_KEY=sk-your_api_key_here
railway variables set AI_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
railway variables set AI_MODEL=qwen-turbo

# Supabase
railway variables set SUPABASE_URL=https://your-project.supabase.co
railway variables set SUPABASE_SERVICE_KEY=your_service_role_key
railway variables set SUPABASE_ANON_KEY=your_anon_key

# R2 Storage
railway variables set R2_ACCOUNT_ID=your_account_id
railway variables set R2_BUCKET_NAME=xhs-artifacts
railway variables set R2_ACCESS_KEY_ID=your_access_key
railway variables set R2_SECRET_ACCESS_KEY=your_secret_key

# Firebase
railway variables set FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json

# Session
railway variables set SESSION_COOKIE_NAME=__session
railway variables set SESSION_EXPIRES_DAYS=5
railway variables set COOKIE_SECURE=true

# CSRF
railway variables set CSRF_COOKIE_NAME=csrf_token

# Telegram
railway variables set TELEGRAM_BOT_TOKEN=your_bot_token
railway variables set TELEGRAM_WEBHOOK_URL=https://your-domain.com/telegram/webhook
```

### 3.5 Upload Firebase Service Account

```bash
# Upload service account JSON file
railway upload --path ./serviceAccountKey.json
```

### 3.6 Deploy

```bash
# Deploy to Railway
railway up

# This will:
# 1. Build with Nixpacks (using nixpacks.toml)
# 2. Install Node.js, Python, ffmpeg, yt-dlp
# 3. Start server with `node server/index.js`
```

### 3.7 Get Railway URL

```bash
# Get your app URL
railway domain

# Output: https://your-app.railway.app
```

**Save this URL** - you'll need it for Cloudflare Worker configuration.

### 3.8 Verify Deployment

```bash
# Test health endpoint
curl https://your-app.railway.app/health

# Expected response: {"status":"ok"}
```

---

## Step 4: Cloudflare Worker Deployment

### 4.1 Install Wrangler CLI

```bash
npm install -g wrangler
```

### 4.2 Login to Cloudflare

```bash
wrangler login
```

### 4.3 Update wrangler.toml

Edit `worker/wrangler.toml`:

```toml
# Replace with your values
account_id = "YOUR_ACCOUNT_ID"
zone_id = "YOUR_ZONE_ID"  # If using custom domain

[vars]
RAILWAY_BACKEND_URL = "https://your-app.railway.app"
```

### 4.4 Create KV Namespace (for Rate Limiting)

```bash
# Create KV namespace
wrangler kv:namespace create "RATE_LIMITER"

# Output: id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
# Copy this ID to wrangler.toml
```

Update `worker/wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "RATE_LIMITER"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  # Paste ID here
```

### 4.5 Set Worker Secrets

```bash
# Navigate to worker directory
cd worker

# Firebase
wrangler secret put FIREBASE_PROJECT_ID
# Enter: contents-generator-e39c4

wrangler secret put FIREBASE_CLIENT_EMAIL
# Enter: firebase-adminsdk-xxxxx@contents-generator-e39c4.iam.gserviceaccount.com

wrangler secret put FIREBASE_PRIVATE_KEY
# Enter: -----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n

# Telegram
wrangler secret put TELEGRAM_BOT_TOKEN
# Enter: your_bot_token

# Supabase
wrangler secret put SUPABASE_URL
# Enter: https://your-project.supabase.co

wrangler secret put SUPABASE_SERVICE_KEY
# Enter: your_service_role_key

# R2 (if Worker needs direct access)
wrangler secret put R2_API_TOKEN
# Enter: your_r2_api_token
```

### 4.6 Deploy Worker

```bash
# Deploy to Cloudflare
wrangler deploy

# Output:
# Published xhs-generator-worker
# https://xhs-generator-worker.your-subdomain.workers.dev
```

### 4.7 Test Worker

```bash
# Test health endpoint
curl https://xhs-generator-worker.your-subdomain.workers.dev/health

# Test readiness (proxies to Railway)
curl https://xhs-generator-worker.your-subdomain.workers.dev/health/ready
```

---

## Step 5: Cloudflare Pages Deployment

### 5.1 Connect GitHub Repository

1. Go to Cloudflare Dashboard > **Pages**
2. Click "Create a project"
3. Select "Connect to Git"
4. Choose your repository
5. Click "Begin Setup"

### 5.2 Configure Build Settings

- **Production branch:** `main` (or `master`)
- **Build command:** Leave empty (static site)
- **Build output directory:** `public`

### 5.3 Set Environment Variables

In Pages settings > **Environment Variables**:

```
FIREBASE_API_KEY=AIzaSyAnBEYEUYScUnh8TrUVPD6-V8vdJTueluA
FIREBASE_AUTH_DOMAIN=contents-generator-e39c4.firebaseapp.com
FIREBASE_PROJECT_ID=contents-generator-e39c4
```

### 5.4 Deploy

1. Click "Save and Deploy"
2. Wait for build to complete
3. Note your Pages URL: `https://xhs-generator.pages.dev`

### 5.5 Update Frontend API Configuration

Edit `public/js/api-cloudflare.js` if needed:

```javascript
const API_BASE_URL = window.location.origin; // Uses current domain
```

This automatically uses the Cloudflare domain.

---

## Step 6: Telegram Bot Configuration

### 6.1 Set Telegram Webhook

```bash
# Set webhook to your Cloudflare Worker URL
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" \
  -d "url=https://xhs-generator-worker.your-subdomain.workers.dev/telegram/webhook"

# Verify webhook
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo"
```

### 6.2 Test Bot

1. Open Telegram
2. Search for your bot: `@xhs54321_bot`
3. Send `/start`
4. Send a YouTube URL
5. Verify response

---

## Step 7: Custom Domain Setup

### 7.1 Add Domain to Cloudflare

1. Go to Cloudflare Dashboard
2. Click "Add a Site"
3. Enter your domain: `yourdomain.com`
4. Follow DNS setup instructions

### 7.2 Configure DNS Records

Add these DNS records:

```
Type: CNAME
Name: www
Content: xhs-generator.pages.dev
Proxy: Enabled (orange cloud)

Type: CNAME
Name: api
Content: xhs-generator-worker.your-subdomain.workers.dev
Proxy: Enabled (orange cloud)
```

### 7.3 Configure SSL/TLS

1. Go to **SSL/TLS** > **Overview**
2. Select **Full** mode
3. Enable **Always Use HTTPS**

### 7.4 Update Worker Configuration

Edit `worker/wrangler.toml`:

```toml
routes = [
  { pattern = "api.yourdomain.com/*", zone_name = "yourdomain.com" }
]

[vars]
CORS_ALLOWED_ORIGIN = "https://www.yourdomain.com"
```

### 7.5 Update Railway CORS

In Railway Dashboard, add environment variable:

```
CORS_ALLOWED_ORIGINS=https://www.yourdomain.com,https://yourdomain.com
```

### 7.6 Redeploy

```bash
# Redeploy Worker
cd worker
wrangler deploy
```

---

## Step 8: Testing & Verification

### 8.1 Health Checks

```bash
# Cloudflare Worker
curl https://api.yourdomain.com/health
curl https://api.yourdomain.com/health/ready
curl https://api.yourdomain.com/health/info

# Railway Backend
curl https://your-app.railway.app/health

# Cloudflare Pages (Frontend)
curl https://www.yourdomain.com
```

### 8.2 Authentication Flow

1. Open https://www.yourdomain.com
2. Click "Login with Google"
3. Complete authentication
4. Verify you're logged in
5. Check browser cookies for `__session`

### 8.3 Content Generation

1. Paste YouTube URL: `https://youtube.com/watch?v=iDbdXTMnOmE`
2. Click "Generate Content"
3. Monitor progress:
   - CREATED → DOWNLOADING_AUDIO → ASR_TRANSCRIBING → DONE
4. Verify 3 styles are generated

### 8.4 Telegram Bot

```bash
# Send message to bot
# Expected: Welcome message

# Send YouTube URL
# Expected: Acknowledgment + generated content
```

### 8.5 Database Verification

In Supabase Dashboard > **Table Editor**:

1. Check `users` table - new user created
2. Check `jobs` table - job record created
3. Check `artifacts` table - if files uploaded to R2

### 8.6 R2 Storage Verification

In Cloudflare Dashboard > **R2**:

1. Go to `xhs-artifacts` bucket
2. Verify files are uploaded
3. Check file sizes and timestamps

---

## Troubleshooting

### Worker Returns 503 Error

**Problem:** Backend not reachable

**Solution:**
```bash
# Check Railway backend
curl https://your-app.railway.app/health

# If down, check Railway logs
railway logs

# Update Worker with correct Railway URL
wrangler secret put RAILWAY_BACKEND_URL
```

### Authentication Fails

**Problem:** Firebase not configured

**Solution:**
1. Verify `serviceAccountKey.json` uploaded to Railway
2. Check Firebase credentials in Worker secrets
3. Verify Firebase project allows your domain

```bash
# Check Railway environment
railway variables list

# Re-upload service account
railway upload --path ./serviceAccountKey.json
```

### CORS Errors

**Problem:** Cross-origin requests blocked

**Solution:**
1. Update `CORS_ALLOWED_ORIGINS` in Railway
2. Update `CORS_ALLOWED_ORIGIN` in Worker
3. Ensure domains match exactly (including https://)

```bash
# Railway
railway variables set CORS_ALLOWED_ORIGINS=https://www.yourdomain.com

# Worker (wrangler.toml)
[vars]
CORS_ALLOWED_ORIGIN = "https://www.yourdomain.com"
```

### Video Processing Fails

**Problem:** yt-dlp or ffmpeg not found

**Solution:**
1. Check `nixpacks.toml` includes ffmpeg and yt-dlp
2. Verify Railway build logs
3. Test manually in Railway shell

```bash
# Open Railway shell
railway shell

# Test yt-dlp
yt-dlp --version

# Test ffmpeg
ffmpeg -version
```

### R2 Upload Fails

**Problem:** Credentials incorrect

**Solution:**
```bash
# Verify R2 credentials
railway variables set R2_ACCESS_KEY_ID=correct_key
railway variables set R2_SECRET_ACCESS_KEY=correct_secret
railway variables set R2_ACCOUNT_ID=correct_account_id

# Test R2 connection
# Add test script to verify
```

### Telegram Bot Not Responding

**Problem:** Webhook not set correctly

**Solution:**
```bash
# Check webhook status
curl "https://api.telegram.org/botTOKEN/getWebhookInfo"

# Reset webhook
curl -X POST "https://api.telegram.org/botTOKEN/setWebhook?url=https://api.yourdomain.com/telegram/webhook"
```

---

## Cost Estimation

### Monthly Costs for 10,000 Users

| Service | Plan | Usage | Cost |
|---------|------|-------|------|
| **Cloudflare Pages** | Free | 100k requests | $0 |
| **Cloudflare Workers** | Free | 1M requests | $0 |
| **Cloudflare R2** | Pay-as-you-go | 10GB storage + 100k reads | ~$0.25 |
| **Supabase** | Free → Pro | 500MB DB | $0 → $25 |
| **Railway** | Pay-as-you-go | 500 hours + 2GB RAM | ~$15 |
| **DashScope (Qwen)** | Pay-as-you-go | 10k videos × $0.01 | ~$100 |
| **Firebase** | Free | Auth (10k users) | $0 |
| **Total** | | | **~$115-140/month** |

### Scaling Costs

| Users/Month | Estimated Cost |
|-------------|----------------|
| 1,000 | ~$20-30 |
| 10,000 | ~$115-140 |
| 50,000 | ~$400-500 |
| 100,000 | ~$800-1000 |

---

## Maintenance

### Regular Tasks

1. **Weekly:**
   - Check Railway logs for errors
   - Monitor Supabase database size
   - Review R2 storage usage

2. **Monthly:**
   - Clean up old jobs (older than 30 days)
   - Review usage stats
   - Check for dependency updates

3. **Quarterly:**
   - Rotate API keys
   - Review security policies
   - Update documentation

### Cleanup Scripts

```sql
-- Run in Supabase SQL Editor
-- Cleanup old jobs (older than 30 days)
SELECT cleanup_old_jobs(30);

-- Cleanup old artifacts (older than 7 days)
SELECT cleanup_old_artifacts(7);
```

---

## Security Best Practices

1. **Never commit secrets:**
   - Add `.env.production` to `.gitignore`
   - Use Railway/Cloudflare secret management

2. **Enable HTTPS:**
   - Cloudflare provides free SSL
   - Force HTTPS in Cloudflare settings

3. **Rate Limiting:**
   - Enabled in Cloudflare Worker
   - Default: 100 requests/hour/user

4. **CORS:**
   - Restrict to your domain only
   - Don't use `*` in production

5. **Database Security:**
   - Row Level Security (RLS) enabled
   - Service role key kept secret

---

## Support & Resources

### Documentation

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Railway Docs](https://docs.railway.app/)
- [Supabase Docs](https://supabase.com/docs)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)

### Project Files

- `worker/` - Cloudflare Worker code
- `server/` - Railway backend code
- `public/` - Cloudflare Pages frontend
- `db/supabase-schema.sql` - Database schema
- `.env.production.example` - Environment template

---

**Deployment Complete!** 🎉

Your Xiaohongshu Content Generator is now running in production on Cloudflare + Railway!
