-- =====================================================
-- Rollback Migration: Remove client_short column
-- Purpose: Revert client abbreviation feature
-- Date: 2026-03-20
-- =====================================================

-- Drop index
DROP INDEX IF EXISTS idx_projects_client_short;

-- Remove client_short column
-- Note: SQLite doesn't support DROP COLUMN directly
-- We need to recreate the table without the column

-- This is a placeholder for rollback
-- In production, you would need to:
-- 1. Create new table without client_short
-- 2. Copy data from old table
-- 3. Drop old table
-- 4. Rename new table

-- For now, we'll just note that rollback requires manual intervention
SELECT 'Rollback requires manual table recreation' AS warning;
