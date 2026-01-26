-- =====================================================
-- Verify Migration: Check Thumbnail & Film Arrangement Support
-- Date: 2026-01-25
-- Description: Verifies that all schema changes were applied correctly
-- =====================================================

-- =====================================================
-- Check 1: Verify projects table has new columns
-- =====================================================
SELECT 
  'Projects Table Columns' as check_name,
  COUNT(*) as column_count
FROM pragma_table_info('projects')
WHERE name IN ('thumbnail_url', 'thumbnail_type', 'thumbnail_timestamp', 'thumbnail_metadata');
-- Expected: 4 columns

-- =====================================================
-- Check 2: Verify thumbnail_options table exists
-- =====================================================
SELECT 
  'Thumbnail Options Table' as check_name,
  COUNT(*) as table_exists
FROM sqlite_master 
WHERE type='table' AND name='thumbnail_options';
-- Expected: 1

-- =====================================================
-- Check 3: Verify thumbnail_options columns
-- =====================================================
SELECT 
  'Thumbnail Options Columns' as check_name,
  COUNT(*) as column_count
FROM pragma_table_info('thumbnail_options');
-- Expected: 7 columns (id, project_id, thumbnail_url, thumbnail_type, timestamp, is_active, created_at)

-- =====================================================
-- Check 4: Verify film_presets table exists
-- =====================================================
SELECT 
  'Film Presets Table' as check_name,
  COUNT(*) as table_exists
FROM sqlite_master 
WHERE type='table' AND name='film_presets';
-- Expected: 1

-- =====================================================
-- Check 5: Verify film_presets columns
-- =====================================================
SELECT 
  'Film Presets Columns' as check_name,
  COUNT(*) as column_count
FROM pragma_table_info('film_presets');
-- Expected: 6 columns (id, name, description, order_config, created_at, updated_at)

-- =====================================================
-- Check 6: Verify indexes were created
-- =====================================================
SELECT 
  'Indexes Created' as check_name,
  COUNT(*) as index_count
FROM sqlite_master 
WHERE type='index' 
AND name IN (
  'idx_thumbnail_options_project',
  'idx_thumbnail_options_active',
  'idx_film_presets_name'
);
-- Expected: 3 indexes

-- =====================================================
-- Check 7: Verify trigger was created
-- =====================================================
SELECT 
  'Triggers Created' as check_name,
  COUNT(*) as trigger_count
FROM sqlite_master 
WHERE type='trigger' 
AND name = 'update_film_presets_updated_at';
-- Expected: 1 trigger

-- =====================================================
-- Summary
-- =====================================================
SELECT '========================================' as summary;
SELECT 'Migration Verification Complete' as summary;
SELECT '========================================' as summary;
