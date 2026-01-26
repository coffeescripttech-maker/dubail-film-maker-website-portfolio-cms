# About Video Upload Feature Guide

## Overview
The About Settings now supports both external video URLs and direct video file uploads to R2 storage.

## Features

### 1. Dual Video Source Options
Admins can choose between:
- **External URL**: Link to videos hosted elsewhere (YouTube, Vimeo, Wistia, etc.)
- **Upload Video**: Upload video files directly to R2 storage

### 2. Video Upload Specifications
- **Supported Formats**: MP4, WebM, MOV
- **Maximum Size**: 500MB per video
- **Storage**: Cloudflare R2 bucket
- **Folder**: `about-videos/`

## How to Use

### Option 1: External URL

1. Navigate to **Settings → About Content**
2. Scroll to **Video Section**
3. Select **External URL** radio button
4. Enter video URL (e.g., `https://example.com/video.mp4`)
5. Enter button text (e.g., "view DubaiFilmMaker reel 2025")
6. Click **Save Changes**

### Option 2: Upload Video

1. Navigate to **Settings → About Content**
2. Scroll to **Video Section**
3. Select **Upload Video** radio button
4. Click **Choose File**
5. Select your video file (max 500MB)
6. Wait for upload to complete (progress bar shows status)
7. Enter button text
8. Click **Save Changes**

## Upload Process

### Progress Stages:
```
1. Selecting file (0%)
   ↓
2. Getting upload URL (10%)
   ↓
3. Uploading to R2 (30-90%)
   ↓
4. Complete (100%)
   ↓
5. Video URL saved
```

### Visual Feedback:
- **Progress Bar**: Shows upload percentage
- **Success Message**: "Video uploaded successfully"
- **Video URL Display**: Shows the R2 URL after upload

## Technical Details

### Upload Flow:
```typescript
1. User selects video file
   ↓
2. Validate file type and size
   ↓
3. Request presigned URL from API
   POST /api/upload/presigned-url
   {
     fileName: "video.mp4",
     fileType: "video/mp4",
     folder: "about-videos"
   }
   ↓
4. Upload directly to R2 using presigned URL
   PUT https://r2-bucket-url/about-videos/timestamp-video.mp4
   ↓
5. Update form with public URL
   https://pub-xxx.r2.dev/about-videos/timestamp-video.mp4
   ↓
6. Save to database on form submit
```

### API Endpoints Used:
- `POST /api/upload/presigned-url` - Get upload URL
- `PUT /api/settings/about` - Save video URL to database

### Database Storage:
```sql
UPDATE about_content 
SET video_url = 'https://pub-xxx.r2.dev/about-videos/1234567890-video.mp4'
WHERE id = 1;
```

## File Validation

### Client-Side Checks:
```typescript
// File type validation
if (!file.type.startsWith('video/')) {
  toast.error('Please select a video file');
  return;
}

// File size validation (500MB)
const maxSize = 500 * 1024 * 1024;
if (file.size > maxSize) {
  toast.error('Video size must be less than 500MB');
  return;
}
```

### Supported MIME Types:
- `video/mp4`
- `video/webm`
- `video/quicktime` (MOV)
- `video/x-msvideo` (AVI)
- `video/x-matroska` (MKV)

## Progress Tracking

### XMLHttpRequest Progress:
```typescript
xhr.upload.addEventListener('progress', (e) => {
  if (e.lengthComputable) {
    const percentComplete = 30 + Math.round((e.loaded / e.total) * 60);
    setUploadProgress(percentComplete);
  }
});
```

### Progress Breakdown:
- **0-10%**: Getting presigned URL
- **10-30%**: Preparing upload
- **30-90%**: Uploading to R2 (actual file transfer)
- **90-100%**: Finalizing

## UI States

### Normal State:
```
Video Source
○ External URL  ● Upload Video

[Choose File] No file chosen

Supported formats: MP4, WebM, MOV. Max size: 500MB
```

### Uploading State:
```
Video Source
○ External URL  ● Upload Video

[Choose File] video.mp4

Uploading video...                    45%
[████████░░░░░░░░░░░░]
```

