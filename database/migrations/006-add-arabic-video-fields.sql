-- Migration: Add Arabic video URL fields to projects table
-- Date: 2026-04-13
-- Description: Adds support for Arabic language versions of videos

-- Add Arabic video URL columns (all optional/nullable)
ALTER TABLE projects ADD COLUMN video_url_arabic TEXT;
ALTER TABLE projects ADD COLUMN video_url_full_arabic TEXT;
ALTER TABLE projects ADD COLUMN video_thumbnail_url_arabic TEXT;

-- Note: These fields are optional and backward compatible
-- Existing projects will have NULL values for these fields
-- Language toggle will only show if Arabic videos are uploaded
