# 🚀 Cloudflare Deployment - Start Here!

**Simple Step-by-Step Guide to Deploy Your Xiaohongshu Content Generator**

---

## ✅ What's Already Ready

Your project is already configured for Cloudflare deployment! These files are ready:

- ✅ `worker/index.js` - Cloudflare Worker code
- ✅ `worker/auth/firebase.js` - Authentication
- ✅ `worker/middleware/rateLimit.js` - Rate limiting
- ✅ `worker/routes/api.js` - API routing
- ✅ `worker/routes/telegram.js` - Telegram bot
- ✅ `worker/wrangler.toml` - Worker configuration
- ✅ `railway.json` & `nixpacks.toml` - Railway backend
- ✅ `db/supabase-schema.sql` - Database schema
- ✅ `server/db/supabase.js` - Supabase client
- ✅ `server/services/r2.service.js` - R2 storage

---

## 📋 What You Need Before Starting

Make sure you have accounts created at:
- [ ] **Cloudflare** - https://cloudflare.com
- [ ] **Supabase** - https://supabase.com
- [ ] **Railway** - https://railway.app

And you have these credentials ready:
- Supabase URL and Service Key
- Cloudflare Account ID
- R2 Bucket credentials (if using R2)

---

## 🚀 Deploy in 3 Steps

### Step 1: Setup Supabase Database (3 min)

1. Go to https://supabase.com/dashboard
2. Create new project or select existing
3. Go to **SQL Editor**
4. Click **New Query**
5. Open file: `db/supabase-schema.sql`
6. Copy ALL content and paste into SQL Editor
7. Click **Run**
8. **Copy these values** (Settings > API):
   - SUPABASE_URL
   - SUPABASE_SERVICE_KEY

---

### Step 2: Deploy Railway Backend (5 min)

Open **PowerShell** or **Command Prompt** in your project folder:

```bash
# Install Railway CLI (if not installed)
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Set environment variables (one by one):
railway variables set PORT=3000
railway variables set NODE_ENV=production
railway variables set AI_API_KEY=sk-f1c3545354d84d40b79c771911c694f0
railway variables set AI_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
railway variables set AI_MODEL=qwen-turbo
railway variables set SUPABASE_URL=YOUR_SUPABASE_URL_HERE
railway variables set SUPABASE_SERVICE_KEY=YOUR_SUPABASE_SERVICE_KEY_HERE
railway variables set SESSION_COOKIE_NAME=__session
railway variables set COOKIE_SECURE=true
railway variables set TELEGRAM_BOT_TOKEN=8581922805:AAHAoihgOot9mG7fTHN4XFF_XCPwR5QQrVw

# Upload Firebase service account
railway upload --path "C:\Users\yongk\Downloads\contents-generator-e39c4-firebase-adminsdk-fbsvc-f32486c9d4.json"

# Deploy!
railway up

# Get your Railway URL
railway domain
```

**Copy your Railway URL** (e.g., `https://xhs-generator-production.up.railway.app`)

---

### Step 3: Deploy Cloudflare Worker (5 min)

```bash
# Install Wrangler CLI (if not installed)
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Go to worker directory
cd worker

# Create KV namespace for rate limiting
wrangler kv:namespace create "RATE_LIMITER"
# Copy the ID it gives you

# Edit wrangler.toml:
# - Add your Cloudflare account_id (from dashboard right sidebar)
# - Add Railway URL you just got
# - Add KV namespace ID you just created
nano wrangler.toml  # or use notepad

# Set secrets
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_KEY
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put FIREBASE_PROJECT_ID
wrangler secret put FIREBASE_CLIENT_EMAIL
wrangler secret put FIREBASE_PRIVATE_KEY

# Deploy!
wrangler deploy
```

**Copy your Worker URL** (e.g., `https://xhs-generator-worker.your-subdomain.workers.dev`)

---

## ✅ Test Your Deployment

### Test 1: Health Check
```bash
curl https://your-worker.workers.dev/health
```

### Test 2: Frontend
Deploy frontend to Cloudflare Pages:
1. Go to https://dash.cloudflare.com > Workers & Pages
2. Create Application > Pages
3. Connect to Git OR Direct Upload
4. Upload `public/` folder contents
5. Set environment variables (Firebase config)

### Test 3: Login
Open your Pages URL and test Google login

### Test 4: Content Generation
Paste a YouTube URL and generate content

### Test 5: Telegram Bot
```bash
# Set webhook
curl -X POST "https://api.telegram.org/bot8581922805:AAHAoihgOot9mG7fTHN4XFF_XCPwR5QQrVw/setWebhook" \
  -d "url=https://your-worker.workers.dev/telegram/webhook"

# Test in Telegram app
# Send /start to @xhs54321_bot
```

---

## 📚 Need More Help?

- **Complete Guide:** `DEPLOYMENT.md` (detailed instructions)
- **Quick Reference:** `CLOUDFLARE_DEPLOYMENT_QUICKSTART.md`
- **Summary:** `CLOUDFLARE_DEPLOYMENT_SUMMARY.md`

---

## 🆘 Common Issues

**Worker returns 503:**
- Check Railway is running: `railway logs`
- Verify Railway URL in wrangler.toml

**Authentication fails:**
- Check Firebase service account uploaded: `railway upload --path ...`
- Verify secrets are set: `wrangler secret list`

**CORS errors:**
- Update CORS_ALLOWED_ORIGIN in wrangler.toml
- Redeploy: `wrangler deploy`

---

## 💰 Cost

- **Cloudflare Pages:** FREE
- **Cloudflare Workers:** FREE (100k requests/day)
- **Railway:** ~$5-15/month
- **Supabase:** FREE (500MB)
- **DashScope AI:** ~$0.01 per video

**Total: ~$5-15/month** (plus AI costs)

---

**Ready to deploy?** Start with Step 1! 🎉
