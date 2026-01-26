# Database Migration Guide

## Quick Start

You need to apply the thumbnail support migration to your database(s).

### Option 1: Apply to BOTH Local and Remote (Recommended)

```bash
cd final_cms
database\migrations\apply-migration-both.bat
```

This will:
1. Apply migration to your local D1 database first
2. Ask for confirmation before applying to remote (production)
3. Apply to remote database if confirmed

### Option 2: Apply to Local Only (Development)

```bash
cd final_cms
database\migrations\apply-migration-local.bat
```

Use this if you only want to test locally first.

### Option 3: Apply to Remote Only (Production)

```bash
cd final_cms
database\migrations\apply-migration-remote.bat
```

Use this if local is already migrated and you only need to update production.

## What Gets Added

The migration adds:

### New Columns to `projects` table:
- `thumbnail_url` - URL of the active thumbnail
- `thumbnail_type` - Type: 'custom', 'video_frame', or 'default'
- `thumbnail_timestamp` - Timestamp for video frame captures
- `thumbnail_metadata` - JSON metadata (width, height, size, formats)

### New Tables:
- `thumbnail_options` - Stores all thumbnail options for each project
- `film_presets` - Stores saved film arrangement presets

## Verification

After running the migration, verify it worked:

```bash
# Check local database
wrangler d1 execute DB --local --command "SELECT name FROM sqlite_master WHERE type='table'"

# Check remote database
wrangler d1 execute DB --remote --command "SELECT name FROM sqlite_master WHERE type='table'"
```

You should see:
- `projects` (existing)
- `thumbnail_options` (new)
- `film_presets` (new)

## Troubleshooting

### Error: "no such column: thumbnail_url"

This means the migration hasn't been applied yet. Run one of the migration scripts above.

### Error: "column already exists"

The migration was already applied. You can safely ignore this or check the database schema.

### Error: "wrangler not found"

Install wrangler CLI:
```bash
npm install -g wrangler
```

Then authenticate:
```bash
wrangler login
```

## Rollback (If Needed)

If something goes wrong, you can rollback:

```bash
# Local rollback
wrangler d1 execute DB --local --file=database/migrations/001-add-thumbnail-support-rollback.sql

# Remote rollback
wrangler d1 execute DB --remote --file=database/migrations/001-add-thumbnail-support-rollback.sql
```

## Manual Migration (Alternative)

If the batch files don't work, you can run the commands manually:

### Local:
```bash
wrangler d1 execute DB --local --file=database/migrations/001-add-thumbnail-support.sql
```

### Remote:
```bash
wrangler d1 execute DB --remote --file=database/migrations/001-add-thumbnail-support.sql
```

## After Migration

Once the migration is complete:

1. ✅ Restart your development server
2. ✅ Test the thumbnail capture feature
3. ✅ Verify thumbnails are saving correctly
4. ✅ Check that the portfolio preview shows thumbnails

## Need Help?

If you encounter issues:

1. Check the error message carefully
2. Verify wrangler is installed and authenticated
3. Make sure you're in the `final_cms` directory
4. Check that the migration file exists at `database/migrations/001-add-thumbnail-support.sql`
