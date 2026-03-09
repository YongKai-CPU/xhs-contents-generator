@echo off
REM ============================================================
REM Cloudflare Deployment - Automated with Your Credentials
REM ============================================================
REM This script will deploy your app to Railway and Cloudflare
REM ============================================================

echo.
echo ============================================================
echo   Xiaohongshu Content Generator - Cloudflare Deployment
echo ============================================================
echo.
echo Starting deployment with your credentials...
echo.

cd worker

echo ============================================================
echo Step 1: Creating KV Namespace for Rate Limiting
echo ============================================================
echo.

wrangler kv:namespace create "RATE_LIMITER"

echo.
echo IMPORTANT: Copy the KV namespace ID from above!
echo.
set /p KV_ID="Enter the KV Namespace ID here: "

echo.
echo Updating wrangler.toml with KV ID...
(
  for /f "delims=" %%a in ('findstr /n "^" wrangler.toml') do (
    set "line=%%a"
    setlocal enabledelayedexpansion
    set "line=!line:*:=!"
    echo !line:YOUR_KV_NAMESPACE_ID=%KV_ID%!
    endlocal
  )
) > wrangler.tmp && move /y wrangler.tmp wrangler.toml >nul

echo.
echo ============================================================
echo Step 2: Setting Cloudflare Worker Secrets
echo ============================================================
echo.

echo Setting SUPABASE_URL...
wrangler secret put SUPABASE_URL
echo Paste this: https://qoeonjcbifechzhksuee.supabase.co
echo.

echo Setting SUPABASE_SERVICE_KEY...
wrangler secret put SUPABASE_SERVICE_KEY
echo Paste this: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvZW9uamNiaWZlY2h6aGtzdWVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzAwNzk4MSwiZXhwIjoyMDg4NTgzOTgxfQ.kBLbYxSv0SkEog2H8gJ2SgQJ6DCrA24F_ALwAgwWNeo
echo.

echo Setting TELEGRAM_BOT_TOKEN...
wrangler secret put TELEGRAM_BOT_TOKEN
echo Paste this: 8581922805:AAHAoihgOot9mG7fTHN4XFF_XCPwR5QQrVw
echo.

echo.
echo ============================================================
echo Step 3: Deploying Cloudflare Worker
echo ============================================================
echo.

wrangler deploy

echo.
echo ============================================================
echo Cloudflare Worker Deployed!
echo ============================================================
echo.
echo Copy your Worker URL from above!
echo.

cd ..

echo ============================================================
echo Next Steps:
echo ============================================================
echo.
echo 1. Copy your Worker URL
echo 2. Update Railway backend URL in worker/wrangler.toml
echo 3. Deploy Railway backend (see DEPLOY_SIMPLIFIED.txt)
echo.
pause
