@echo off
REM ============================================================
REM Cloudflare Pages Deployment Script
REM ============================================================
REM This script deploys your frontend to Cloudflare Pages
REM using Wrangler CLI
REM ============================================================

echo.
echo ============================================================
echo   Xiaohongshu Content Generator - Cloudflare Pages Deploy
echo ============================================================
echo.

REM Check if wrangler is installed
wrangler --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Wrangler not found! Installing...
    npm install -g wrangler
)

echo.
echo ============================================================
echo Step 1: Login to Cloudflare
echo ============================================================
echo.
echo This will open your browser for authentication...
echo.

wrangler login

if %errorlevel% neq 0 (
    echo.
    echo Login failed! Please try again.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo Step 2: Deploying to Cloudflare Pages
echo ============================================================
echo.
echo Deploying public folder to Cloudflare Pages...
echo This may take 1-2 minutes...
echo.

REM Deploy to Cloudflare Pages
wrangler pages deploy public --project-name=xhs-contents-generator

if %errorlevel% neq 0 (
    echo.
    echo Deployment failed!
    pause
    exit /b 1
)

echo.
echo ============================================================
echo Deployment Complete!
echo ============================================================
echo.
echo Your site is now live at:
echo https://xhs-contents-generator.pages.dev
echo.
echo Next steps:
echo 1. Go to Cloudflare Pages dashboard
echo 2. Click your project
echo 3. Add environment variable:
echo    VITE_API_BASE_URL = https://xhs-contents-generator.onrender.com
echo 4. Redeploy
echo.
echo Or run: deploy-cloudflare-env.bat
echo.
pause
