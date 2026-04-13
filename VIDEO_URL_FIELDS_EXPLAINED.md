# Video URL Fields - Complete Explanation

## Overview

The public API now returns THREE video-related fields to support different use cases:

```json
{
  "video_url": "https://.../thumbnail-clip.mp4",      // ← For homepage/works page
  "video_url_full": "https://.../full-video.mp4",     // ← For project detail page
  "video_thumbnail_url": "https://.../thumbnail.mp4"  // ← Reference/fallback
}
```

## Field Purposes

### 1. `video_url` (Optimized for Lists)
**Used by:** Homepage slider, Works page grid

**Value:** Thumbnail clip if available, otherwise full video

**Logic:**
```typescript
video_url: project.video_thumbnail_url || project.video_url
```

**Why:**
- Fast loading on homepage (20-50MB vs 100-500MB)
- Instant playback without buffering
- Better user experience for previews
- Saves bandwidth when showing multiple projects

**Example Usage:**
```javascript
// Homepage slider
projects.forEach(project => {
  videoElement.src = project.video_url; // ← Uses thumbnail clip
});
```

### 2. `video_url_full` (Full Experience)
**Used by:** Project detail page

**Value:** Always the full video

**Logic:**
```typescript
video_url_full: project.video_url
```

**Why:**
- User clicked to see the full project
- Detail page should show complete video
- No compromise on quality or length
- User expects full experience

**Example Usage:**
```javascript
// Project detail page
if (isDetailPage) {
  videoElement.src = project.video_url_full; // ← Uses full video
}
```

### 3. `video_thumbnail_url` (Reference)
**Used by:** Fallback logic, debugging

**Value:** Thumbnail clip URL or null

**Logic:**
```typescript
video_thumbnail_url: project.video_thumbnail_url || null
```

**Why:**
- Check if thumbnail exists
- Fallback logic
- Debugging purposes
- Future features

## Usage Patterns

### Pattern 1: Homepage/Works Page (List View)
```javascript
// Use optimized thumbnail clip
const videoSrc = project.video_url;

// This is already the thumbnail clip if available
videoElement.src = videoSrc;
```

### Pattern 2: Project Detail Page (Full View)
```javascript
// Use full video for complete experience
const videoSrc = project.video_url_full;

// This is always the full video
videoElement.src = videoSrc;
```

### Pattern 3: Smart Loading (Advanced)
```javascript
// Start with thumbnail, switch to full on user interaction
videoElement.src = project.video_url; // Thumbnail

// When user clicks play or enters fullscreen
videoElement.addEventListener('play', () => {
  if (project.video_thumbnail_url && project.video_url_full) {
    // Switch to full video
    const currentTime = videoElement.currentTime;
    videoElement.src = project.video_url_full;
    videoElement.currentTime = currentTime;
    videoElement.play();
  }
});
```

