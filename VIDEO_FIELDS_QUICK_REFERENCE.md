# Video Fields Quick Reference

## Three Video Fields Explained

```javascript
{
  video_url: "thumbnail-clip.mp4",      // ← Homepage/Works (fast)
  video_url_full: "full-video.mp4",     // ← Detail page (complete)
  video_thumbnail_url: "thumbnail.mp4"  // ← Reference
}
```

## When to Use Which Field

| Page/Context | Use This Field | Why |
|-------------|----------------|-----|
| Homepage slider | `video_url` | Fast loading, thumbnail clip |
| Works page grid | `video_url` | Fast loading, thumbnail clip |
| Project detail page | `video_url_full` | Full experience, complete video |
| Checking if thumbnail exists | `video_thumbnail_url` | Returns null if no thumbnail |

## Code Examples

### Homepage/Works Page ✅
```javascript
// Use thumbnail clip (fast)
videoElement.src = project.video_url;
```

### Project Detail Page ✅
```javascript
// Use full video (complete)
videoElement.src = project.video_url_full;
```

### Check Thumbnail Availability
```javascript
if (project.video_thumbnail_url) {
  console.log('Thumbnail available');
}
```

## What You Need to Update

### Portfolio Website

**File:** `works/project-detail.html` or wherever detail page video is rendered

**Change:**
```javascript
// OLD (shows thumbnail on detail page - wrong!)
videoElement.src = project.video_url;

// NEW (shows full video on detail page - correct!)
videoElement.src = project.video_url_full;
```

**No changes needed for:**
- Homepage slider (already uses `video_url` - correct)
- Works page grid (already uses `video_url` - correct)

## Summary

- **List views** (homepage, works) → Use `video_url` (thumbnail)
- **Detail view** (project page) → Use `video_url_full` (full video)
- **Checking** (if thumbnail exists) → Check `video_thumbnail_url`

That's it! 🎬
