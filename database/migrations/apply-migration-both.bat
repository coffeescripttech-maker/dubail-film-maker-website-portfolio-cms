@echo off
REM =====================================================
REM Apply Database Migration to BOTH Local and Remote D1
REM =====================================================

echo.
echo ========================================
echo Applying Thumbnail Support Migration
echo Target: BOTH Local AND Remote Databases
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
echo ========================================
echo STEP 1: Apply to LOCAL Database
echo ========================================
echo.

wrangler d1 execute DB --local --file=database/migrations/001-add-thumbnail-support.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCCESS: LOCAL migration applied!
    echo.
) else (
    echo.
    echo ERROR: LOCAL migration failed!
    echo Stopping here. Please fix the error before continuing.
    pause
    exit /b 1
)

echo.
echo ========================================
echo STEP 2: Apply to REMOTE Database
echo ========================================
echo.
echo WARNING: This will modify your PRODUCTION database!
echo.
set /p CONFIRM="Continue with REMOTE migration? (yes/no): "

if /i not "%CONFIRM%"=="yes" (
    echo.
    echo REMOTE migration cancelled.
    echo LOCAL migration was successful.
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
    echo SUCCESS: Both migrations completed!
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
    echo Both LOCAL and REMOTE databases are now updated!
    echo.
) else (
    echo.
    echo ========================================
    echo ERROR: REMOTE migration failed!
    echo ========================================
    echo.
    echo LOCAL migration was successful.
    echo Please check the error and try again.
    exit /b 1
)

pause
