# 📋 Cloudflare Deployment Checklist

**Track your deployment progress here**

---

## ✅ Pre-Deployment (Done)

- [x] CLI tools installed (wrangler, railway)
- [ ] Cloudflare account created
- [ ] Railway account created
- [ ] Supabase account created

---

## 🗄️ Step 1: Supabase Database

- [ ] Go to https://supabase.com/dashboard
- [ ] Create or select project
- [ ] Open SQL Editor
- [ ] Run `db/supabase-schema.sql`
- [ ] Verify tables created (users, jobs, artifacts)
- [ ] Copy SUPABASE_URL: ________________________________
- [ ] Copy SUPABASE_SERVICE_KEY: ________________________________

---

## 🚂 Step 2: Railway Backend

- [ ] Run: `railway login`
- [ ] Run: `railway init`
- [ ] Set environment variables:
  - [ ] PORT=3000
  - [ ] NODE_ENV=production
  - [ ] AI_API_KEY=sk-f1c3545354d84d40b79c771911c694f0
  - [ ] SUPABASE_URL=_________________
  - [ ] SUPABASE_SERVICE_KEY=_________________
  - [ ] SESSION_COOKIE_NAME=__session
  - [ ] COOKIE_SECURE=true
  - [ ] TELEGRAM_BOT_TOKEN=8581922805:AAHAoihgOot9mG7fTHN4XFF_XCPwR5QQrVw
- [ ] Upload Firebase: `railway upload --path "C:\Users\yongk\Downloads\contents-generator-e39c4-firebase-adminsdk-fbsvc-f32486c9d4.json"`
- [ ] Deploy: `railway up`
- [ ] Get URL: `railway domain`
- [ ] Railway URL: ________________________________

---

## ☁️ Step 3: Cloudflare Worker

- [ ] Get Account ID from https://dash.cloudflare.com (right sidebar)
- [ ] Cloudflare Account ID: ________________________________
- [ ] Update `worker/wrangler.toml`:
  - [ ] Add account_id (line 9)
  - [ ] Add RAILWAY_BACKEND_URL (line 16)
  - [ ] Add KV namespace ID (line 29)
- [ ] Create KV namespace: `cd worker && wrangler kv:namespace create "RATE_LIMITER"`
- [ ] KV Namespace ID: ________________________________
- [ ] Set secrets (ONLY 3!):
  - [ ] `wrangler secret put SUPABASE_URL`
  - [ ] `wrangler secret put SUPABASE_SERVICE_KEY`
  - [ ] `wrangler secret put TELEGRAM_BOT_TOKEN`
  - [ ] Optional: `wrangler secret put FIREBASE_PROJECT_ID`
  - [ ] Optional: `wrangler secret put FIREBASE_CLIENT_EMAIL`
  - [ ] Optional: `wrangler secret put FIREBASE_PRIVATE_KEY`
- [ ] Deploy: `wrangler deploy`
- [ ] Worker URL: ________________________________

---

## 🌐 Step 4: Cloudflare Pages (Frontend)

- [ ] Go to https://dash.cloudflare.com > Workers & Pages
- [ ] Create Application > Pages
- [ ] Choose: Direct Upload
- [ ] Upload all files from `public/` folder
- [ ] Name: xhs-generator
- [ ] Set environment variables:
  - [ ] FIREBASE_API_KEY=AIzaSyAnBEYEUYScUnh8TrUVPD6-V8vdJTueluA
  - [ ] FIREBASE_AUTH_DOMAIN=contents-generator-e39c4.firebaseapp.com
  - [ ] FIREBASE_PROJECT_ID=contents-generator-e39c4
- [ ] Pages URL: ________________________________

---

## 🤖 Step 5: Telegram Bot

- [ ] Set webhook: 
  ```bash
  curl -X POST "https://api.telegram.org/bot8581922805:AAHAoihgOot9mG7fTHN4XFF_XCPwR5QQrVw/setWebhook" \
    -d "url=YOUR_WORKER_URL/telegram/webhook"
  ```
- [ ] Verify: `curl "https://api.telegram.org/bot8581922805:AAHAoihgOot9mG7fTHN4XFF_XCPwR5QQrVw/getWebhookInfo"`
- [ ] Test in Telegram: Send `/start` to @xhs54321_bot

---

## ✅ Step 6: Testing

- [ ] Health check: `curl https://YOUR_WORKER_URL/health`
- [ ] Frontend loads: Open Pages URL in browser
- [ ] Login works: Click "Continue with Google"
- [ ] Content generation: Paste YouTube URL
- [ ] Telegram bot responds

---

## 📝 Credentials Log

**Supabase:**
- URL: ________________________________
- Service Key: ________________________________

**Cloudflare:**
- Account ID: ________________________________
- Worker URL: ________________________________
- KV Namespace ID: ________________________________

**Railway:**
- Backend URL: ________________________________

**Cloudflare Pages:**
- Pages URL: ________________________________

---

## 🆘 Quick Commands Reference

```bash
# Login
wrangler login
railway login

# Railway
railway init
railway variables set KEY=value
railway upload --path file.json
railway up
railway domain
railway logs

# Cloudflare Worker
cd worker
wrangler kv:namespace create "RATE_LIMITER"
wrangler secret put SECRET_NAME
wrangler deploy
wrangler tail

# Test
curl https://YOUR_WORKER_URL/health
```

---

**Need help?** Check `DEPLOYMENT.md` for detailed instructions!
