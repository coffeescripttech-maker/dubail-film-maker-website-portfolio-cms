# Video Frame Extraction API Implementation

## Overview

This document describes the implementation of the Video Frame Extraction API endpoints for the Thumbnail & Film Arrangement Control feature.

## Implemented Endpoints

### 1. POST /api/video/extract-frame

**Purpose**: Validates video frame extraction requests before client-side processing.

**Location**: `src/app/api/video/extract-frame/route.ts`

**Requirements**: 2.4 - Extract frame at timestamp

**Request Body**:
```json
{
  "videoUrl": "https://example.com/video.mp4",
  "timestamp": 5.5,
  "videoDuration": 120
}
```

**Validation**:
- ✓ Requires authentication (NextAuth session)
- ✓ Validates video URL is provided and valid
- ✓ Validates timestamp is provided and non-negative
- ✓ Validates timestamp is within video duration (if provided)

**Response (Success)**:
```json
{
  "success": true,
  "message": "Frame extraction validated",
  "data": {
    "videoUrl": "https://example.com/video.mp4",
    "timestamp": 5.5,
    "instructions": {
      "method": "canvas",
      "steps": [
        "Load video element with provided URL",
        "Seek to specified timestamp",
        "Draw current frame to canvas",
        "Export canvas as image blob"
      ]
    }
  }
}
```

**Error Responses**:
- `401`: Unauthorized (no valid session)
- `400`: Missing or invalid video URL
- `400`: Missing or invalid timestamp
- `400`: Timestamp exceeds video duration
- `500`: Server error

---

### 2. POST /api/thumbnails/generate

**Purpose**: Accepts a captured video frame and uploads it as a thumbnail to R2 storage.

**Location**: `src/app/api/thumbnails/generate/route.ts`

**Requirements**: 2.5, 2.6 - Upload frame to R2 and save metadata with timestamp

**Request Body**:
```json
{
  "projectId": "uuid-here",
  "timestamp": 5.5,
  "frameData": "base64-encoded-image-data",
  "width": 1920,
  "height": 1080
}
```

**Processing Flow**:
1. Validates authentication and request data
2. Verifies project exists and has a video
3. Converts base64 frame data to Buffer
4. Generates unique storage key: `thumbnails/video-frames/{projectId}/frame-{timestamp}s.jpg`
5. Uploads frame to R2 storage as JPEG
6. Saves thumbnail metadata to database using `saveThumbnailMetadata()`
7. Sets the new thumbnail as active by default

**Response (Success)**:
```json
{
  "success": true,
  "message": "Video frame thumbnail generated successfully",
  "data": {
    "thumbnailUrl": "https://r2-public-url/thumbnails/video-frames/...",
    "thumbnailId": "uuid",
    "timestamp": 5.5,
    "storageKey": "thumbnails/video-frames/...",
    "size": 12345,
    "metadata": {
      "width": 1920,
      "height": 1080,
      "projectId": "uuid"
    }
  }
}
```

**Error Responses**:
- `401`: Unauthorized (no valid session)
- `400`: Missing project ID, timestamp, or frame data
- `400`: Invalid timestamp (negative)
- `400`: Invalid frame data format
- `404`: Project not found
- `400`: Project does not have a video
- `500`: Upload or database error

---

## Implementation Details

### Canvas-Based Frame Extraction

The actual frame extraction happens **client-side** using the HTML5 Canvas API. The workflow is:

1. **Client-Side** (Browser):
   - Load video element with the video URL
   - Seek to the desired timestamp
   - Create a canvas element
   - Draw the current video frame to the canvas
   - Export canvas as base64 encoded image data
   - Send the base64 data to `/api/thumbnails/generate`

2. **Server-Side** (API):
   - Validate the request
   - Convert base64 to Buffer
   - Upload to R2 storage
   - Save metadata to database

### Storage Organization

Video frame thumbnails are stored in R2 with the following structure:

```
/thumbnails/video-frames/
  /{project-id}/
    /frame-{timestamp}s.jpg
```

Example: `thumbnails/video-frames/abc-123/frame-5_50s.jpg`

### Database Integration

The endpoint uses the `saveThumbnailMetadata()` function from `thumbnail-service.ts` which:
- Creates a record in the `thumbnail_options` table
- Updates the `projects` table with the active thumbnail
- Stores timestamp and metadata

---

## Testing

### Manual Testing Steps

1. **Start the development server**:
   ```bash
   cd final_cms
   npm run dev
   ```

2. **Log in to the CMS** at `http://localhost:3000`

3. **Test frame extraction validation**:
   ```bash
   curl -X POST http://localhost:3000/api/video/extract-frame \
     -H "Content-Type: application/json" \
     -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
     -d '{
       "videoUrl": "https://example.com/video.mp4",
       "timestamp": 5.5,
       "videoDuration": 120
     }'
   ```

4. **Test thumbnail generation** (requires valid project with video):
   ```bash
   curl -X POST http://localhost:3000/api/thumbnails/generate \
     -H "Content-Type: application/json" \
     -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
     -d '{
       "projectId": "your-project-id",
       "timestamp": 5.5,
       "frameData": "data:image/jpeg;base64,/9j/4AAQ...",
       "width": 1920,
       "height": 1080
     }'
   ```

