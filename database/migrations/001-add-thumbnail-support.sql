-- =====================================================
-- Migration: Add Thumbnail & Film Arrangement Support
-- Date: 2026-01-25
-- Description: Adds thumbnail management and film preset functionality
-- Requirements: 1.4, 2.6, 3.2, 7.3
-- =====================================================

-- =====================================================
-- STEP 1: Add thumbnail columns to projects table
-- =====================================================
ALTER TABLE projects ADD COLUMN thumbnail_url TEXT;
ALTER TABLE projects ADD COLUMN thumbnail_type TEXT; -- 'custom', 'video_frame', 'default'
ALTER TABLE projects ADD COLUMN thumbnail_timestamp REAL; -- for video frame captures (in seconds)
ALTER TABLE projects ADD COLUMN thumbnail_metadata TEXT; -- JSON: {width, height, size, formats}

-- =====================================================
-- STEP 2: Create thumbnail_options table
-- =====================================================
CREATE TABLE IF NOT EXISTS thumbnail_options (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  thumbnail_type TEXT NOT NULL, -- 'custom', 'video_frame'
  timestamp REAL, -- for video frames (in seconds)
  is_active INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Create indexes for thumbnail_options
CREATE INDEX IF NOT EXISTS idx_thumbnail_options_project ON thumbnail_options(project_id);
CREATE INDEX IF NOT EXISTS idx_thumbnail_options_active ON thumbnail_options(project_id, is_active);

-- =====================================================
-- STEP 3: Create film_presets table
-- =====================================================
CREATE TABLE IF NOT EXISTS film_presets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  order_config TEXT NOT NULL, -- JSON array of {project_id, order_index}
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for film_presets
CREATE INDEX IF NOT EXISTS idx_film_presets_name ON film_presets(name);

-- =====================================================
-- STEP 4: Add trigger for film_presets updated_at
-- =====================================================
CREATE TRIGGER IF NOT EXISTS update_film_presets_updated_at 
  AFTER UPDATE ON film_presets
  FOR EACH ROW
  BEGIN
    UPDATE film_presets SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;
