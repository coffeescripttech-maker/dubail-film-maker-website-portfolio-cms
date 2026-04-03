@echo off
echo ========================================
echo Applying Video Chapters Migration
echo ========================================
echo.

echo This will add the 'chapters' column to the projects table.
echo.

set /p confirm="Apply migration to LOCAL database? (y/n): "
if /i "%confirm%" NEQ "y" (
    echo Migration cancelled.
    exit /b
)

echo.
echo Applying migration to LOCAL database...
wrangler d1 execute portfolio-cms-db --local --file=database/migrations/004-add-video-chapters.sql

echo.
echo ========================================
echo Migration applied to LOCAL database!
echo ========================================
echo.

set /p remote="Apply migration to REMOTE database? (y/n): "
if /i "%remote%" NEQ "y" (
    echo Remote migration skipped.
    exit /b
)

echo.
echo Applying migration to REMOTE database...
wrangler d1 execute portfolio-cms-db --remote --file=database/migrations/004-add-video-chapters.sql

echo.
echo ========================================
echo Migration applied to REMOTE database!
echo ========================================
echo.
echo Done! The chapters feature is now available.
pause
