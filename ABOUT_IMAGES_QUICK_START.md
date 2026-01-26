# About Images - Quick Start Guide

## What This Does
Manage About page images through the CMS instead of editing JSON files. Images are stored in the database and automatically appear on the portfolio website.

## Setup (One-Time)

### 1. Apply Database Migration
```bash
cd final_cms/database/migrations
apply-about-images-migration.bat
```

This creates the `about_images` table and imports the 4 existing images from `about.json`.

### 2. Verify Migration
```bash
# Start dev server
cd final_cms
npm run dev

# In another terminal, test the API
node test-about-images-api.js
```

You should see:
```
✓ All tests completed successfully!
```

### 3. Enable CMS API in Portfolio
Edit `final_portfolio_website/assets/js/data-loader.js`:
```javascript
const API_CONFIG = {
  USE_CMS_API: true,  // Set to true
  CMS_BASE_URL: 'https://your-cms-domain.com/api/public',
  // ...
};
```

## Usage

### View All Images
```bash
curl http://localhost:3000/api/about/images
```

### Add New Image

**Step 1: Upload to R2**
- Use the CMS file upload component
- Get the R2 URL (e.g., `https://pub-xxx.r2.dev/about/image.jpg`)

**Step 2: Save to Database**
```bash
curl -X POST http://localhost:3000/api/about/images \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://pub-xxx.r2.dev/about/image.jpg",
    "alt": "Studio workspace"
  }'
```

**Step 3: Verify on Portfolio**
- Visit `http://localhost:3000/about`
- New image should appear at the end

### Update Image Alt Text
```bash
curl -X PUT http://localhost:3000/api/about/images/{IMAGE_ID} \
  -H "Content-Type: application/json" \
  -d '{"alt": "Updated description"}'
```

### Reorder Images
```bash
curl -X POST http://localhost:3000/api/about/images/reorder \
  -H "Content-Type: application/json" \
  -d '{
    "images": [
      {"id": "about-img-1", "order_index": 1},
      {"id": "about-img-2", "order_index": 2},
      {"id": "about-img-3", "order_index": 3}
    ]
  }'
```

### Delete Image
```bash
curl -X DELETE http://localhost:3000/api/about/images/{IMAGE_ID}
```

## Portfolio Website Integration

### How It Works
1. Portfolio website calls `/api/public/about`
2. CMS returns about content + images from database
3. If API fails, falls back to local `about.json`

### Test Integration
```bash
# Visit portfolio about page
http://localhost:8080/about

# Check browser console
# Should see: "✓ About data loaded from CMS API"
```

### Fallback Behavior
If CMS API is unavailable:
- Portfolio uses local `about.json`
- Shows the 4 default images
- No errors displayed to users

## API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/about/images` | List all images (admin) |
| POST | `/api/about/images` | Create new image |
| PUT | `/api/about/images/[id]` | Update image |
| DELETE | `/api/about/images/[id]` | Delete image |
| POST | `/api/about/images/reorder` | Batch reorder |
| GET | `/api/public/about` | Public endpoint (no auth) |

## Next Steps

### Create CMS UI Component
Location: `final_cms/src/app/(admin)/(others-pages)/settings/`

Features needed:
- Image upload interface
- Grid view of images
- Drag-and-drop reordering
- Edit alt text inline
- Delete confirmation
- Preview images

### Add to Settings Page
1. Create `AboutImagesManager.tsx` component
2. Add tab in Settings page
3. Wire up API calls
4. Test full workflow

## Troubleshooting

### Migration Failed
**Error:** "Cloudflare credentials not configured"
- Check `.env.local` has `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`
- Verify credentials are correct

### API Returns 500
**Error:** "Failed to fetch about images"
- Check database table exists: `SELECT * FROM about_images`
- Verify D1 connection works
- Check server logs for details

### Images Not Showing on Portfolio
**Issue:** Portfolio shows old images
- Clear browser cache (Ctrl+Shift+R)
- Check `USE_CMS_API: true` in data-loader.js
- Verify CMS_BASE_URL is correct
- Test public API directly: `curl http://localhost:3000/api/public/about`

### No Images After Migration
**Issue:** Empty images array
- Check migration ran successfully
- Verify default images were inserted
- Run: `curl http://localhost:3000/api/about/images`

## Files Created

```
final_cms/
├── src/app/api/
│   ├── about/images/
│   │   ├── route.ts                    # List & Create
│   │   ├── [id]/route.ts               # Update & Delete
│   │   └── reorder/route.ts            # Batch reorder
│   └── public/about/
│       └── route.ts                    # Public endpoint
├── database/migrations/
│   ├── 002-add-about-images.sql        # Migration
│   ├── 002-add-about-images-rollback.sql
│   └── apply-about-images-migration.bat
├── test-about-images-api.js            # API tests
├── ABOUT_IMAGES_CMS_INTEGRATION.md     # Full docs
└── ABOUT_IMAGES_QUICK_START.md         # This file

final_portfolio_website/
└── assets/js/
    └── data-loader.js                  # Updated with API fallback
```

## Benefits

✅ No code changes needed to update images  
✅ Manage images through CMS admin UI  
✅ Automatic ordering and organization  
✅ API-first with JSON fallback  
✅ Type-safe TypeScript implementation  
✅ Follows existing patterns (thumbnails, projects)  

## Support

For issues or questions:
1. Check `ABOUT_IMAGES_CMS_INTEGRATION.md` for detailed docs
2. Run `test-about-images-api.js` to verify API works
3. Check browser console for errors
4. Review server logs for API errors

