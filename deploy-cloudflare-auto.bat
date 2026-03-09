@echo off
REM ============================================================
REM Cloudflare Deployment - Automated Helper
REM ============================================================
REM This script helps you deploy to Cloudflare + Railway
REM ============================================================

echo.
echo ============================================================
echo   Xiaohongshu Content Generator - Cloudflare Deployment
echo ============================================================
echo.
echo This will guide you through deploying to:
echo   - Railway (Backend Processing)
echo   - Cloudflare Workers (API Gateway)
echo   - Cloudflare Pages (Frontend)
echo.
echo Prerequisites:
echo   - Node.js installed
echo   - Cloudflare account
echo   - Railway account  
echo   - Supabase account
echo.
pause

echo.
echo ============================================================
echo Step 1: Installing Required Tools
echo ============================================================
echo.

echo Installing Wrangler CLI (Cloudflare Workers)...
call npm install -g wrangler

echo Installing Railway CLI...
call npm install -g @railway/cli

echo.
echo Verifying installations...
wrangler --version
railway --version

echo.
echo ============================================================
echo Step 2: Authentication
echo ============================================================
echo.

echo Logging in to Cloudflare...
wrangler login

echo Logging in to Railway...
railway login

echo.
echo ============================================================
echo Step 3: Setup Supabase Database
echo ============================================================
echo.
echo Please complete the following in your browser:
echo 1. Go to https://supabase.com/dashboard
echo 2. Open SQL Editor
echo 3. Run the file: db\supabase-schema.sql
echo 4. Copy your SUPABASE_URL and SUPABASE_SERVICE_KEY
echo.
echo Press any key when you've completed the Supabase setup...
pause

echo.
echo ============================================================
echo Step 4: Deploy Railway Backend
echo ============================================================
echo.

echo Initializing Railway project...
call railway init

echo.
echo Setting environment variables...
echo.
echo NOTE: No R2 storage needed! Using Railway local storage.
echo.

set /p SUPABASE_URL="Enter SUPABASE_URL (https://______.supabase.co): "
set /p SUPABASE_SERVICE_KEY="Enter SUPABASE_SERVICE_KEY: "

call railway variables set PORT=3000
call railway variables set NODE_ENV=production
call railway variables set AI_API_KEY=sk-f1c3545354d84d40b79c771911c694f0
call railway variables set AI_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
call railway variables set AI_MODEL=qwen-turbo
call railway variables set SUPABASE_URL=%SUPABASE_URL%
call railway variables set SUPABASE_SERVICE_KEY=%SUPABASE_SERVICE_KEY%
call railway variables set SESSION_COOKIE_NAME=__session
call railway variables set SESSION_EXPIRES_DAYS=5
call railway variables set COOKIE_SECURE=true
call railway variables set CSRF_COOKIE_NAME=csrf_token
call railway variables set TELEGRAM_BOT_TOKEN=8581922805:AAHAoihgOot9mG7fTHN4XFF_XCPwR5QQrVw

echo.
echo Uploading Firebase Service Account...
call railway upload --path "C:\Users\yongk\Downloads\contents-generator-e39c4-firebase-adminsdk-fbsvc-f32486c9d4.json"

echo.
echo Deploying to Railway...
call railway up

echo.
echo Getting Railway URL...
call railway domain

echo.
echo ============================================================
echo Step 5: Update wrangler.toml
echo ============================================================
echo.
echo Please update worker\wrangler.toml with:
echo 1. Your Cloudflare Account ID (line 9)
echo 2. Your Railway backend URL (line 16)
echo.
echo Press any key when done...
pause

echo.
echo ============================================================
echo Step 6: Create KV Namespace
echo ============================================================
echo.

cd worker

echo Creating KV namespace for rate limiting...
call wrangler kv:namespace create "RATE_LIMITER"

echo.
echo IMPORTANT: Copy the KV namespace ID from the output above
echo Then update worker\wrangler.toml with this ID (line 38)
echo.
echo Press any key to continue, then update wrangler.toml...
pause

cd ..

echo.
echo ============================================================
echo Step 7: Set Cloudflare Worker Secrets
echo ============================================================
echo.

cd worker

echo Setting Supabase secrets...
call wrangler secret put SUPABASE_URL
call wrangler secret put SUPABASE_SERVICE_KEY

echo Setting Telegram secret...
call wrangler secret put TELEGRAM_BOT_TOKEN

echo Setting Firebase secrets...
call wrangler secret put FIREBASE_PROJECT_ID
call wrangler secret put FIREBASE_CLIENT_EMAIL
call wrangler secret put FIREBASE_PRIVATE_KEY

cd ..

echo.
echo ============================================================
echo Step 8: Deploy Cloudflare Worker
echo ============================================================
echo.

cd worker
call wrangler deploy
cd ..

echo.
echo ============================================================
echo Step 9: Configure Telegram Webhook
echo ============================================================
echo.
echo Please enter your Cloudflare Worker URL:
set /p WORKER_URL="Worker URL (https://xhs-generator-worker.______.workers.dev): "

curl -X POST "https://api.telegram.org/bot8581922805:AAHAoihgOot9mG7fTHN4XFF_XCPwR5QQrVw/setWebhook" -d "url=%WORKER_URL%/telegram/webhook"

echo.
echo Verifying webhook...
curl "https://api.telegram.org/bot8581922805:AAHAoihgOot9mG7fTHN4XFF_XCPwR5QQrVw/getWebhookInfo"

echo.
echo ============================================================
echo Deployment Complete!
echo ============================================================
echo.
echo Your application is now deployed!
echo.
echo Test your deployment:
echo   1. Health Check: curl %WORKER_URL%/health
echo   2. Frontend: Deploy to Cloudflare Pages manually
echo   3. Telegram: Send /start to @xhs54321_bot
echo.
echo Monitor logs:
echo   - Cloudflare: wrangler tail
echo   - Railway: railway logs
echo.
pause
