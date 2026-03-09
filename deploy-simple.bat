@echo off
REM ============================================================
REM Simple Cloudflare Deployment - No KV Namespace Needed
REM ============================================================
REM This version skips KV namespace to avoid the async error
REM ============================================================

echo.
echo ============================================================
echo   Deploying Cloudflare Worker - Simple Version
echo ============================================================
echo.

cd worker

echo Step 1: Setting Secrets...
echo.

echo Setting SUPABASE_URL...
echo Paste: https://qoeonjcbifechzhksuee.supabase.co
wrangler secret put SUPABASE_URL

echo.
echo Setting SUPABASE_SERVICE_KEY...
echo Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvZW9uamNiaWZlY2h6aGtzdWVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzAwNzk4MSwiZXhwIjoyMDg4NTgzOTgxfQ.kBLbYxSv0SkEog2H8gJ2SgQJ6DCrA24F_ALwAgwWNeo
wrangler secret put SUPABASE_SERVICE_KEY

echo.
echo Setting TELEGRAM_BOT_TOKEN...
echo Paste: 8581922805:AAHAoihgOot9mG7fTHN4XFF_XCPwR5QQrVw
wrangler secret put TELEGRAM_BOT_TOKEN

echo.
echo ============================================================
echo Step 2: Deploying Worker...
echo ============================================================
echo.

wrangler deploy --no-bundle

echo.
echo ============================================================
echo Deployment Complete!
echo ============================================================
echo.
echo Your Worker URL is shown above. Copy it!
echo.

cd ..

pause
