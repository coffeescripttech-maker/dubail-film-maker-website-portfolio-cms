-- Rollback Migration: Remove Arabic video URL fields from projects table
-- Date: 2026-04-13
-- Description: Removes Arabic language video support (rollback)

-- Remove Arabic video URL columns
ALTER TABLE projects DROP COLUMN video_url_arabic;
ALTER TABLE projects DROP COLUMN video_url_full_arabic;
ALTER TABLE projects DROP COLUMN video_thumbnail_url_arabic;

-- Note: This will permanently delete any Arabic video URLs that were stored
-- Make sure to backup data before running this rollback
