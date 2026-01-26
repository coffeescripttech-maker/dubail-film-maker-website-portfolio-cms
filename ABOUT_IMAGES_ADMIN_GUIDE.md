# About Images Management Guide

## Overview
The About Images feature allows admins to upload and manage images that appear on the About page of the portfolio website. This is accessible through the Settings page in the admin panel.

## Accessing the Feature

1. Log in to the admin panel
2. Navigate to **Settings** from the sidebar
3. Click on the **About Images** tab

## Features

### 1. Upload Images
- Click "Choose File" to select an image from your computer
- Supported formats: JPG, PNG, GIF, WebP
- Maximum file size: 5MB
- Images are automatically uploaded to Cloudflare R2 storage

### 2. Manage Images
Each uploaded image displays:
- Preview thumbnail
- Order number (position in the gallery)
- Alt text (for accessibility)
- Edit and Delete buttons

### 3. Reorder Images
- **Drag and drop** images to change their display order
- The order is automatically saved when you drop the image
- Images appear on the About page in the order shown

### 4. Edit Alt Text
- Click **Edit Alt** button on any image
- Enter descriptive text for accessibility
- Click **Save** to update

### 5. Delete Images
- Click **Delete** button on any image
- Confirm the deletion
- Image is removed from both database and storage

## Best Practices

### Image Specifications
- **Aspect Ratio**: 16:9 recommended for consistent display
- **Resolution**: 1920x1080px or higher for best quality
- **File Size**: Keep under 2MB for faster loading
- **Format**: WebP preferred for best compression

### Alt Text Guidelines
- Be descriptive and concise
- Describe what's in the image
- Avoid "image of" or "picture of"
- Example: "Team collaborating in modern office space"

### Organization
- Order images to tell a story
- Place most important images first
- Group related images together
- Maintain visual consistency

## Technical Details

### API Endpoints
- `GET /api/about/images` - Fetch all images
- `POST /api/about/images` - Upload new image
- `PUT /api/about/images/[id]` - Update image alt text
- `DELETE /api/about/images/[id]` - Delete image
- `PUT /api/about/images/reorder` - Update image order

### Database Schema
```sql
CREATE TABLE about_images (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  alt TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### Storage
- Images are stored in Cloudflare R2 bucket
- Public URLs are generated automatically
- CORS is configured for direct uploads

## Troubleshooting

### Upload Fails
- Check file size (must be under 5MB)
- Verify file format is supported
- Ensure R2 bucket is properly configured
- Check CORS settings in R2

### Images Not Displaying
- Verify R2 bucket public access is enabled
- Check image URLs are accessible
- Ensure CORS headers are set correctly
- Clear browser cache

### Reorder Not Working
- Try refreshing the page
- Check browser console for errors
- Ensure you're dragging within the grid area
- Verify API endpoint is accessible

## Integration with Portfolio Website

The About page on the portfolio website automatically fetches and displays these images:

```javascript
// Fetches from public API
fetch('https://your-cms-domain.com/api/public/about')
  .then(res => res.json())
  .then(data => {
    // data.images contains all about images in order
  });
```

Images are displayed in a responsive grid layout with lazy loading for optimal performance.

## Security Notes

- Only authenticated admins can manage images
- All uploads are validated for file type and size
- Image URLs are publicly accessible (as intended)
- Alt text is sanitized to prevent XSS attacks

## Future Enhancements

Potential improvements:
- Bulk upload multiple images
- Image cropping/editing tools
- Caption support in addition to alt text
- Image categories or tags
- Automatic image optimization
- CDN integration for faster delivery
