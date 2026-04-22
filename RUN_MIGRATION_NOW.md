# ⚠️ CRITICAL: Run Database Migration NOW

## Error You're Seeing
```
PUT /api/projects/[id] 500 (Internal Server Error)
Failed to update project
```

## Root Cause
The Arabic video columns don't exist in your database yet. You need to run the migration!

---

## 🚀 Quick Fix - Run This Command

### For Local Development:
```bash
cd final_cms
wrangler d1 execute portfolio-cms-db --local --file=./database/migrations/006-add-arabic-video-fields.sql
```

### For Production (Vercel):
```bash
cd final_cms
wrangler d1 execute portfolio-cms-db --remote --file=./database/migrations/006-add-arabic-video-fields.sql
```

---

## What This Does

The migration adds these columns to your `projects` table:
- `video_url_arabic` (TEXT)
- `video_url_full_arabic` (TEXT)
- `video_thumbnail_url_arabic` (TEXT)

---

## Step-by-Step Instructions

### 1. Open Terminal/Command Prompt

### 2. Navigate to CMS Directory
```bash
cd final_cms
```

### 3. Run Migration Command
```bash
# For local database
wrangler d1 execute portfolio-cms-db --local --file=./database/migrations/006-add-arabic-video-fields.sql
```

### 4. Verify Migration
```bash
# Check if columns exist
wrangler d1 execute portfolio-cms-db --local --command="SELECT video_url_full_arabic FROM projects LIMIT 1"
```

If you see a result (even if NULL), the migration worked! ✅

### 5. Restart Dev Server
```bash
# Stop server (Ctrl+C)
# Start again
npm run dev
```

### 6. Try Updating Project Again
Now the update should work!

---

## Troubleshooting

### Error: "wrangler: command not found"
Install Wrangler:
```bash
npm install -g wrangler
```

### Error: "Database not found"
Check your wrangler.toml file has the correct database binding.

### Error: "Column already exists"
The migration was already run. You're good to go!

### Still Getting 500 Error?
Check the server logs for the specific error message. It might be a different issue.

---

## Alternative: Manual SQL

If wrangler doesn't work, you can run the SQL manually:

```sql
ALTER TABLE projects ADD COLUMN video_url_arabic TEXT;
ALTER TABLE projects ADD COLUMN video_url_full_arabic TEXT;
ALTER TABLE projects ADD COLUMN video_thumbnail_url_arabic TEXT;
```

---

## After Migration

Once the migration is complete:
1. ✅ Restart your dev server
2. ✅ Try updating a project with Arabic video
3. ✅ The update should succeed
4. ✅ Check the project detail page for the language toggle

---

**Status**: ⚠️ MIGRATION REQUIRED  
**Priority**: 🔴 HIGH - Feature won't work without this  
**Time Required**: ~2 minutes
