@echo off
REM Telegram Bot Setup Script for Windows
REM Sets up webhook using ngrok

echo.
echo ========================================
echo   Telegram Bot Webhook Setup
echo ========================================
echo.

REM Check if ngrok is installed
where ngrok >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ngrok not found!
    echo.
    echo Please install ngrok:
    echo 1. Download from: https://ngrok.com/download
    echo 2. Extract to a folder
    echo 3. Add to PATH or run from that folder
    echo.
    pause
    exit /b 1
)

echo Starting ngrok tunnel on port 3000...
echo.
echo Press Ctrl+C to stop the tunnel
echo.

REM Start ngrok in a new window
start "ngrok tunnel" ngrok http 3000

REM Wait for ngrok to start
timeout /t 3 /nobreak >nul

echo.
echo Getting ngrok URL...

REM Get ngrok URL from local API
for /f "delims=" %%i in ('curl -s http://localhost:4040/api/tunnels ^| findstr "public_url"') do set "NGROK_URL=%%i"

REM Extract just the URL
set "NGROK_URL=%NGROK_URL:public_url= %"
set "NGROK_URL=%NGROK_URL: =%"
set "NGROK_URL=%NGROK_URL:"=%
set "NGROK_URL=%NGROK_URL:,=%

if "%NGROK_URL%"=="" (
    echo.
    echo Could not get ngrok URL automatically.
    echo Please check the ngrok window and copy the HTTPS URL manually.
    echo.
    set /p NGROK_URL="Enter ngrok HTTPS URL: "
)

echo.
echo Ngrok URL: %NGROK_URL%
echo.
echo Setting Telegram webhook...

REM Set webhook
set "WEBHOOK_URL=%NGROK_URL%/telegram/webhook"
curl -s "http://localhost:3000/telegram/setWebhook?url=%WEBHOOK_URL%"

echo.
echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Webhook URL: %WEBHOOK_URL%
echo.
echo Now you can:
echo 1. Open Telegram
echo 2. Find @xhs54321_bot
echo 3. Send /start or a YouTube URL
echo.
echo Keep both windows open (server + ngrok)
echo.
pause
