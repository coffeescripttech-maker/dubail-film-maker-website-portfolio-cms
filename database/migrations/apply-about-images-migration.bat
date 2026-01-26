@echo off
REM Apply About Images Migration to Remote D1 Database
REM This script applies the 002-add-about-images.sql migration

echo ========================================
echo About Images Migration Script
echo ========================================
echo.

REM Load environment variables
if exist "../../.env.local" (
    echo Loading environment variables from .env.local...
    for /f "usebackq tokens=1,* delims==" %%a in ("../../.env.local") do (
        set "%%a=%%b"
    )
    echo Environment variables loaded.
    echo.
) else (
    echo ERROR: .env.local file not found!
    echo Please ensure .env.local exists in final_cms directory
    pause
    exit /b 1
)

REM Check required environment variables
if "%CLOUDFLARE_ACCOUNT_ID%"=="" (
    echo ERROR: CLOUDFLARE_ACCOUNT_ID not set in .env.local
    pause
    exit /b 1
)

if "%CLOUDFLARE_API_TOKEN%"=="" (
    echo ERROR: CLOUDFLARE_API_TOKEN not set in .env.local
    pause
    exit /b 1
)

if "%CLOUDFLARE_DATABASE_ID%"=="" (
    set CLOUDFLARE_DATABASE_ID=908f42f0-ad4d-4ce0-b3a2-9bb13cf54795
    echo Using default database ID: %CLOUDFLARE_DATABASE_ID%
)

echo Configuration:
echo - Account ID: %CLOUDFLARE_ACCOUNT_ID%
echo - Database ID: %CLOUDFLARE_DATABASE_ID%
echo.

REM Read migration SQL file
set "SQL_FILE=002-add-about-images.sql"
if not exist "%SQL_FILE%" (
    echo ERROR: Migration file %SQL_FILE% not found!
    pause
    exit /b 1
)

echo Reading migration file: %SQL_FILE%
set "SQL_CONTENT="
for /f "usebackq delims=" %%a in ("%SQL_FILE%") do (
    set "line=%%a"
    setlocal enabledelayedexpansion
    set "SQL_CONTENT=!SQL_CONTENT!!line! "
    endlocal
)

echo.
echo Applying migration to remote D1 database...
echo.

REM Execute migration using curl
curl -X POST "https://api.cloudflare.com/client/v4/accounts/%CLOUDFLARE_ACCOUNT_ID%/d1/database/%CLOUDFLARE_DATABASE_ID%/query" ^
  -H "Authorization: Bearer %CLOUDFLARE_API_TOKEN%" ^
  -H "Content-Type: application/json" ^
  --data "{\"sql\":\"CREATE TABLE IF NOT EXISTS about_images (id TEXT PRIMARY KEY, url TEXT NOT NULL, alt TEXT, order_index INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP); CREATE INDEX IF NOT EXISTS idx_about_images_order ON about_images(order_index); CREATE TRIGGER IF NOT EXISTS update_about_images_updated_at AFTER UPDATE ON about_images FOR EACH ROW BEGIN UPDATE about_images SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END; INSERT OR IGNORE INTO about_images (id, url, alt, order_index) VALUES ('about-img-1', 'media/pages/about/6f8ea45b91-1724948873/adv-architecture-et-agencement-advstudio-1.jpg', 'DXP Studio Image 1', 1), ('about-img-2', 'media/pages/about/9a13aa90ff-1724948879/adv-architecture-et-agencement-advstudio-2.jpg', 'DXP Studio Image 2', 2), ('about-img-3', 'media/pages/about/570a1d755d-1724948885/adv-architecture-et-agencement-advstudio-3.jpg', 'DXP Studio Image 3', 3), ('about-img-4', 'media/pages/about/fe3e83c953-1724948891/adv-architecture-et-agencement-advstudio.jpg', 'DXP Studio Image 4', 4);\"}"

echo.
echo ========================================
echo Migration completed!
echo ========================================
echo.
echo Next steps:
echo 1. Verify the migration by checking the database
echo 2. Test the API endpoints:
echo    - GET /api/about/images (list all images)
echo    - GET /api/public/about (public endpoint)
echo 3. Access the CMS Settings to manage about images
echo.
pause