### Pattern 4: Conditional Loading
```javascript
// Check if thumbnail exists
if (project.video_thumbnail_url) {
  console.log('✅ Thumbnail available - fast loading');
  videoElement.src = project.video_url; // Thumbnail
} else {
  console.log('⚠️ No thumbnail - using full video');
  videoElement.src = project.video_url; // Full video (fallback)
}
```

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                      Database                           │
├─────────────────────────────────────────────────────────┤
│  video_url: "https://.../full-video.mp4" (200MB)      │
│  video_thumbnail_url: "https://.../clip.mp4" (30MB)   │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   Public API                            │
├─────────────────────────────────────────────────────────┤
│  video_url: "https://.../clip.mp4"                     │
│  video_url_full: "https://.../full-video.mp4"         │
│  video_thumbnail_url: "https://.../clip.mp4"          │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│              Portfolio Website                          │
├─────────────────────────────────────────────────────────┤
│  Homepage: Uses video_url (thumbnail)                   │
│  Works Page: Uses video_url (thumbnail)                 │
│  Detail Page: Uses video_url_full (full video)         │
└─────────────────────────────────────────────────────────┘
```

## Implementation Examples

### Homepage Slider
```javascript
// assets/js/page-renderer.js
function renderHomepageSlider(projects) {
  projects.forEach(project => {
    const slide = document.createElement('div');
    slide.innerHTML = `
      <video autoplay muted loop playsinline>
        <source src="${project.video_url}" type="video/mp4">
      </video>
    `;
    slider.appendChild(slide);
  });
}
```

### Works Page Grid
```javascript
// assets/js/page-renderer.js
function renderWorksGrid(projects) {
  projects.forEach(project => {
    const card = document.createElement('div');
    card.innerHTML = `
      <video muted loop playsinline>
        <source src="${project.video_url}" type="video/mp4">
      </video>
    `;
    grid.appendChild(card);
  });
}
```

### Project Detail Page
```javascript
// works/project-detail.html
function renderProjectDetail(project) {
  const videoContainer = document.querySelector('.project-video');
  videoContainer.innerHTML = `
    <video controls playsinline>
      <source src="${project.video_url_full}" type="video/mp4">
    </video>
  `;
}
```

## Backward Compatibility

### Projects Without Thumbnails
```json
{
  "video_url": "https://.../full-video.mp4",      // ← Full video (fallback)
  "video_url_full": "https://.../full-video.mp4", // ← Full video
  "video_thumbnail_url": null                      // ← No thumbnail
}
```

**Behavior:**
- Homepage uses full video (no thumbnail available)
- Detail page uses full video (same as homepage)
- No breaking changes
- Works exactly as before

### Projects With Thumbnails
```json
{
  "video_url": "https://.../thumbnail.mp4",       // ← Thumbnail (optimized)
  "video_url_full": "https://.../full-video.mp4", // ← Full video
  "video_thumbnail_url": "https://.../thumbnail.mp4" // ← Thumbnail
}
```

**Behavior:**
- Homepage uses thumbnail (fast loading)
- Detail page uses full video (complete experience)
- Best of both worlds

## Performance Comparison

| Page | Old Behavior | New Behavior | Improvement |
|------|-------------|--------------|-------------|
| Homepage | 10 × 200MB = 2GB | 10 × 30MB = 300MB | 85% less |
| Works Page | 20 × 200MB = 4GB | 20 × 30MB = 600MB | 85% less |
| Detail Page | 1 × 200MB = 200MB | 1 × 200MB = 200MB | Same (full video) |

## Migration Guide

### For Portfolio Website Developers

**Step 1: Update Homepage/Works Page**
```javascript
// No changes needed! Already uses project.video_url
// This now automatically uses thumbnail when available
```

**Step 2: Update Project Detail Page**
```javascript
// Change from:
videoElement.src = project.video_url;

// To:
videoElement.src = project.video_url_full;
```

**Step 3: Test**
1. Homepage should load thumbnails (fast)
2. Detail page should load full videos (complete)
3. Projects without thumbnails should work (fallback)

## API Response Example

```json
{
  "projects": [
    {
      "id": "abc123",
      "title": "Moving Forward",
      "client": "Nike",
      "video_url": "https://r2.dev/projects/thumbnail-clips/clip-abc123.mp4",
      "video_url_full": "https://r2.dev/projects/videos/full-abc123.mp4",
      "video_thumbnail_url": "https://r2.dev/projects/thumbnail-clips/clip-abc123.mp4",
      "poster_image": "https://r2.dev/projects/posters/poster-abc123.jpg"
    }
  ]
}
```

## Troubleshooting

### Detail Page Shows Thumbnail Instead of Full Video

**Problem:** Project detail page is using `project.video_url` instead of `project.video_url_full`

**Solution:**
```javascript
// Change this:
videoElement.src = project.video_url;

// To this:
videoElement.src = project.video_url_full;
```

### Homepage Shows Full Video (Slow Loading)

**Problem:** Homepage is using `project.video_url_full` instead of `project.video_url`

**Solution:**
```javascript
// Change this:
videoElement.src = project.video_url_full;

// To this:
videoElement.src = project.video_url;
```

### Thumbnail Not Available

**Check:**
```javascript
if (project.video_thumbnail_url) {
  console.log('✅ Thumbnail available');
} else {
  console.log('⚠️ No thumbnail - generate one in CMS');
}
```

## Related Documentation

- `VIDEO_URL_PRIORITY_EXPLAINED.md` - Priority logic details
- `VIDEO_THUMBNAIL_CLIP_FEATURE.md` - Thumbnail generation
- `API_VIDEO_FIELDS_VERIFIED.md` - API verification

## Status

✅ **ACTIVE** - Three video fields now available in public API for optimal performance across all pages.
