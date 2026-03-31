-- =====================================================
-- Migration: Add client_short column to projects table
-- Purpose: Allow abbreviated client names for display
-- Date: 2026-03-20
-- =====================================================

-- Add client_short column (optional field)
ALTER TABLE projects ADD COLUMN client_short TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_client_short ON projects(client_short);

-- Migration complete
-- Note: Existing projects will have NULL client_short, which means use full client name
