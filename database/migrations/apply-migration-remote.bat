@echo off
REM =====================================================
REM Apply Database Migration to REMOTE D1
REM =====================================================

echo.
echo ========================================
echo Applying Thumbnail Support Migration
echo Target: REMOTE Database (Production)
echo ========================================
echo.

REM Check if wrangler is available
where wrangler >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: wrangler CLI not found. Please install it first.
    echo Run: npm install -g wrangler
    exit /b 1
)

echo.
echo WARNING: This will modify your PRODUCTION database!
echo.
set /p CONFIRM="Are you sure you want to continue? (yes/no): "

if /i not "%CONFIRM%"=="yes" (
    echo.
    echo Migration cancelled.
    pause
    exit /b 0
)

echo.
echo Applying migration to REMOTE database...
echo.

wrangler d1 execute DB --remote --file=database/migrations/001-add-thumbnail-support.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo REMOTE Migration applied successfully!
    echo ========================================
    echo.
    echo New tables created:
    echo   - thumbnail_options
    echo   - film_presets
    echo.
    echo New columns added to projects table:
    echo   - thumbnail_url
    echo   - thumbnail_type
    echo   - thumbnail_timestamp
    echo   - thumbnail_metadata
    echo.
) else (
    echo.
    echo ========================================
    echo ERROR: REMOTE Migration failed!
    echo ========================================
    echo.
    exit /b 1
)

pause
