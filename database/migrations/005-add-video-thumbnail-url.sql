-- Migration: Add video_thumbnail_url column for trimmed video clips
-- This stores the URL of a short trimmed version of the video for preview/thumbnail purposes

ALTER TABLE projects ADD COLUMN video_thumbnail_url TEXT;

-- Add comment
COMMENT ON COLUMN projects.video_thumbnail_url IS 'URL of trimmed video clip for preview (generated from video chapters)';
