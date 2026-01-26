-- =====================================================
-- Rollback Migration: Remove Thumbnail & Film Arrangement Support
-- Date: 2026-01-25
-- Description: Rolls back thumbnail management and film preset functionality
-- =====================================================

-- =====================================================
-- STEP 1: Drop triggers
-- =====================================================
DROP TRIGGER IF EXISTS update_film_presets_updated_at;

-- =====================================================
-- STEP 2: Drop indexes
-- =====================================================
DROP INDEX IF EXISTS idx_film_presets_name;
DROP INDEX IF EXISTS idx_thumbnail_options_active;
DROP INDEX IF EXISTS idx_thumbnail_options_project;

-- =====================================================
-- STEP 3: Drop tables
-- =====================================================
DROP TABLE IF EXISTS film_presets;
DROP TABLE IF EXISTS thumbnail_options;

-- =====================================================
-- STEP 4: Remove columns from projects table
-- Note: SQLite doesn't support DROP COLUMN directly
-- This would require recreating the table in production
-- For development, we'll document the columns to ignore
-- =====================================================
-- The following columns should be considered deprecated:
-- - thumbnail_url
-- - thumbnail_type
-- - thumbnail_timestamp
-- - thumbnail_metadata
--
-- To fully remove these columns, you would need to:
-- 1. Create a new table without these columns
-- 2. Copy data from old table to new table
-- 3. Drop old table
-- 4. Rename new table to original name
-- 5. Recreate indexes and triggers
