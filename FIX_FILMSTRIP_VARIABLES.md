# Quick Fix for VideoFrameCapture.tsx

## Problem
The component has old variable references that need to be removed/replaced:
- `generatingThumbnails` → `generatingFilmstrip`
- `timelineThumbnails` → `filmstripFrames`
- `hoverPreview` → remove (not needed)
- `timelineRef` → `filmstripRef`
- `getHoverPreviewFrame()` → remove (not needed)
- `handleTimelineHover()` → remove (not needed)
- `handleTimelineLeave()` → remove (not needed)

## Manual Steps

1. Find line ~396: `Timeline {generatingThumbnails &&`
   Replace with: `Timeline Filmstrip {generatingFilmstrip &&`

2. Find line ~404: `{timelineThumbnails.length > 0 && (`
   Replace entire section (lines 404-434) with the new filmstrip code

3. Find line ~437: `ref={timelineRef}`
   Remove this entire div wrapper (lines 437-476) - the hover preview section

4. Keep the timeline scrubber input (lines 478-490) but remove the ref and event handlers

## Result
The component will have:
- Continuous filmstrip strip (horizontal scroll)
- Red position indicator line
- Click any frame to jump
- Timeline scrubber below for fine control
- All keyboard shortcuts still work
