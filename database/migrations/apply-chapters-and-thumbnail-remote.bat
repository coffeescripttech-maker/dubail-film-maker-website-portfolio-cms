@echo off
echo ========================================
echo Applying Video Chapters + Thumbnail URL Migrations
echo ========================================
echo.

echo Step 1: Adding chapters column...
wrangler d1 execute portfolio-cms-db --remote --command "ALTER TABLE projects ADD COLUMN chapters TEXT DEFAULT NULL;"

if %ERRORLEVEL% NEQ 0 (
    echo Warning: chapters column might already exist
) else (
    echo ✓ chapters column added successfully
)

echo.
echo Step 2: Adding video_thumbnail_url column...
wrangler d1 execute portfolio-cms-db --remote --command "ALTER TABLE projects ADD COLUMN video_thumbnail_url TEXT;"

if %ERRORLEVEL% NEQ 0 (
    echo Warning: video_thumbnail_url column might already exist
) else (
    echo ✓ video_thumbnail_url column added successfully
)

echo.
echo Step 3: Verifying columns...
wrangler d1 execute portfolio-cms-db --remote --command "PRAGMA table_info(projects);"

echo.
echo ========================================
echo Migration Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Verify the columns appear in the output above
echo 2. Restart your dev server (Ctrl+C then npm run dev)
echo 3. Try updating your project again
echo.
pause
