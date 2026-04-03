# FFmpeg Video Chapters with Clip Export

## Setup

1. **Install Dependencies:**
```bash
cd final_cms
npm install
```

This installs:
- `@ffmpeg/ffmpeg@^0.12.10` - FFmpeg WebAssembly
- `@ffmpeg/util@^0.12.1` - FFmpeg utilities

2. **Run Migration:**
```bash
cd database/migrations
./apply-video-chapters-migration.bat
```

## Features

### 1. Visual Timeline
- Click anywhere on timeline to jump to that moment
- See all marked chapters/ranges visually
- Color-coded markers:
  - **Yellow lines** = Single moments ⭐
  - **Green bars** = Time ranges 📍
  - **Orange bar** = Currently marking range
  - **Purple indicator** = Current playhead

### 2. Mark Moments
- Click timeline to desired time
- Click "⭐ Mark Moment"
- Add label (e.g., "Intro", "Key scene")

### 3. Mark Ranges (Clips)
- Click "📍 Mark Range Start"
- Click timeline at end point
- Click "✓ Mark Range End"
- Add label (e.g., "Action sequence")

### 4. Export Clips 💾
- Mark a time range (start → end)
- Click "💾 Export Clip" button
- FFmpeg trims video in browser
- Downloads as MP4 file

## How It Works

### FFmpeg Loading
- Loads automatically when component mounts
- ~30MB download (one-time, cached)
- Shows status: "⏳ Loading FFmpeg..." → "✅ FFmpeg loaded"

### Clip Export Process
1. User marks range: 1:30 → 2:00
2. Clicks "Export Clip"
3. FFmpeg loads video into memory
4. Trims using `-ss` (start) and `-t` (duration)
5. Uses `-c copy` for fast processing (no re-encoding)
6. Downloads trimmed clip as MP4

### Performance
- **Fast**: Uses stream copy, no re-encoding
- **Browser-based**: No server needed
- **Efficient**: Only processes marked segment

## Usage Example

### Scenario: 5-minute commercial with highlights

1. **Upload Video**
   - Upload 5-minute video
   - Video player and timeline appear

2. **Mark Opening (Moment)**
   - Click timeline at 0:15
   - Click "Mark Moment"
   - Label: "Logo Reveal"

3. **Mark Product Showcase (Range)**
   - Click "Mark Range Start"
   - Click timeline at 1:30
   - Click timeline at 2:00
   - Click "Mark Range End"
   - Label: "Product Demo"

4. **Export Product Demo Clip**
   - Click "💾 Export Clip" on "Product Demo"
   - Wait ~5-10 seconds
   - Download: `Product Demo_1:30-2:00.mp4`

5. **Mark Call to Action (Moment)**
   - Click timeline at 4:40
   - Click "Mark Moment"
   - Label: "CTA"

6. **Submit Project**
   - All chapters saved to database
   - Clips can be re-exported anytime

## Technical Details

### FFmpeg Commands
```bash
# Trim video from 1:30 for 30 seconds duration
ffmpeg -i input.mp4 -ss 90 -t 30 -c copy output.mp4
```

### Browser Compatibility
- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari (may be slower)
- ❌ IE11 (not supported)

### File Size Limits
- Recommended: < 500MB videos
- Larger files work but take longer
- FFmpeg processes in browser memory

## Troubleshooting

### FFmpeg not loading?
- Check browser console for errors
- Try refreshing the page
- Ensure stable internet connection
- Clear browser cache

### Export taking too long?
- Large videos take longer
- Use shorter ranges
- Check browser isn't throttling
- Close other tabs to free memory

### Export failed?
- Check video format (MP4 works best)
- Ensure range is valid (end > start)
- Try smaller time range
- Check browser console for errors

### Out of memory?
- Video too large for browser
- Try shorter clips
- Close other tabs
- Restart browser

## Benefits

### vs. Server-side Processing
- ✅ No server costs
- ✅ Instant processing
- ✅ Privacy (video stays in browser)
- ✅ No upload time

### vs. Manual Editing
- ✅ No software needed
- ✅ Quick exports
- ✅ Precise timestamps
- ✅ Integrated workflow

## Future Enhancements

- Batch export multiple clips
- Add transitions/effects
- Generate thumbnails from clips
- Upload clips directly to R2
- Share clips via URL

## Notes

- FFmpeg loads once per session (cached)
- Exports are client-side only
- Original video unchanged
- Clips are temporary (download to save)
- Works offline after FFmpeg loads
