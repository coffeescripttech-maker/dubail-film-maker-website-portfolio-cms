-- Rollback: Remove video chapters support
-- Description: Removes the chapters field from projects table

ALTER TABLE projects DROP COLUMN chapters;