### Success State:
```
Video Source
○ External URL  ● Upload Video

[Choose File] No file chosen

✓ Video uploaded successfully
https://pub-xxx.r2.dev/about-videos/1234567890-video.mp4
```

## Error Handling

### Common Errors:

1. **File Too Large**
   ```
   Error: Video size must be less than 500MB
   Solution: Compress video or use external URL
   ```

2. **Invalid File Type**
   ```
   Error: Please select a video file
   Solution: Select MP4, WebM, or MOV file
   ```

3. **Upload Failed**
   ```
   Error: Failed to upload video
   Solution: Check internet connection, try again
   ```

4. **Presigned URL Failed**
   ```
   Error: Failed to get upload URL
   Solution: Check R2 configuration, verify credentials
   ```

## Best Practices

### Video Optimization:
1. **Compress videos** before uploading
2. **Use H.264 codec** for MP4 (best compatibility)
3. **Recommended resolution**: 1920x1080 (Full HD)
4. **Target bitrate**: 5-10 Mbps for good quality
5. **Keep under 100MB** for faster loading

### When to Use Each Option:

**External URL** - Best for:
- Videos hosted on CDN
- YouTube/Vimeo embeds
- Very large files (>500MB)
- Videos that change frequently

**Upload Video** - Best for:
- Full control over hosting
- Custom branding
- No external dependencies
- Videos under 500MB

## Integration with Portfolio Website

The video URL (whether external or uploaded) is automatically used in the About page:

```javascript
// In page-renderer.js
const videoElement = document.querySelector('.js-popin-video video');
if (videoElement && pageData.content.video_button.video_url) {
  videoElement.src = pageData.content.video_button.video_url;
}
```

### Video Player:
- Plays in popup modal
- Supports all standard video formats
- Responsive design
- Touch-friendly controls

## Storage Management

### R2 Bucket Structure:
```
r2-bucket/
├── about-videos/
│   ├── 1234567890-company-reel.mp4
│   ├── 1234567891-founder-intro.mp4
│   └── ...
├── about-images/
│   └── ...
└── projects/
    └── ...
```

### File Naming:
```
Format: {timestamp}-{original-filename}
Example: 1704067200000-company-reel-2025.mp4
```

### Cleanup:
- Old videos are NOT automatically deleted
- Manual cleanup required if changing videos frequently
- Consider implementing cleanup script for old files

## Troubleshooting

### Upload Stuck at 0%:
1. Check browser console for errors
2. Verify R2 credentials in `.env.local`
3. Check CORS configuration
4. Try smaller file

### Video Not Playing:
1. Verify video URL is accessible
2. Check video format compatibility
3. Test URL directly in browser
4. Check CORS headers

### Progress Bar Not Moving:
1. Check network connection
2. Verify file isn't corrupted
3. Try different browser
4. Check R2 bucket permissions

## Security Considerations

1. **Authentication**: Only authenticated admins can upload
2. **File Validation**: Type and size checked client and server-side
3. **Presigned URLs**: Temporary, expire after 1 hour
4. **Public Access**: Uploaded videos are publicly accessible (as intended)
5. **No Executable Files**: Only video MIME types accepted

## Performance Tips

1. **Compress videos** using tools like HandBrake or FFmpeg
2. **Use appropriate resolution** - don't upload 4K if 1080p suffices
3. **Consider CDN** for very large files or high traffic
4. **Test upload speed** before uploading large files
5. **Use external URL** for videos >200MB for better UX

## Future Enhancements

Potential improvements:
- Video preview before upload
- Automatic video compression
- Multiple video support
- Video thumbnail generation
- Streaming optimization
- Video analytics
- Subtitle support
- Multiple quality versions

## Related Documentation

- `ABOUT_IMAGES_ADMIN_GUIDE.md` - Image upload guide
- `R2_CORS_SETUP_GUIDE.md` - R2 configuration
- `DIRECT_UPLOAD_FIX.md` - Upload troubleshooting
