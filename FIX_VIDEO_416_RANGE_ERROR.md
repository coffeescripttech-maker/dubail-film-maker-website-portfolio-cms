# Fix: Video 416 Range Error

## Problem
After uploading a thumbnail video clip, you get this error when trying to play it:
```
Failed to load resource: the server responded with a status of 416 (Requested Range Not Satisfiable)
```

## What This Error Means
- **416 status code** = "Requested Range Not Satisfiable"
- Happens when browser requests a specific byte range of the video
- Server can't fulfill the range request (missing headers or corrupted file)

## Root Causes

### 1. Missing CORS Headers
R2 needs to expose range-related headers for video streaming to work.

### 2. Missing Cache Control
Videos need proper cache control headers for range requests.

### 3. Incomplete Upload
Sometimes the video upload completes but R2 hasn't fully processed it yet.

## Solutions Applied

### 1. Updated R2 CORS Configuration
Added required headers to `r2-cors-config.json`:

```json
{
  "ExposeHeaders": [
    "ETag",
    "Content-Range",      // ← NEW: Required for range requests
    "Accept-Ranges",      // ← NEW: Tells browser ranges are supported
    "Content-Length",     // ← NEW: Required for video streaming
    "Content-Type"        // ← NEW: Required for proper MIME type
  ]
}
```

### 2. Updated R2 Upload Function
Added cache control and content disposition headers in `src/lib/r2-storage.ts`:

```typescript
const command = new PutObjectCommand({
  Bucket: BUCKET_NAME,
  Key: key,
  Body: file,
  ContentType: contentType,
  Metadata: options.metadata,
  CacheControl: 'public, max-age=31536000',  // ← NEW: Cache for 1 year
  ...(contentType.startsWith('video/') && {
    ContentDisposition: 'inline',            // ← NEW: Play inline, not download
  }),
});
```

## How to Apply the Fix

### Step 1: Update R2 CORS Configuration
Run this command to update your R2 bucket CORS settings:

```bash
cd final_cms
node scripts/set-r2-cors.js
```

Or manually via Cloudflare Dashboard:
1. Go to R2 → Your Bucket → Settings
2. Scroll to CORS Policy
3. Update with the new configuration from `r2-cors-config.json`

### Step 2: Re-upload Existing Videos
For videos that already have the 416 error:

1. Open the project in CMS
2. Go to "Video Thumbnail Clip" section
3. Select the range again
4. Click "Set as Thumbnail" to re-upload
5. The new upload will have proper headers

### Step 3: Verify the Fix
1. Open browser DevTools (F12)
2. Go to Network tab
3. Play the video
4. Look for the video request
5. Check Response Headers:
   - Should see `Accept-Ranges: bytes`
   - Should see `Content-Range: bytes 0-xxx/xxx`
   - Should NOT see 416 error

## Why This Happens

### HTTP Range Requests Explained
When you play a video in a browser:

1. **Browser**: "Give me bytes 0-1000 of this video"
2. **Server**: "Here's bytes 0-1000" (with `Content-Range` header)
3. **Browser**: "Now give me bytes 1001-2000"
4. **Server**: "Here's bytes 1001-2000"

This is called "range requests" and it's how video streaming works.

### Without Proper Headers
If the server doesn't support range requests:

1. **Browser**: "Give me bytes 0-1000"
2. **Server**: "I don't understand ranges" (416 error)
3. **Browser**: "Can't play video" ❌

### With Proper Headers
With our fix:

1. **Browser**: "Give me bytes 0-1000"
2. **Server**: "Here's bytes 0-1000" (with proper headers)
3. **Browser**: "Playing video smoothly" ✅

## Troubleshooting

### Still Getting 416 Error?

#### Check 1: CORS Applied?
```bash
# Test if CORS is working
curl -I https://pub-xxx.r2.dev/your-video.mp4
```

Look for these headers:
- `Accept-Ranges: bytes`
- `Access-Control-Expose-Headers: Content-Range, Accept-Ranges`

#### Check 2: Video File Corrupted?
Download the video and try playing it locally:
```bash
# Download video
curl -o test.mp4 https://pub-xxx.r2.dev/your-video.mp4

# Play locally
# If it doesn't play, the file is corrupted
```

#### Check 3: R2 Processing Delay?
Sometimes R2 takes a few seconds to process uploads:
- Wait 10-30 seconds after upload
- Refresh the page
- Try playing again

#### Check 4: Browser Cache?
Clear browser cache:
- Chrome: Ctrl+Shift+Delete → Clear cached images and files
- Or use Incognito mode

### Video Plays But Seeking Doesn't Work?

This means range requests are partially working but not fully:

1. Check if `Content-Range` header is present
2. Verify video was encoded with `faststart` flag (from our earlier fix)
3. Re-upload the video with the new encoding

## Prevention

### For New Videos
All new videos uploaded after this fix will automatically have:
- ✅ Proper CORS headers
- ✅ Cache control headers
- ✅ Content disposition headers
- ✅ Range request support

### For Existing Videos
You need to re-upload them to get the new headers:
1. Select range in CMS
2. Click "Set as Thumbnail"
3. New upload will have proper headers

## Technical Details

### What Are Range Requests?
HTTP range requests allow clients to request specific byte ranges of a file:

```http
GET /video.mp4 HTTP/1.1
Range: bytes=0-1023

HTTP/1.1 206 Partial Content
Content-Range: bytes 0-1023/5000000
Content-Length: 1024
Accept-Ranges: bytes
```

### Why Videos Need Range Requests
1. **Seeking**: Jump to any point in video
2. **Streaming**: Don't download entire file upfront
3. **Bandwidth**: Only download what you need
4. **Mobile**: Essential for mobile data savings

### R2 Range Request Support
Cloudflare R2 supports range requests by default, but:
- CORS must expose the headers
- Content-Type must be correct
- Cache-Control helps with performance

## Files Modified

1. **r2-cors-config.json**
   - Added `Content-Range` to ExposeHeaders
   - Added `Accept-Ranges` to ExposeHeaders
   - Added `Content-Length` to ExposeHeaders
   - Added `Content-Type` to ExposeHeaders

2. **src/lib/r2-storage.ts**
   - Added `CacheControl` header
   - Added `ContentDisposition` for videos
   - Ensures proper video streaming support

## Summary

The 416 error happens because R2 wasn't configured to properly support HTTP range requests for video streaming. We fixed it by:

1. ✅ Adding required CORS headers
2. ✅ Adding cache control headers
3. ✅ Adding content disposition headers
4. ✅ Ensuring proper video MIME types

Now videos will stream smoothly with full seeking support!
