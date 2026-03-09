@echo off
REM Create Project Backup Script
REM Creates a complete backup of the Xiaohongshu Content Generator project

setlocal enabledelayedexpansion

REM Get current date for backup folder
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (
    set mydate=%%c-%%a-%%b
)

REM Set backup paths
set SOURCE=C:\Users\yongk\OneDrive\Desktop\xhs contents generator
set BACKUP_BASE=C:\Users\yongk\OneDrive\Desktop
set BACKUP_FOLDER=xhs-backup-%mydate%
set BACKUP_PATH=%BACKUP_BASE%\%BACKUP_FOLDER%

echo ===============================================
echo   Xiaohongshu Content Generator Backup
echo ===============================================
echo.
echo Source: %SOURCE%
echo Backup: %BACKUP_PATH%
echo.

REM Create backup folder
echo Creating backup folder...
if not exist "%BACKUP_PATH%" mkdir "%BACKUP_PATH%"

REM Copy project files (excluding node_modules and large files)
echo Copying project files...
robocopy "%SOURCE%" "%BACKUP_PATH%" /E /XD node_modules storage .git /XF *.log jobs.db /R:2 /W:5 /NFL /NDL /NJH /NJS

REM Create backup manifest
echo Creating backup manifest...
(
echo ===============================================
echo   BACKUP MANIFEST
echo ===============================================
echo.
echo Backup Date: %DATE% %TIME%
echo Source: %SOURCE%
echo Backup Location: %BACKUP_PATH%
echo.
echo ===============================================
echo   INCLUDED FILES
echo ===============================================
echo.
echo - server/ (all server code)
echo - public/ (frontend code)
echo - utils/ (utility functions)
echo - db/ (database schema)
echo - functions/ (Cloudflare functions)
echo - worker/ (Cloudflare worker)
echo.
echo - .env (environment config) ^<-- IMPORTANT!
echo - wrangler.toml (Cloudflare config)
echo - package.json (dependencies)
echo.
echo - Documentation (*.md files)
echo.
echo ===============================================
echo   EXCLUDED FILES
echo ===============================================
echo.
echo - node_modules/ (can reinstall with npm install)
echo - storage/audio/ (temporary files)
echo - .git/ (version control)
echo - *.log (log files)
echo - jobs.db (can be recreated)
echo.
echo ===============================================
echo   RESTORE INSTRUCTIONS
echo ===============================================
echo.
echo 1. Stop any running server
echo 2. Copy backup folder to desired location
echo 3. Run: npm install
echo 4. Copy .env from backup (or create new)
echo 5. Run: npm start
echo.
echo ===============================================
echo   BACKUP COMPLETE
echo ===============================================
echo.
echo Backup saved to: %BACKUP_PATH%
echo.
) > "%BACKUP_PATH%\BACKUP_MANIFEST.txt"

echo.
echo ===============================================
echo   BACKUP COMPLETE!
echo ===============================================
echo.
echo Backup saved to: %BACKUP_PATH%
echo.
echo IMPORTANT: 
echo - Check that .env file is included (contains secrets!)
echo - node_modules excluded (run npm install after restore)
echo - storage/ excluded (temporary files)
echo.
pause