### Automated Test Script

Run the test script (requires dev server running):
```bash
node test-video-frame-extraction.js
```

**Note**: The test script will show 401 errors without authentication. This is expected behavior.

---

## Client-Side Integration Example

Here's how to integrate frame extraction in a React component:

```typescript
async function extractVideoFrame(
  videoUrl: string,
  timestamp: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.src = videoUrl;
    
    video.addEventListener('loadedmetadata', () => {
      video.currentTime = timestamp;
    });
    
    video.addEventListener('seeked', () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64
      const frameData = canvas.toDataURL('image/jpeg', 0.9);
      resolve(frameData);
    });
    
    video.addEventListener('error', (e) => {
      reject(new Error('Failed to load video'));
    });
  });
}

async function generateThumbnailFromFrame(
  projectId: string,
  videoUrl: string,
  timestamp: number
) {
  try {
    // Extract frame client-side
    const frameData = await extractVideoFrame(videoUrl, timestamp);
    
    // Send to server for upload
    const response = await fetch('/api/thumbnails/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId,
        timestamp,
        frameData,
        width: 1920,
        height: 1080
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Thumbnail generated:', result.data.thumbnailUrl);
      return result.data;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Frame extraction failed:', error);
    throw error;
  }
}
```

---

## Requirements Validation

### Requirement 2.4: Extract frame at timestamp
✓ **Implemented**: `/api/video/extract-frame` validates extraction requests
✓ **Validation**: Checks timestamp is within video duration
✓ **Method**: Canvas-based extraction (client-side)

### Requirement 2.5: Upload frame to R2
✓ **Implemented**: `/api/thumbnails/generate` uploads frames to R2
✓ **Storage**: Uses `uploadFile()` from `r2-storage.ts`
✓ **Format**: JPEG with unique storage key

### Requirement 2.6: Save metadata with timestamp
✓ **Implemented**: Saves to database via `saveThumbnailMetadata()`
✓ **Data**: Stores thumbnail URL, type, timestamp, and dimensions
✓ **Tables**: Updates both `thumbnail_options` and `projects` tables

---

## Next Steps

To complete the video frame extraction feature:

1. **Create VideoFrameCapture Component** (Task 12)
   - Build React component with video player
   - Implement timeline scrubber
   - Add frame capture button
   - Integrate with these API endpoints

2. **Integrate into ThumbnailManager** (Task 11)
   - Add "Generate from Video" button
   - Show VideoFrameCapture modal
   - Handle captured frames

3. **Add Default Fallback** (Task 22)
   - Extract first frame (timestamp 0) when no thumbnail exists
   - Cache extracted frames

---

## Dependencies

- **Authentication**: NextAuth session required
- **Database**: D1 database with `thumbnail_options` and `projects` tables
- **Storage**: R2 bucket configured with proper CORS
- **Services**: 
  - `thumbnail-service.ts` for database operations
  - `r2-storage.ts` for file uploads
  - `d1-client.ts` for project queries

---

## Error Handling

All endpoints include comprehensive error handling:
- Authentication validation
- Input validation with descriptive messages
- Database error handling with rollback
- Storage error handling with retry logic
- User-friendly error messages

---

## Security Considerations

- ✓ Authentication required for all endpoints
- ✓ Project ownership validation (via session)
- ✓ Input sanitization for timestamps and URLs
- ✓ Base64 validation for frame data
- ✓ File size limits enforced by R2 upload
- ✓ CORS configuration for video loading

---

## Performance Notes

- Frame extraction happens client-side (no server load)
- Base64 encoding increases payload size by ~33%
- JPEG compression reduces file size
- R2 upload is direct (no intermediate storage)
- Database updates are atomic (transaction-safe)

---

## Troubleshooting

### "Video URL is required"
- Ensure `videoUrl` is included in request body
- Check URL format is valid

### "Project not found"
- Verify project ID exists in database
- Check user has access to the project

### "Invalid frame data format"
- Ensure base64 data is properly encoded
- Check for data URL prefix (will be stripped automatically)

### "Failed to upload file to R2"
- Verify R2 credentials in `.env.local`
- Check R2 bucket permissions
- Ensure CORS is configured correctly

---

## Files Modified/Created

### Created:
- `src/app/api/video/extract-frame/route.ts`
- `src/app/api/thumbnails/generate/route.ts`
- `test-video-frame-extraction.js`
- `VIDEO_FRAME_EXTRACTION_IMPLEMENTATION.md`

### Dependencies:
- `src/lib/thumbnail-service.ts` (existing)
- `src/lib/r2-storage.ts` (existing)
- `src/lib/d1-client.ts` (existing)
- `src/lib/auth.ts` (existing)

---

## Conclusion

The Video Frame Extraction API is now fully implemented and ready for integration with the frontend components. The endpoints provide robust validation, error handling, and seamless integration with the existing thumbnail management system.
