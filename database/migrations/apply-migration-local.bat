@echo off
REM =====================================================
REM Apply Database Migration to LOCAL D1
REM =====================================================

echo.
echo ========================================
echo Applying Thumbnail Support Migration
echo Target: LOCAL Database
echo ========================================
echo.

REM Check if wrangler is available
where wrangler >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: wrangler CLI not found. Please install it first.
    echo Run: npm install -g wrangler
    exit /b 1
)

echo Applying migration to LOCAL database...
echo.

wrangler d1 execute DB --local --file=database/migrations/001-add-thumbnail-support.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo LOCAL Migration applied successfully!
    echo ========================================
    echo.
) else (
    echo.
    echo ========================================
    echo ERROR: LOCAL Migration failed!
    echo ========================================
    echo.
    exit /b 1
)

pause
