-- Rollback: Remove video_thumbnail_url column

ALTER TABLE projects DROP COLUMN video_thumbnail_url;
