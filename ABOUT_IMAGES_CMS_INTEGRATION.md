# About Images CMS Integration

## Overview
Complete CMS integration for managing About page images through the admin interface. Images are stored in the database and served via API to the portfolio website.

## Architecture

### Database Schema
```sql
CREATE TABLE about_images (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  alt TEXT,
  order_index INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Data Flow
```
CMS Admin → Upload Image → R2 Storage → Save URL to DB → API → Portfolio Website
```

## API Endpoints

### Admin Endpoints (Authentication Required)

#### 1. List All Images
```http
GET /api/about/images
```

**Response:**
```json
{
  "images": [
    {
      "id": "uuid",
      "url": "https://r2.dev/path/to/image.jpg",
      "alt": "Image description",
      "order_index": 1,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### 2. Create New Image
```http
POST /api/about/images
Content-Type: application/json

{
  "url": "https://r2.dev/path/to/image.jpg",
  "alt": "Image description"
}
```

**Response:**
```json
{
  "image": {
    "id": "uuid",
    "url": "https://r2.dev/path/to/image.jpg",
    "alt": "Image description",
    "order_index": 5,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### 3. Update Image
```http
PUT /api/about/images/[id]
Content-Type: application/json

{
  "alt": "Updated description",
  "order_index": 2
}
```

**Response:**
```json
{
  "image": {
    "id": "uuid",
    "url": "https://r2.dev/path/to/image.jpg",
    "alt": "Updated description",
    "order_index": 2,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### 4. Delete Image
```http
DELETE /api/about/images/[id]
```

**Response:**
```json
{
  "success": true
}
```

#### 5. Reorder Images (Batch Update)
```http
POST /api/about/images/reorder
Content-Type: application/json

{
  "images": [
    { "id": "uuid-1", "order_index": 1 },
    { "id": "uuid-2", "order_index": 2 },
    { "id": "uuid-3", "order_index": 3 }
  ]
}
```

**Response:**
```json
{
  "images": [
    {
      "id": "uuid-1",
      "url": "...",
      "alt": "...",
      "order_index": 1,
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

### Public Endpoint (No Authentication)

#### Get About Content with Images
```http
GET /api/public/about
```

**Response:**
```json
{
  "page": {
    "title": "About",
    "description": "...",
    "founder": {
      "name": "Ahmed Al Mutawa",
      "title": "FILM DIRECTOR / EXECUTIVE PRODUCER",
      "bio": "..."
    },
    "content": {
      "main_text": "...",
      "video_button": {
        "text": "view DubaiFilmMaker reel 2025",
        "video_url": "https://..."
      }
    },
    "images": [
      {
        "url": "https://r2.dev/path/to/image.jpg",
        "alt": "Image description"
      }
    ]
  }
}
```

## Migration

### Apply Migration

**Windows:**
```bash
cd final_cms/database/migrations
apply-about-images-migration.bat
```

**Manual (using curl):**
```bash
curl -X POST "https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/d1/database/{DATABASE_ID}/query" \
  -H "Authorization: Bearer {API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data @002-add-about-images.sql
```

### Rollback Migration

```bash
# Apply rollback SQL
curl -X POST "https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/d1/database/{DATABASE_ID}/query" \
  -H "Authorization: Bearer {API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data @002-add-about-images-rollback.sql
```

## Portfolio Website Integration

### Data Loader Update

The `data-loader.js` now tries CMS API first, then falls back to local JSON:

```javascript
async function fetchAbout() {
  // Try CMS API first
  if (API_CONFIG.USE_CMS_API) {
    try {
      const response = await fetch(`${API_CONFIG.CMS_BASE_URL}/about`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('CMS API not available, falling back to local JSON');
    }
  }
  
  // Fallback to local JSON
  return await fetchData(null, API_CONFIG.LOCAL_PATHS.about);
}
```

### Configuration

**Enable CMS API:**
```javascript
// final_portfolio_website/assets/js/data-loader.js
const API_CONFIG = {
  USE_CMS_API: true,
  CMS_BASE_URL: 'https://your-cms-domain.com/api/public',
  // ...
};
```

**Disable CMS API (use local JSON):**
```javascript
const API_CONFIG = {
  USE_CMS_API: false,
  // ...
};
```

## CMS UI Component (To Be Implemented)

### Location
```
final_cms/src/app/(admin)/(others-pages)/settings/
└── components/
    └── AboutImagesManager.tsx
```

### Features
- Upload images to R2
- Display image grid with thumbnails
- Drag-and-drop reordering
- Edit alt text
- Delete images
- Preview images

### Example Component Structure
```tsx
'use client';

import { useState, useEffect } from 'react';
import { FileUpload } from '@/components/upload/FileUpload';

interface AboutImage {
  id: string;
  url: string;
  alt: string | null;
  order_index: number;
}

export function AboutImagesManager() {
  const [images, setImages] = useState<AboutImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadImages();
  }, []);

  async function loadImages() {
    const response = await fetch('/api/about/images');
    const data = await response.json();
    setImages(data.images);
    setLoading(false);
  }

  async function handleUpload(url: string) {
    const response = await fetch('/api/about/images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, alt: '' })
    });
    
    if (response.ok) {
      await loadImages();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this image?')) return;
    
    const response = await fetch(`/api/about/images/${id}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      await loadImages();
    }
  }

  async function handleReorder(newOrder: AboutImage[]) {
    const updates = newOrder.map((img, index) => ({
      id: img.id,
      order_index: index + 1
    }));

    const response = await fetch('/api/about/images/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: updates })
    });

    if (response.ok) {
      await loadImages();
    }
  }

  return (
    <div>
      <h2>About Page Images</h2>
      
      <FileUpload
        onUploadComplete={handleUpload}
        accept="image/*"
      />

      <div className="image-grid">
        {images.map((image) => (
          <div key={image.id} className="image-card">
            <img src={image.url} alt={image.alt || ''} />
            <input
              type="text"
              value={image.alt || ''}
              onChange={(e) => {
                // Update alt text
              }}
              placeholder="Alt text"
            />
            <button onClick={() => handleDelete(image.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Testing

### 1. Test Migration
```bash
# Apply migration
cd final_cms/database/migrations
apply-about-images-migration.bat

# Verify table exists
curl -X POST "https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/d1/database/{DATABASE_ID}/query" \
  -H "Authorization: Bearer {API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"sql":"SELECT * FROM about_images"}'
```

### 2. Test API Endpoints

**List images:**
```bash
curl http://localhost:3000/api/about/images
```

**Create image:**
```bash
curl -X POST http://localhost:3000/api/about/images \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/image.jpg","alt":"Test image"}'
```

**Update image:**
```bash
curl -X PUT http://localhost:3000/api/about/images/{id} \
  -H "Content-Type: application/json" \
  -d '{"alt":"Updated alt text"}'
```

**Delete image:**
```bash
curl -X DELETE http://localhost:3000/api/about/images/{id}
```

**Public endpoint:**
```bash
curl http://localhost:3000/api/public/about
```

### 3. Test Portfolio Website

1. Open browser DevTools (F12)
2. Navigate to `/about` page
3. Check console logs:
   - Should see: `✓ About data loaded from CMS API`
   - Or fallback: `Using local about.json as fallback`
4. Verify images are displayed correctly

## Workflow

### Adding New Image

1. **Upload to R2:**
   - Use existing FileUpload component
   - Get R2 URL after upload

2. **Save to Database:**
   ```javascript
   const response = await fetch('/api/about/images', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       url: 'https://r2.dev/path/to/image.jpg',
       alt: 'Image description'
     })
   });
   ```

3. **Verify on Portfolio:**
   - Visit portfolio website `/about` page
   - New image should appear at the end

### Reordering Images

1. **Drag and drop in CMS UI** (to be implemented)
2. **Or use API:**
   ```javascript
   const response = await fetch('/api/about/images/reorder', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       images: [
         { id: 'uuid-1', order_index: 1 },
         { id: 'uuid-2', order_index: 2 }
       ]
     })
   });
   ```

### Deleting Image

1. **Delete from CMS:**
   ```javascript
   await fetch(`/api/about/images/${id}`, { method: 'DELETE' });
   ```

2. **Image removed from:**
   - Database
   - Portfolio website (on next load)
   - R2 storage (manual cleanup recommended)

## Benefits

✅ **Centralized Management** - All about images managed through CMS  
✅ **No Code Changes** - Update images without touching code  
✅ **Drag-and-Drop Reordering** - Easy image organization  
✅ **API-First** - Portfolio website fetches from API  
✅ **Fallback Support** - Local JSON fallback if API unavailable  
✅ **Type-Safe** - TypeScript interfaces for all data structures  
✅ **Consistent Pattern** - Follows same pattern as thumbnails/projects  

## Next Steps

1. ✅ Create database migration
2. ✅ Create API endpoints
3. ✅ Update portfolio data-loader.js
4. ⏳ Create CMS UI component (AboutImagesManager.tsx)
5. ⏳ Add to Settings page
6. ⏳ Test full workflow
7. ⏳ Deploy to production

## Troubleshooting

### Images not showing on portfolio
- Check browser console for API errors
- Verify `USE_CMS_API: true` in data-loader.js
- Check CMS_BASE_URL is correct
- Test public API endpoint directly

### Migration failed
- Check Cloudflare credentials in .env.local
- Verify database ID is correct
- Check SQL syntax in migration file
- Try manual curl command

### API returns 500 error
- Check server logs for detailed error
- Verify database table exists
- Check Cloudflare API token permissions
- Test D1 connection with simple query

