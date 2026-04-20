# Video Upload Size Limit Increased to 800MB

## Changes Made

### 1. Next.js Configuration - `next.config.ts`
Updated the body size limit for server actions:

```typescript
experimental: {
  serverActions: {
    bodySizeLimit: '800mb', // Increased from 700mb to 800mb
  },
}
```

### 2. R2 Storage Validation - `src/lib/r2-storage.ts`
Updated the maximum video file size constant:

```typescript
export const MAX_VIDEO_SIZE_MB = 800; // Increased from 500MB to 800MB
```

## What This Affects

### Upload Endpoints
These API routes now accept videos up to 800MB:
- `/api/upload` - Main upload endpoint
- `/api/projects/[id]/thumbnail-clip` - Thumbnail clip upload
- Any other routes using `MAX_VIDEO_SIZE_MB` validation

### User Experience
- Users can now upload video files up to 800MB
- Error message will show: "File too large. Maximum size: 800MB"
- Upload progress will work for files up to 800MB

## Important Notes

### 1. Restart Required ⚠️
You MUST restart the development server for these changes to take effect:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### 2. Cloudflare R2 Limits
Cloudflare R2 has the following limits:
- Maximum object size: 5TB (we're well within this)
- No bandwidth charges for uploads
- Our 800MB limit is reasonable for video files

### 3. Upload Time Considerations
- 800MB file on 10 Mbps upload: ~10-15 minutes
- 800MB file on 50 Mbps upload: ~2-3 minutes
- 800MB file on 100 Mbps upload: ~1-2 minutes

Consider adding:
- Upload progress indicators (already implemented)
- Resume capability for failed uploads (future enhancement)
- Compression recommendations for users

### 4. Production Deployment
When deploying to production (Vercel/Cloudflare Pages):
- Vercel has a 4.5MB body size limit on Hobby plan
- Vercel Pro plan supports up to 4.5MB for serverless functions
- For large video uploads, consider:
  - Direct R2 uploads using presigned URLs (recommended)
  - Chunked uploads
  - Client-side compression before upload

## Current Upload Flow

### Development (Local)
1. User selects video file (up to 800MB)
2. File is validated client-side
3. File is sent to API route via FormData
4. Server validates file size (≤ 800MB)
5. Server uploads to R2
6. Success response with URL

### Production Considerations
For production, you may want to implement direct R2 uploads:

```typescript
// Get presigned URL from server
const { presignedUrl } = await fetch('/api/upload/presigned-url', {
  method: 'POST',
  body: JSON.stringify({ fileName, fileType, fileSize })
});

// Upload directly to R2 (bypasses server size limits)
await fetch(presignedUrl, {
  method: 'PUT',
  body: file,
  headers: { 'Content-Type': file.type }
});
```

## Testing

### Test Cases
1. ✅ Upload 100MB video - Should succeed
2. ✅ Upload 500MB video - Should succeed
3. ✅ Upload 800MB video - Should succeed
4. ❌ Upload 801MB video - Should fail with error message
5. ✅ Upload progress shows correctly for large files

### How to Test
1. Restart dev server: `npm run dev`
2. Go to Projects page
3. Create/edit a project
4. Try uploading a video file between 500-800MB
5. Verify upload completes successfully

## Files Modified

1. `final_cms/next.config.ts` - Body size limit
2. `final_cms/src/lib/r2-storage.ts` - MAX_VIDEO_SIZE_MB constant

## Rollback Instructions

If you need to revert to 500MB limit:

### 1. Revert next.config.ts
```typescript
experimental: {
  serverActions: {
    bodySizeLimit: '500mb',
  },
}
```

### 2. Revert r2-storage.ts
```typescript
export const MAX_VIDEO_SIZE_MB = 500;
```

### 3. Restart server
```bash
npm run dev
```

---

**Status**: ✅ Complete - Restart server to apply changes
**Date**: 2026-04-13
**Previous Limit**: 500MB
**New Limit**: 800MB
