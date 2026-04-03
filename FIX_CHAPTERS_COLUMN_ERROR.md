# Fix: "no such column: chapters" Error

## Problem
When updating a project, you get this error:
```
Error: D1 API Error: 400 - no such column: chapters: SQLITE_ERROR
```

This means the `chapters` and `video_thumbnail_url` columns don't exist in your remote database yet.

## Solution: Apply Migrations

You need to run TWO migrations on your remote database:

### Option 1: Run the Batch Script (Easiest)

Open Command Prompt in the migrations folder and run:

```bash
cd final_cms\database\migrations
apply-chapters-and-thumbnail-remote.bat
```

### Option 2: Run Commands Manually

Open Command Prompt and run these commands one by one:

```bash
# Navigate to your project
cd final_cms

# Migration 1: Add chapters column
wrangler d1 execute portfolio-cms-db --remote --command "ALTER TABLE projects ADD COLUMN chapters TEXT DEFAULT NULL;"

# Migration 2: Add video_thumbnail_url column
wrangler d1 execute portfolio-cms-db --remote --command "ALTER TABLE projects ADD COLUMN video_thumbnail_url TEXT;"

# Verify the columns were added
wrangler d1 execute portfolio-cms-db --remote --command "PRAGMA table_info(projects);"
```

### Option 3: Use Cloudflare Dashboard

1. Go to https://dash.cloudflare.com
2. Navigate to Workers & Pages → D1
3. Select your database: `portfolio-cms-db`
4. Go to "Console" tab
5. Run these SQL commands:

```sql
-- Add chapters column
ALTER TABLE projects ADD COLUMN chapters TEXT DEFAULT NULL;

-- Add video_thumbnail_url column
ALTER TABLE projects ADD COLUMN video_thumbnail_url TEXT;

-- Verify
PRAGMA table_info(projects);
```

## Verify Success

After running the migrations, you should see these columns in the output:

```
chapters | TEXT | 0 | NULL | 0
video_thumbnail_url | TEXT | 0 | NULL | 0
```

## After Migration

1. **Restart your dev server:**
   ```bash
   # Press Ctrl+C to stop
   npm run dev
   ```

2. **Clear browser cache:**
   - Hard refresh: Ctrl+Shift+R

3. **Try updating your project again**

## What These Columns Do

### `chapters` Column
- Stores video chapter/moment data as JSON
- Format: `[{"timestamp":"0:15","label":"Intro","type":"moment"}]`
- Used for marking important moments in videos

### `video_thumbnail_url` Column
- Stores URL of trimmed video clip for previews
- Generated from video chapters using FFmpeg
- Used for quick previews on portfolio website

## Troubleshooting

### "column already exists"
This is fine! It means the column was added previously. Just continue.

### "database not found"
Check your database name in `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "portfolio-cms-db"
database_id = "your-database-id"
```

### Still getting errors?
1. Check you're using `--remote` flag (not `--local`)
2. Verify you're logged in: `wrangler whoami`
3. Check database ID matches in `.env.local`

## Quick Reference

**Database name:** `portfolio-cms-db`

**Migration files:**
- `004-add-video-chapters.sql`
- `005-add-video-thumbnail-url.sql`

**Batch script:**
- `apply-chapters-and-thumbnail-remote.bat`
