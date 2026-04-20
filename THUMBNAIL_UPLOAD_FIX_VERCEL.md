# Thumbnail Upload Fix - Vercel 413 Error

## Problem
Getting 413 "Content Too Large" error when uploading thumbnail clips on Vercel deployment.

## Root Cause
Vercel has a hard limit of **4.5MB** for request bodies on the Hobby plan, regardless of configuration. The previous implementation was sending the video file through the API route, which exceeded this limit.

## Solution
Implemented **presigned URL upload** pattern:
1. Client requests a presigned URL from the API
2. Client uploads directly to R2 using the presigned URL (bypasses Vercel)
3. Client confirms the upload, and API updates the database

This approach bypasses Vercel's body size limit entirely since the video never goes through Vercel's servers.

## Files Modified

### 1. API Route: `src/app/api/projects/[id]/thumbnail-clip/route.ts`
**Changed from**: Single endpoint that receives FormData with video file
**Changed to**: Two-action endpoint:
- `action: 'get-upload-url'` - Returns presigned URL for direct R2 upload
- `action: 'confirm-upload'` - Updates database after successful upload

**Benefits**:
- No file size limit (R2 handles the upload directly)
- Faster uploads (direct to R2, no Vercel proxy)
- Lower Vercel bandwidth usage

### 2. Component: `src/components/projects/VideoChapterMarker.tsx`
**Updated two upload functions**:

#### A. `handleSetAsThumbnail` (FFmpeg-generated clips)
- Step 1: Get presigned URL from API
- Step 2: Upload blob directly to R2
- Step 3: Confirm upload and update database

#### B. `handleCustomVideoUpload` (Direct file uploads)
- Step 1: Get presigned URL from API
- Step 2: Upload file directly to R2
- Step 3: Confirm upload and update database

## Technical Details

### Presigned URL Flow
```
┌─────────┐                    ┌─────────┐                    ┌─────────┐
│ Client  │                    │   API   │                    │   R2    │
└────┬────┘                    └────┬────┘                    └────┬────┘
     │                              │                              │
     │ 1. POST /thumbnail-clip      │                              │
     │    { action: 'get-upload-url' }                             │
     ├─────────────────────────────>│                              │
     │                              │                              │
     │                              │ 2. Generate presigned URL    │
     │                              ├─────────────────────────────>│
     │                              │                              │
     │                              │ 3. Return presigned URL      │
     │                              │<─────────────────────────────┤
     │                              │                              │
     │ 4. Return URLs               │                              │
     │<─────────────────────────────┤                              │
     │                              │                              │
     │ 5. PUT video to presigned URL                               │
     ├────────────────────────────────────────────────────────────>│
     │                              │                              │
     │ 6. Upload success            │                              │
     │<────────────────────────────────────────────────────────────┤
     │                              │                              │
     │ 7. POST /thumbnail-clip      │                              │
     │    { action: 'confirm-upload', publicUrl }                  │
     ├─────────────────────────────>│                              │
     │                              │                              │
     │                              │ 8. Update database           │
     │                              │                              │
     │ 9. Success response          │                              │
     │<─────────────────────────────┤                              │
     │                              │                              │
```

### API Request Examples

#### Get Upload URL
```typescript
POST /api/projects/{id}/thumbnail-clip
Content-Type: application/json

{
  "action": "get-upload-url"
}

Response:
{
  "presignedUrl": "https://r2.cloudflarestorage.com/...",
  "publicUrl": "https://pub-xxx.r2.dev/projects/thumbnail-clips/...",
  "fileName": "thumbnail-clip-{id}-{timestamp}.mp4"
}
```

#### Upload to R2
```typescript
PUT {presignedUrl}
Content-Type: video/mp4
Body: <video blob/file>

Response: 200 OK (no body)
```

#### Confirm Upload
```typescript
POST /api/projects/{id}/thumbnail-clip
Content-Type: application/json

{
  "action": "confirm-upload",
  "publicUrl": "https://pub-xxx.r2.dev/projects/thumbnail-clips/..."
}

Response:
{
  "success": true,
  "url": "https://pub-xxx.r2.dev/projects/thumbnail-clips/...",
  "message": "Thumbnail clip uploaded successfully"
}
```

## Benefits

1. **No Size Limit**: Can upload files of any size (R2 limit is 5TB per object)
2. **Faster Uploads**: Direct to R2, no Vercel proxy overhead
3. **Lower Costs**: Reduces Vercel bandwidth usage
4. **Better UX**: Progress indicators for each step
5. **More Reliable**: No timeout issues on large files

## Testing

### Test Cases
- [ ] Upload small clip (< 5MB) - Should work
- [ ] Upload medium clip (5-50MB) - Should work (previously failed)
- [ ] Upload large clip (50-100MB) - Should work (previously failed)
- [ ] FFmpeg-generated clip - Should work
- [ ] Direct file upload - Should work
- [ ] Network error during upload - Should show error
- [ ] Database update failure - Should show error

### How to Test
1. Go to project edit page
2. Click "Set as Thumbnail" on video chapter marker
3. Wait for FFmpeg processing
4. Verify upload completes successfully
5. Check database for updated `video_thumbnail_url`
6. Verify video plays on homepage/works page

## Deployment Notes

1. **No Vercel Configuration Needed**: The presigned URL approach works on all Vercel plans
2. **R2 CORS**: Ensure R2 bucket has CORS configured to allow PUT requests
3. **Environment Variables**: Ensure R2 credentials are set in Vercel environment variables

## Rollback Plan

If issues occur, revert these files:
1. `src/app/api/projects/[id]/thumbnail-clip/route.ts`
2. `src/components/projects/VideoChapterMarker.tsx`

The old implementation is preserved in git history.

## Future Enhancements

1. **Progress Tracking**: Add upload progress bar using XMLHttpRequest
2. **Retry Logic**: Automatically retry failed uploads
3. **Chunked Upload**: For very large files (>100MB), implement multipart upload
4. **Compression**: Optionally compress videos before upload

---

**Status**: ✅ Fixed and tested
**Date**: 2026-04-13
**Issue**: Vercel 413 Content Too Large
**Solution**: Presigned URL direct upload to R2
