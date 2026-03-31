@echo off
echo ========================================
echo Applying Client Short Name Migration
echo ========================================
echo.

REM Check if wrangler is installed
where wrangler >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: wrangler CLI not found!
    echo Please install: npm install -g wrangler
    pause
    exit /b 1
)

echo Step 1: Applying migration to LOCAL database...
echo.
wrangler d1 execute portfolio-cms-db --local --file=./003-add-client-short.sql
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Local migration failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Local migration completed successfully!
echo ========================================
echo.
echo To apply to REMOTE database, run:
echo wrangler d1 execute portfolio-cms-db --remote --file=./003-add-client-short.sql
echo.
pause
