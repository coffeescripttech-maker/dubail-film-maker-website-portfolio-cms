@echo off
echo ========================================
echo Applying Video Thumbnail URL Migration
echo ========================================
echo.

echo Step 1: Applying to LOCAL database...
wrangler d1 execute dubai-filmmaker-cms --local --file=005-add-video-thumbnail-url.sql
if %errorlevel% neq 0 (
    echo ERROR: Local migration failed!
    pause
    exit /b 1
)
echo ✓ Local migration successful
echo.

echo Step 2: Applying to REMOTE database...
wrangler d1 execute dubai-filmmaker-cms --remote --file=005-add-video-thumbnail-url.sql
if %errorlevel% neq 0 (
    echo ERROR: Remote migration failed!
    pause
    exit /b 1
)
echo ✓ Remote migration successful
echo.

echo ========================================
echo Migration completed successfully!
echo ========================================
echo.
echo The video_thumbnail_url column has been added to the projects table.
echo You can now save trimmed video clips for preview purposes.
echo.
pause
