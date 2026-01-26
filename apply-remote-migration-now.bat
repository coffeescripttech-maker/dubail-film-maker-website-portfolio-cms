@echo off
echo Applying migration to REMOTE database...
wrangler d1 execute DB --remote --file=database/migrations/001-add-thumbnail-support.sql
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS: Remote migration applied!
) else (
    echo ERROR: Remote migration failed!
)
