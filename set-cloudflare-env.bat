@echo off
REM ============================================================
REM Cloudflare Pages - Set Environment Variables
REM ============================================================

echo.
echo ============================================================
echo   Setting Environment Variables for Cloudflare Pages
echo ============================================================
echo.

echo This script will set the API URL for your Cloudflare Pages project.
echo.
echo You'll need to do this manually in the dashboard:
echo 1. Go to: https://dash.cloudflare.com/?to=/:account/pages
echo 2. Click your project: xhs-contents-generator
echo 3. Click Settings
echo 4. Click Environment variables
echo 5. Add variable:
echo    Name: VITE_API_BASE_URL
echo    Value: https://xhs-contents-generator.onrender.com
echo.
echo Opening dashboard now...
echo.

start https://dash.cloudflare.com/?to=/:account/pages

echo Dashboard opened!
echo Follow the steps above to add the environment variable.
echo.
pause
