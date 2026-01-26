# Database Migrations

This directory contains database migration scripts for the Dubai Filmmaker CMS.

## Migration 001: Thumbnail & Film Arrangement Support

**Date:** 2026-01-25  
**Requirements:** 1.4, 2.6, 3.2, 7.3

### Overview

This migration adds support for:
- Custom thumbnail uploads for projects
- Video frame extraction as thumbnails
- Multiple thumbnail options per project
- Film arrangement presets for saved layouts

### Changes

#### 1. Projects Table Extensions
Adds four new columns to the `projects` table:
- `thumbnail_url` (TEXT) - URL of the active thumbnail
- `thumbnail_type` (TEXT) - Type: 'custom', 'video_frame', or 'default'
- `thumbnail_timestamp` (REAL) - Timestamp in seconds for video frame captures
- `thumbnail_metadata` (TEXT) - JSON metadata: {width, height, size, formats}

#### 2. New Table: thumbnail_options
Stores all available thumbnail options for each project:
- `id` (TEXT, PRIMARY KEY) - Unique identifier
- `project_id` (TEXT, NOT NULL) - Foreign key to projects table
- `thumbnail_url` (TEXT, NOT NULL) - URL of the thumbnail
- `thumbnail_type` (TEXT, NOT NULL) - Type: 'custom' or 'video_frame'
- `timestamp` (REAL) - Timestamp for video frames
- `is_active` (INTEGER, DEFAULT 0) - Whether this is the active thumbnail
- `created_at` (DATETIME) - Creation timestamp

**Indexes:**
- `idx_thumbnail_options_project` - On project_id
- `idx_thumbnail_options_active` - On (project_id, is_active)

#### 3. New Table: film_presets
Stores saved film arrangement configurations:
- `id` (TEXT, PRIMARY KEY) - Unique identifier
- `name` (TEXT, NOT NULL) - Preset name
- `description` (TEXT) - Optional description
- `order_config` (TEXT, NOT NULL) - JSON array of {project_id, order_index}
- `created_at` (DATETIME) - Creation timestamp
- `updated_at` (DATETIME) - Last update timestamp

**Indexes:**
- `idx_film_presets_name` - On name

**Triggers:**
- `update_film_presets_updated_at` - Auto-updates updated_at on changes

## How to Apply Migration

### Local Development (D1 Local)

**Windows:**
```bash
cd final_cms
database\migrations\apply-migration.bat
```

**Unix/Mac:**
```bash
cd final_cms
chmod +x database/migrations/apply-migration.sh
./database/migrations/apply-migration.sh
```

**Manual Application:**
```bash
cd final_cms
wrangler d1 execute DB --local --file=database/migrations/001-add-thumbnail-support.sql
```

### Production (Remote D1)

**⚠️ Warning:** Always test migrations locally first!

```bash
cd final_cms
wrangler d1 execute DB --remote --file=database/migrations/001-add-thumbnail-support.sql
```

## Verification

To verify the migration was applied correctly:

```bash
cd final_cms
wrangler d1 execute DB --local --file=database/migrations/verify-migration.sql
```

Expected output:
- Projects Table Columns: 4
- Thumbnail Options Table: 1
- Thumbnail Options Columns: 7
- Film Presets Table: 1
- Film Presets Columns: 6
- Indexes Created: 3
- Triggers Created: 1

## Rollback

If you need to rollback this migration:

```bash
cd final_cms
wrangler d1 execute DB --local --file=database/migrations/001-add-thumbnail-support-rollback.sql
```

**Note:** SQLite doesn't support `DROP COLUMN`, so the rollback script drops the new tables but documents the columns to ignore in the projects table. For a complete rollback in production, you would need to recreate the projects table without those columns.

## Testing

After applying the migration, test the following:

1. **Insert a project with thumbnail data:**
```sql
INSERT INTO projects (id, title, thumbnail_url, thumbnail_type) 
VALUES ('test-1', 'Test Project', 'https://example.com/thumb.jpg', 'custom');
```

2. **Insert a thumbnail option:**
```sql
INSERT INTO thumbnail_options (id, project_id, thumbnail_url, thumbnail_type, is_active) 
VALUES ('thumb-1', 'test-1', 'https://example.com/thumb.jpg', 'custom', 1);
```

3. **Insert a film preset:**
```sql
INSERT INTO film_presets (id, name, order_config) 
VALUES ('preset-1', 'Featured First', '[{"project_id":"test-1","order_index":0}]');
```

4. **Query to verify:**
```sql
SELECT * FROM projects WHERE id = 'test-1';
SELECT * FROM thumbnail_options WHERE project_id = 'test-1';
SELECT * FROM film_presets WHERE id = 'preset-1';
```

## Troubleshooting

### Error: "table projects has no column named thumbnail_url"
The migration hasn't been applied yet. Run the apply-migration script.

### Error: "table thumbnail_options already exists"
The migration has already been applied. Check with verify-migration.sql.

### Error: "wrangler command not found"
Install Wrangler CLI: `npm install -g wrangler`

### Error: "database DB not found"
Make sure you're in the final_cms directory and wrangler.toml exists.

## Next Steps

After applying this migration:
1. Update TypeScript types to include new fields
2. Implement API endpoints for thumbnail management
3. Create UI components for thumbnail upload and selection
4. Test the complete thumbnail workflow
