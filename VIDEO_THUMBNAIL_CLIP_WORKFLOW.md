# Video Thumbnail Clip Workflow

## What Happens When You Click "Set as Thumbnail"

When you click the **"☁️ Set as Thumbnail"** button on a saved video range in the Video Chapters tab, here's the complete workflow:

### 1. **Clip Generation** (Client-Side)
- FFmpeg loads in your browser (if not already loaded)
- The full video is downloaded temporarily
- FFmpeg trims the video to your selected range (start → end)
- A new MP4 file is created with just that segment
- Uses `-c copy` for fast processing (no re-encoding)

### 2. **Upload to R2 Storage** (API Call)
- The trimmed clip is sent to `/api/projects/{id}/thumbnail-clip`
- File is uploaded to R2 bucket: `projects/thumbnail-clips/`
- Filename format: `thumbnail-clip-{projectId}-{timestamp}.mp4`
- Returns the public URL of the uploaded clip

### 3. **Database Update** (Automatic)
- The `video_thumbnail_url` column in the database is updated
- Stores the R2 public URL of the thumbnail clip
- `updated_at` timestamp is automatically set

### 4. **Form State Update** (UI Feedback)
- The form's `video_thumbnail_url` field is updated with the new URL
- A success toast notification appears
- The clip is now saved and will be included when you submit the form

### 5. **Form Submission** (When You Click Save)
- When you submit the project form, the `video_thumbnail_url` is saved
- Both `video_url` (full video) and `video_thumbnail_url` (short clip) are stored
- The thumbnail clip can be used for quick previews on the portfolio website

## Key Points

### Two Video URLs
- **`video_url`**: The full-length video (main content)
- **`video_thumbnail_url`**: Short preview clip (for thumbnails/previews)

### Storage Location
- Full videos: `projects/videos/`
- Thumbnail clips: `projects/thumbnail-clips/`

### Use Cases
- **Homepage slider**: Show short preview clips instead of full videos
- **Project cards**: Quick preview on hover
- **Mobile optimization**: Load smaller clips for better performance
- **Social media**: Share short clips easily

## Technical Details

### API Endpoint
```
POST /api/projects/{id}/thumbnail-clip
```

**Request:**
- FormData with video blob
- Content-Type: multipart/form-data

**Response:**
```json
{
  "success": true,
  "url": "https://your-r2-bucket.com/projects/thumbnail-clips/thumbnail-clip-123-1234567890.mp4",
  "message": "Thumbnail clip uploaded successfully"
}
```

### Database Schema
```sql
ALTER TABLE projects ADD COLUMN video_thumbnail_url TEXT;
```

### Component Props
```typescript
<VideoChapterMarker
  videoUrl={formData.video_url}
  chapters={chapters}
  onChaptersChange={setChapters}
  projectId={project?.id}  // Required for upload
  onThumbnailClipUpdate={(url) => {
    // Updates form state with new URL
    setFormData(prev => ({ ...prev, video_thumbnail_url: url }));
  }}
/>
```

## Troubleshooting

### "Project must be saved first"
- The project needs an ID before uploading clips
- Save the project first, then edit it to add thumbnail clips

### "FFmpeg not loaded"
- Wait for the green checkmark: "✅ FFmpeg ready"
- FFmpeg downloads ~30MB on first use (cached after)

### Upload fails
- Check R2 credentials in `.env.local`
- Verify R2 bucket permissions
- Check browser console for detailed errors

## Next Steps

After clicking "Set as Thumbnail":
1. ✅ Clip is generated and uploaded
2. ✅ Database is updated with the URL
3. ✅ Form state reflects the new URL
4. 🔄 Click "Update Project" to save all changes
5. 🎉 Your thumbnail clip is now live!

## Example Workflow

1. Upload full video (e.g., 5-minute project showcase)
2. Go to "Video Chapters" tab
3. Play video and find the best 10-second segment
4. Click "📍 Set Range Here" at the perfect moment
5. Drag handles to fine-tune start/end times
6. Click "✓ Save Range" to add it to the list
7. Click "☁️ Set as Thumbnail" on that range
8. Wait for success message
9. Click "Update Project" to save everything
10. Done! Your project now has both full video and preview clip
