-- Migration: Add video chapters/moments support
-- Description: Adds a chapters field to store video timestamps with labels
-- Date: 2026-04-03

-- Add chapters column to projects table
-- Stores JSON array of chapter objects: [{ timestamp: "0:15", label: "Intro" }, ...]
ALTER TABLE projects ADD COLUMN chapters TEXT DEFAULT NULL;

-- Example data structure:
-- [
--   { "timestamp": "0:15", "label": "Intro" },
--   { "timestamp": "1:02", "label": "Important scene" },
--   { "timestamp": "2:30", "label": "Key dialogue" }
-- ]
