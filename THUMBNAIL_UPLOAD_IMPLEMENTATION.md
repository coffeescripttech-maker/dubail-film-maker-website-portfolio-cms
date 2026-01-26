# Thumbnail Upload API Implementation

## Overview

This document describes the implementation of the POST /api/thumbnails/upload endpoint as specified in task 2.1 of the Thumbnail & Film Arrangement Control feature.

## Endpoint Details

**URL**: `/api/thumbnails/upload`  
**Method**: `POST`  
**Content-Type**: `multipart/form-data`  
**Authentication**: Required (NextAuth session)

## Implementation Summary

### File Location
`final_cms/src/app/api/thumbnails/upload/route.ts`

### Requirements Fulfilled

#### ✅ 1. Accept multipart form data with image file and project_id
- Endpoint accepts FormData with two fields:
  - `file`: The image file to upload
  - `project_id`: The ID of the project this thumbnail belongs to

#### ✅ 2. Validate file type (JPEG, PNG, WebP)
- Implemented `validateThumbnailType()` function
- Accepts only: `.jpg`, `.jpeg`, `.png`, `.webp`
- Returns 400 error with message: "Invalid file type. Please upload JPEG, PNG, or WebP images."

#### ✅ 3. Validate file size (max 10MB)
- Implemented `validateThumbnailSize()` function
- Maximum size: 10MB (10,485,760 bytes)
- Returns 413 error with message: "File exceeds maximum size of 10MB."

#### ✅ 4. Generate unique storage key with timestamp
- Implemented `generateThumbnailKey()` function
- Format: `thumbnails/custom/{project_id}/{timestamp}-{sanitized-filename}.{ext}`
- Example: `thumbnails/custom/proj-123/1738012345678-my-thumbnail.jpg`
- Ensures uniqueness through timestamp and project-specific folders

#### ✅ 5. Get presigned URL from R2
- Uses existing `generatePresignedUploadUrl()` from `@/lib/r2-storage`
- Presigned URL valid for 1 hour (3600 seconds)
- Allows direct client-side upload to R2

#### ✅ 6. Return presigned URL and metadata to client
Response format:
```json
{
  "success": true,
  "presignedUrl": "https://...",
  "metadata": {
    "key": "thumbnails/custom/proj-123/1738012345678-thumbnail.jpg",
    "publicUrl": "https://your-r2-domain.com/thumbnails/custom/...",
    "contentType": "image/jpeg",
    "size": 1234567,
    "originalName": "thumbnail.jpg",
    "projectId": "proj-123"
  }
}
```

## Storage Organization

Thumbnails are stored in R2 with the following structure:
```
/thumbnails/
  /custom/
    /{project-id}/
      /{timestamp}-{filename}.jpg
      /{timestamp}-{filename}.png
      /{timestamp}-{filename}.webp
```

This organization:
- Separates custom thumbnails from video-generated ones
- Groups thumbnails by project for easy management
- Uses timestamps to ensure uniqueness
- Maintains original file extensions

## Error Handling

| Status Code | Condition | Message |
|------------|-----------|---------|
| 400 | No file provided | "No file provided" |
| 400 | Missing project_id | "Project ID is required" |
| 400 | Invalid file type | "Invalid file type. Please upload JPEG, PNG, or WebP images." |
| 401 | Not authenticated | "Unauthorized" |
| 413 | File too large | "File exceeds maximum size of 10MB." |
| 500 | Server error | "Upload failed" with error details |

## Security Features

1. **Authentication Required**: Uses NextAuth session validation
2. **File Type Validation**: Only allows image formats
3. **File Size Limits**: Prevents large file uploads
4. **Sanitized Filenames**: Removes special characters to prevent path traversal
5. **Project Isolation**: Each project has its own folder

## Usage Example

### Client-Side Upload Flow

```typescript
// 1. Get presigned URL from API
const formData = new FormData();
formData.append('file', thumbnailFile);
formData.append('project_id', projectId);

const response = await fetch('/api/thumbnails/upload', {
  method: 'POST',
  body: formData,
});

const { presignedUrl, metadata } = await response.json();

// 2. Upload directly to R2 using presigned URL
await fetch(presignedUrl, {
  method: 'PUT',
  body: thumbnailFile,
  headers: {
    'Content-Type': metadata.contentType,
  },
});

// 3. Save metadata.publicUrl to database
await saveThumbnailToDatabase(projectId, metadata.publicUrl);
```

## Testing

### Manual Testing Steps

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Login to the CMS at http://localhost:3000

3. Use a tool like Postman or curl to test:
   ```bash
   curl -X POST http://localhost:3000/api/thumbnails/upload \
     -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
     -F "file=@/path/to/thumbnail.jpg" \
     -F "project_id=test-project-123"
   ```

### Test Cases

1. ✅ Valid JPEG upload → Returns 200 with presigned URL
2. ✅ Valid PNG upload → Returns 200 with presigned URL
3. ✅ Valid WebP upload → Returns 200 with presigned URL
4. ✅ Invalid file type (PDF) → Returns 400
5. ✅ File too large (>10MB) → Returns 413
6. ✅ Missing project_id → Returns 400
7. ✅ Missing file → Returns 400
8. ✅ Unauthenticated request → Returns 401

## Requirements Traceability

This implementation satisfies:
- **Requirement 1.2**: File type validation for custom thumbnails
- **Requirement 1.3**: Unique storage key generation and R2 storage

## Next Steps

After this endpoint is implemented, the next tasks are:
- Task 2.2: Write property test for file validation
- Task 2.3: Write property test for unique storage keys
- Task 2.4: Write unit tests for upload endpoint
- Task 3: Implement thumbnail persistence (database operations)

## Notes

- The endpoint returns a presigned URL for direct client-side upload to R2
- This approach reduces server load and improves upload performance
- The client is responsible for uploading to R2 and then saving metadata to the database
- Future tasks will implement the database persistence layer
