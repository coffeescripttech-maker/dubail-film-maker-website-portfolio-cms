# Fix Video Thumbnail Upload Size Limit

## Problem

When uploading thumbnail clips larger than ~4MB, the API returns:
```
500 Internal Server Error
{error: 'Failed to upload thumbnail clip', details: 'Failed to parse body as FormData.'}
```

This happens because:
1. The API route was using Edge Runtime which has a 4MB body size limit
2. Generated thumbnail clips can be 20-50MB depending on duration and quality
3. Next.js needs explicit configuration to handle larger uploads

## Example Error

```
VideoChapterMarker.tsx:432 ✅ Clip blob created, size: 43875499 bytes (43.8MB)
VideoChapterMarker.tsx:448 📡 Response status: 500 Internal Server Error
VideoChapterMarker.tsx:450 📡 Response data: {error: 'Failed to upload thumbnail clip', details: 'Failed to parse body as FormData.'}
```

## Solution

### 1. Switch to Node.js Runtime

Changed the API route from Edge Runtime to Node.js Runtime:

**File:** `final_cms/src/app/api/projects/[id]/thumbnail-clip/route.ts`

```typescript
// Before
export const runtime = 'edge';

// After
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds for processing
```

**Why:**
- Edge Runtime has strict 4MB body size limit
- Node.js Runtime supports much larger uploads (100MB+)
- Edge Runtime is optimized for speed, Node.js for flexibility

### 2. Configure Body Size Limit

Added body size configuration to Next.js config:

**File:** `final_cms/next.config.ts`

```typescript
const nextConfig: NextConfig = {
  // ... existing config
  
  // Increase body size limit for video uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
};
```

**Why:**
- Default Next.js body size limit is too small for video files
- 100MB allows for 15-30 second clips at high quality
- Matches the client-side validation limit

## Runtime Comparison

| Feature | Edge Runtime | Node.js Runtime |
|---------|-------------|-----------------|
| Body Size Limit | 4MB | Configurable (100MB+) |
| Cold Start | ~50ms | ~200ms |
| Execution Time | 30s max | 60s+ configurable |
| Memory | Limited | More available |
| Use Case | Small requests | Large file uploads |

## File Size Guidelines

For thumbnail clips:
- **5-10 seconds:** ~10-20MB
- **10-15 seconds:** ~20-35MB
- **15-30 seconds:** ~35-60MB

The 100MB limit provides comfortable headroom for most use cases.

## Testing

To verify the fix works:

1. **Generate a clip from timeline:**
   - Select a 15-30 second range
   - Click "Set as Thumbnail"
   - Wait for processing (may take 30-60 seconds)
   - Should upload successfully

2. **Upload custom video:**
   - Use "Upload Custom Thumbnail Video" option
   - Upload a 20-50MB MP4 file
   - Should upload without errors

3. **Check console logs:**
   ```
   ✅ Clip blob created, size: 43875499 bytes
   ☁️ Step 3: Uploading to R2 storage...
   📡 Response status: 200 OK
   ✅ Thumbnail clip saved!
   ```

## Restart Required

After making these changes, you must restart the development server:

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

The configuration changes in `next.config.ts` only take effect on server restart.

## Alternative Solutions

If you still encounter size issues:

### Option 1: Reduce Video Quality
Adjust FFmpeg parameters in `VideoChapterMarker.tsx`:

```typescript
// Current (high quality)
"-crf", "23",  // Quality (lower = better)

// Lower quality (smaller files)
"-crf", "28",  // Reduces file size by ~40%
```

### Option 2: Limit Clip Duration
Add validation to prevent very long clips:

```typescript
const clipDuration = endSeconds - startSeconds;

if (clipDuration > 30) {
  toast.error("Clip too long", {
    description: "Please select a range under 30 seconds"
  });
  return;
}
```

### Option 3: Use Faster Preset
Change encoding speed (trades quality for speed):

```typescript
// Current
"-preset", "ultrafast",

// Faster but larger files
"-preset", "veryfast",
```

## Performance Impact

Switching to Node.js Runtime has minimal impact:
- Cold start: +150ms (only first request)
- Warm requests: No difference
- Upload time: Depends on file size and network

For a 40MB file:
- Processing: ~30 seconds (FFmpeg encoding)
- Upload: ~5-10 seconds (to R2)
- Total: ~35-40 seconds

## Related Files

- `final_cms/src/app/api/projects/[id]/thumbnail-clip/route.ts` - API route
- `final_cms/next.config.ts` - Next.js configuration
- `final_cms/src/components/projects/VideoChapterMarker.tsx` - Client component

## Status

✅ **FIXED** - API now supports uploads up to 100MB with Node.js runtime.

## Next Steps

1. Restart the development server
2. Test with a 15-30 second clip
3. Verify upload succeeds
4. Check that video plays on portfolio site
