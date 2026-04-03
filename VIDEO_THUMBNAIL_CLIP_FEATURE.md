# Video Thumbnail Clip Feature

## Overview
Automatically upload trimmed video clips to R2 storage and save the URL for use as video thumbnails/previews.

## Database Schema

### New Column: `video_thumbnail_url`
- **Type**: TEXT (nullable)
- **Purpose**: Store URL of short trimmed video clip for preview
- **Usage**: 
  - `video_url` = Full original video
  - `video_thumbnail_url` = Short trimmed clip (5-10 seconds)

### Migration Files Created
- `005-add-video-thumbnail-url.sql` - Adds the column
- `005-add-video-thumbnail-url-rollback.sql` - Removes the column
- `apply-video-thumbnail-migration.bat` - Applies to local and remote

### Apply Migration
```bash
cd final_cms/database/migrations
./apply-video-thumbnail-migration.bat
```

## Implementation Plan

### Step 1: Update TypeScript Types ✅
- Added `video_thumbnail_url?: string | null` to Project interface in `src/lib/db.ts`

### Step 2: Create Upload API Endpoint
Create `src/app/api/projects/[id]/thumbnail-clip/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/r2-storage';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData();
    const videoBlob = formData.get('video') as Blob;
    
    if (!videoBlob) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      );
    }

    // Convert blob to buffer
    const buffer = Buffer.from(await videoBlob.arrayBuffer());
    
    // Upload to R2
    const result = await uploadFile(
      buffer,
      `thumbnail-clip-${params.id}.mp4`,
      {
        folder: 'projects/thumbnail-clips',
        contentType: 'video/mp4'
      }
    );

    // Update database
    const db = getDb();
    await db.prepare(
      'UPDATE projects SET video_thumbnail_url = ? WHERE id = ?'
    ).bind(result.publicUrl, params.id).run();

    return NextResponse.json({
      success: true,
      url: result.publicUrl
    });
  } catch (error) {
    console.error('Error uploading thumbnail clip:', error);
    return NextResponse.json(
      { error: 'Failed to upload thumbnail clip' },
      { status: 500 }
    );
  }
}
```

### Step 3: Modify VideoChapterMarker Component

Update the `exportClip` function to upload instead of just download:

```typescript
const exportAndUploadClip = async (chapter: VideoChapter) => {
  // ... existing FFmpeg code ...
  
  // After generating the clip blob:
  const blob = new Blob([...], { type: "video/mp4" });
  
  // Upload to R2
  const formData = new FormData();
  formData.append('video', blob, `thumbnail-clip.mp4`);
  
  const response = await fetch(`/api/projects/${projectId}/thumbnail-clip`, {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  
  if (data.success) {
    toast.success('Thumbnail clip saved!', {
      description: 'Video thumbnail URL updated'
    });
    // Update form data with new URL
    onThumbnailClipUpdate(data.url);
  }
};
```

### Step 4: Update ProjectForm

Add state and handler for video_thumbnail_url:

```typescript
const [formData, setFormData] = useState({
  // ... existing fields ...
  video_thumbnail_url: '',
});

const handleThumbnailClipUpdate = (url: string) => {
  setFormData(prev => ({
    ...prev,
    video_thumbnail_url: url
  }));
  toast.success('Thumbnail clip URL updated');
};
```

Pass to VideoChapterMarker:

```tsx
<VideoChapterMarker
  videoUrl={formData.video_url}
  chapters={chapters}
  onChaptersChange={setChapters}
  projectId={project?.id}
  onThumbnailClipUpdate={handleThumbnailClipUpdate}
/>
```

### Step 5: Display Thumbnail Clip URL

Add to Media tab in ProjectForm:

```tsx
{formData.video_thumbnail_url && (
  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
    <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
      ✅ Video Thumbnail Clip
    </p>
    <a 
      href={formData.video_thumbnail_url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 break-all"
    >
      {formData.video_thumbnail_url}
    </a>
    <video 
      src={formData.video_thumbnail_url}
      controls
      className="mt-3 w-full max-h-48 rounded-lg"
    />
  </div>
)}
```

## Workflow

1. User uploads full video → saved to `video_url`
2. User goes to Video Chapters tab
3. User selects a range (e.g., 0:05 → 0:15)
4. User clicks "Save Range"
5. User clicks "Export & Upload as Thumbnail"
6. FFmpeg trims the video
7. Trimmed clip uploads to R2 automatically
8. URL saved to `video_thumbnail_url`
9. Form shows preview of thumbnail clip

## Benefits

- **Faster Loading**: Short clips load faster than full videos
- **Better UX**: Preview clips give users quick overview
- **Automatic**: No manual upload needed
- **Storage Efficient**: Only store one short clip per project
- **Flexible**: Can regenerate anytime by selecting different range

## Next Steps

1. Run migration: `apply-video-thumbnail-migration.bat`
2. Create API endpoint: `src/app/api/projects/[id]/thumbnail-clip/route.ts`
3. Update VideoChapterMarker with upload functionality
4. Update ProjectForm to display thumbnail clip
5. Test the complete workflow

## Notes

- Thumbnail clips should be 5-15 seconds max
- Stored in `projects/thumbnail-clips/` folder in R2
- Can be regenerated anytime without affecting original video
- Consider adding a "Set as Thumbnail" button on saved ranges
