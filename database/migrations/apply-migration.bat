@echo off
REM =====================================================
REM Apply Database Migration to Local D1
REM =====================================================

echo.
echo ========================================
echo Applying Thumbnail Support Migration
echo ========================================
echo.

REM Check if wrangler is available
where wrangler >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: wrangler CLI not found. Please install it first.
    echo Run: npm install -g wrangler
    exit /b 1
)

REM Get the database name from wrangler.toml
echo Reading database configuration...
echo.

REM Apply the migration
echo Applying migration: 001-add-thumbnail-support.sql
echo.

wrangler d1 execute DB --local --file=database/migrations/001-add-thumbnail-support.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Migration applied successfully!
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
    echo ERROR: Migration failed!
    echo ========================================
    echo.
    echo Please check the error messages above.
    exit /b 1
)

pause
