# Thumbnail and Poster Image Synchronization

## Overview
The thumbnail system now automatically syncs with the `poster_image` field to ensure consistency across the application.

## Database Columns

### Projects Table
- **`poster_image`** - Main image field (required in form, used for display)
- **`poster_image_srcset`** - Responsive image srcset
- **`thumbnail_url`** - Thumbnail URL (from thumbnail system)
- **`thumbnail_type`** - Type: 'custom' or 'video_frame'
- **`thumbnail_timestamp`** - Timestamp for video frames
- **`thumbnail_metadata`** - JSON metadata

## Synchronization Behavior

### When Activating a Thumbnail
Both `thumbnail_url` AND `poster_image` are updated to the same URL:

```typescript
// In thumbnail-service.ts - setActiveThumbnail()
UPDATE projects SET 
  thumbnail_url = ?,
  thumbnail_type = ?,
  thumbnail_timestamp = ?,
  poster_image = ?,  // ← Also updated
  updated_at = CURRENT_TIMESTAMP
WHERE id = ?
```

### When Saving New Thumbnail (as active)
Both fields are updated:

```typescript
// In thumbnail-service.ts - saveThumbnailMetadata()
UPDATE projects SET 
  thumbnail_url = ?,
  thumbnail_type = ?,
  thumbnail_timestamp = ?,
  thumbnail_metadata = ?,
  poster_image = ?,  // ← Also updated
  updated_at = CURRENT_TIMESTAMP
WHERE id = ?
```

### When Deleting Active Thumbnail
Both fields are cleared:

```typescript
// In thumbnail-service.ts - deleteThumbnail()
UPDATE projects SET 
  thumbnail_url = NULL,
  thumbnail_type = NULL,
  thumbnail_timestamp = NULL,
  thumbnail_metadata = NULL,
  poster_image = NULL,  // ← Also cleared
  updated_at = CURRENT_TIMESTAMP
WHERE id = ?
```

### In the Form Component
When a thumbnail is changed via ThumbnailManager, both form fields are updated:

```typescript
// In ProjectForm.tsx
onThumbnailChange={(thumbnailUrl) => {
  handleInputChange('thumbnail_url', thumbnailUrl);
  handleInputChange('poster_image', thumbnailUrl); // ← Also updated
  toast.success('Thumbnail Updated');
}}
```

## User Experience

1. **Upload Custom Thumbnail**
   - User uploads via ThumbnailManager
   - Both `poster_image` and `thumbnail_url` are set
   - Form shows updated image immediately

2. **Capture Video Frame**
   - User captures frame from video
   - Frame is saved to R2 and database
   - Both `poster_image` and `thumbnail_url` are set
   - Form shows captured frame immediately

3. **Switch Between Thumbnails**
   - User clicks different thumbnail option
   - Both `poster_image` and `thumbnail_url` are updated
   - Form reflects the change immediately

4. **Delete Active Thumbnail**
   - User deletes the active thumbnail
   - Both `poster_image` and `thumbnail_url` are cleared
   - Form shows empty state

## Benefits

- **Consistency**: Poster image always matches the active thumbnail
- **Backward Compatibility**: Existing code using `poster_image` continues to work
- **Single Source of Truth**: Thumbnail system controls both fields
- **Form Validation**: Poster image field is automatically populated when using thumbnail system

## Files Modified

1. **`src/lib/thumbnail-service.ts`**
   - Updated `setActiveThumbnail()` to sync `poster_image`
   - Updated `saveThumbnailMetadata()` to sync `poster_image`
   - Updated `deleteThumbnail()` to clear `poster_image`

2. **`src/components/projects/ProjectForm.tsx`**
   - Updated `onThumbnailChange` callback to update both fields

## Testing

To verify the synchronization:

1. Edit a project with a video
2. Capture a video frame or upload custom thumbnail
3. Check that the "Poster Image" field in the form shows the thumbnail
4. Switch to a different thumbnail option
5. Verify the "Poster Image" field updates
6. Delete the active thumbnail
7. Verify the "Poster Image" field is cleared

## Notes

- The `poster_image` field remains required in the form
- Users can still manually upload via the "Poster Image" field
- The thumbnail system provides an enhanced way to manage this field
- Both approaches update the same database column
