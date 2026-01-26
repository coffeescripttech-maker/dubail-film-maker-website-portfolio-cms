-- =====================================================
-- Test Migration: Insert Sample Data
-- =====================================================

-- Test 1: Insert a project with thumbnail data
INSERT INTO projects (
  id, 
  title, 
  thumbnail_url, 
  thumbnail_type, 
  thumbnail_timestamp,
  thumbnail_metadata
) VALUES (
  'test-migration-1', 
  'Test Project with Custom Thumbnail',
  'https://example.com/thumbnails/custom/test-thumb.jpg',
  'custom',
  NULL,
  '{"width":1920,"height":1080,"size":245678,"formats":["jpg","webp"]}'
);

-- Test 2: Insert thumbnail options for the project
INSERT INTO thumbnail_options (
  id,
  project_id,
  thumbnail_url,
  thumbnail_type,
  timestamp,
  is_active
) VALUES 
  (
    'thumb-opt-1',
    'test-migration-1',
    'https://example.com/thumbnails/custom/test-thumb.jpg',
    'custom',
    NULL,
    1
  ),
  (
    'thumb-opt-2',
    'test-migration-1',
    'https://example.com/thumbnails/video-frames/test-frame-5s.jpg',
    'video_frame',
    5.0,
    0
  );

-- Test 3: Insert a film preset
INSERT INTO film_presets (
  id,
  name,
  description,
  order_config
) VALUES (
  'preset-test-1',
  'Featured Films First',
  'Arrangement with featured films at the top',
  '[{"project_id":"test-migration-1","order_index":0}]'
);

-- Verify the inserts
SELECT '========================================' as result;
SELECT 'Test Data Inserted Successfully' as result;
SELECT '========================================' as result;

-- Show the inserted project
SELECT 'Project with Thumbnail:' as result;
SELECT id, title, thumbnail_url, thumbnail_type, thumbnail_timestamp 
FROM projects 
WHERE id = 'test-migration-1';

-- Show the thumbnail options
SELECT 'Thumbnail Options:' as result;
SELECT id, project_id, thumbnail_type, timestamp, is_active 
FROM thumbnail_options 
WHERE project_id = 'test-migration-1';

-- Show the film preset
SELECT 'Film Preset:' as result;
SELECT id, name, description, order_config 
FROM film_presets 
WHERE id = 'preset-test-1';

-- Cleanup test data
DELETE FROM thumbnail_options WHERE project_id = 'test-migration-1';
DELETE FROM film_presets WHERE id = 'preset-test-1';
DELETE FROM projects WHERE id = 'test-migration-1';

SELECT '========================================' as result;
SELECT 'Test Data Cleaned Up' as result;
SELECT '========================================' as result;
