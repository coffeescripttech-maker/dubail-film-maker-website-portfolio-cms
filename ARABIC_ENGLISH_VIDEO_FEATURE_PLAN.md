# Arabic/English Video Language Switching - Implementation Plan

## Requirement
Allow users to switch between Arabic and English versions of videos on the project detail page. English version shows by default, with a button to switch to Arabic version.

## Current State Analysis

### Existing Video Fields
- `video_url` - Currently stores the main video URL
- `video_url_full` - Full-length video (vs thumbnail clip)
- `video_thumbnail_url` - Short clip for thumbnails/previews

### Current Video Flow
1. Homepage/Works page: Shows `video_url` (thumbnail clip) or `video_url_full`
2. Project detail page: Shows `video_url_full` (full video)
3. Slider: Shows `video_url` (thumbnail clip)

## Proposed Solution

### Phase 1: Database Schema Changes

#### Add New Columns to `projects` Table
```sql
-- Add Arabic video URL fields
ALTER TABLE projects ADD COLUMN video_url_arabic TEXT;
ALTER TABLE projects ADD COLUMN video_url_full_arabic TEXT;
ALTER TABLE projects ADD COLUMN video_thumbnail_url_arabic TEXT;
```

#### Field Mapping
| Field | Purpose | Default Language |
|-------|---------|------------------|
| `video_url` | Thumbnail clip | English |
| `video_url_full` | Full video | English |
| `video_thumbnail_url` | Short preview | English |
| `video_url_arabic` | Thumbnail clip | Arabic |
| `video_url_full_arabic` | Full video | Arabic |
| `video_thumbnail_url_arabic` | Short preview | Arabic |

### Phase 2: CMS Updates

#### 2.1 Update ProjectForm Component
Add new upload fields for Arabic videos:

```typescript
// In ProjectForm.tsx
<div className="space-y-4">
  <h3>English Version (Default)</h3>
  <FileUpload
    label="Video File (English)"
    accept="video/*"
    value={formData.video_url}
    onChange={(url) => handleFieldChange('video_url', url)}
  />
  <FileUpload
    label="Full Video (English)"
    accept="video/*"
    value={formData.video_url_full}
    onChange={(url) => handleFieldChange('video_url_full', url)}
  />
</div>

<div className="space-y-4 mt-6">
  <h3>Arabic Version (Optional)</h3>
  <FileUpload
    label="Video File (Arabic)"
    accept="video/*"
    value={formData.video_url_arabic}
    onChange={(url) => handleFieldChange('video_url_arabic', url)}
  />
  <FileUpload
    label="Full Video (Arabic)"
    accept="video/*"
    value={formData.video_url_full_arabic}
    onChange={(url) => handleFieldChange('video_url_full_arabic', url)}
  />
</div>
```

#### 2.2 Update API Routes
Modify `/api/projects` to handle new Arabic video fields:

```typescript
// In route.ts
const project = {
  // ... existing fields
  video_url: data.video_url || null,
  video_url_full: data.video_url_full || null,
  video_thumbnail_url: data.video_thumbnail_url || null,
  video_url_arabic: data.video_url_arabic || null,
  video_url_full_arabic: data.video_url_full_arabic || null,
  video_thumbnail_url_arabic: data.video_thumbnail_url_arabic || null,
};
```

### Phase 3: Portfolio Website Updates

#### 3.1 Update Project Detail Page HTML
Add language toggle button:

```html
<!-- In project-detail.html -->
<div class="box box--video">
  <div class="box box--video__info">
    <p id="project-client"></p>
    <h1 id="project-title">Loading...</h1>
    
    <!-- Language Toggle Button -->
    <div class="language-toggle" id="language-toggle" style="display: none;">
      <button class="btn-language active" data-lang="en">English</button>
      <button class="btn-language" data-lang="ar">العربية</button>
    </div>
    
    <a href="#credits" class="lnk lnk--credits js-toggle-credits"></a>
    <!-- ... rest of content -->
  </div>
  
  <div class="box--video__wrapper video-wrapper js-player fit-contain">
    <video id="project-video" src="" autoplay playsinline controls></video>
  </div>
  
  <!-- ... rest of content -->
</div>
```

#### 3.2 Add CSS Styling
```css
/* In project-detail.css or inline styles */
.language-toggle {
  display: flex;
  gap: 0.5rem;
  margin: 1rem 0;
}

.btn-language {
  padding: 0.5rem 1rem;
  border: 1px solid #fff;
  background: transparent;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.875rem;
}

.btn-language:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-language.active {
  background: #fff;
  color: #000;
}
```

#### 3.3 Add JavaScript Logic
```javascript
// In project-detail.html <script> section
let currentProject = null;
let currentLanguage = 'en'; // Default to English

function renderProjectDetail(project) {
  currentProject = project;
  
  // ... existing rendering code
  
  // Show language toggle if Arabic version exists
  const languageToggle = document.getElementById('language-toggle');
  const hasArabicVersion = project.video_url_full_arabic || project.video_url_arabic;
  
  if (hasArabicVersion) {
    languageToggle.style.display = 'flex';
    
    // Add click handlers
    const buttons = languageToggle.querySelectorAll('.btn-language');
    buttons.forEach(btn => {
      btn.addEventListener('click', function() {
        const lang = this.dataset.lang;
        switchLanguage(lang);
      });
    });
  } else {
    languageToggle.style.display = 'none';
  }
  
  // Load English version by default
  loadVideoForLanguage('en');
}

function switchLanguage(lang) {
  if (!currentProject) return;
  
  currentLanguage = lang;
  
  // Update button states
  const buttons = document.querySelectorAll('.btn-language');
  buttons.forEach(btn => {
    if (btn.dataset.lang === lang) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // Load video for selected language
  loadVideoForLanguage(lang);
}

function loadVideoForLanguage(lang) {
  if (!currentProject) return;
  
  const videoElement = document.getElementById('project-video');
  
  // Determine which video URL to use
  let videoUrl;
  if (lang === 'ar') {
    // Use Arabic version if available, fallback to English
    videoUrl = currentProject.video_url_full_arabic || 
               currentProject.video_url_arabic || 
               currentProject.video_url_full || 
               currentProject.video_url;
  } else {
    // Use English version
    videoUrl = currentProject.video_url_full || currentProject.video_url;
  }
  
  // Store current playback position
  const currentTime = videoElement.currentTime;
  const wasPaused = videoElement.paused;
  
  // Update video source
  videoElement.src = videoUrl;
  
  // Try to resume from same position (if videos are similar length)
  videoElement.addEventListener('loadedmetadata', function() {
    if (currentTime > 0 && currentTime < videoElement.duration) {
      videoElement.currentTime = currentTime;
    }
    if (!wasPaused) {
      videoElement.play().catch(err => console.log('Autoplay prevented:', err));
    }
  }, { once: true });
  
  console.log(`Switched to ${lang === 'ar' ? 'Arabic' : 'English'} version:`, videoUrl);
}
```

### Phase 4: API Response Updates

#### Update Public API
Modify `/api/public/projects` to include Arabic video fields:

```typescript
// In route.ts
const projects = results.map(project => ({
  // ... existing fields
  video_url: project.video_url,
  video_url_full: project.video_url_full,
  video_thumbnail_url: project.video_thumbnail_url,
  video_url_arabic: project.video_url_arabic,
  video_url_full_arabic: project.video_url_full_arabic,
  video_thumbnail_url_arabic: project.video_thumbnail_url_arabic,
  // ... rest of fields
}));
```

## Migration Strategy (Safe Rollout)

### Step 1: Database Migration (Non-Breaking)
```sql
-- Create migration file: 006-add-arabic-video-fields.sql
ALTER TABLE projects ADD COLUMN video_url_arabic TEXT;
ALTER TABLE projects ADD COLUMN video_url_full_arabic TEXT;
ALTER TABLE projects ADD COLUMN video_thumbnail_url_arabic TEXT;
```

Run migration:
```bash
wrangler d1 execute portfolio-cms-db --local --file=./database/migrations/006-add-arabic-video-fields.sql
```

### Step 2: Update CMS (Backward Compatible)
1. Update TypeScript interfaces to include optional Arabic fields
2. Update ProjectForm to show Arabic upload fields
3. Update API routes to accept and save Arabic fields
4. Test uploading Arabic videos for one project

### Step 3: Update Portfolio Website (Graceful Degradation)
1. Add language toggle UI (hidden by default)
2. Add JavaScript logic to detect Arabic videos
3. Show toggle only if Arabic version exists
4. Default to English if Arabic not available

### Step 4: Testing
1. Test project without Arabic video - should work as before
2. Test project with Arabic video - should show toggle
3. Test switching between languages
4. Test video playback continuity when switching

## Rollback Plan

If issues occur, rollback is safe because:
1. New columns are optional (NULL allowed)
2. Existing functionality uses original fields
3. Language toggle only shows if Arabic videos exist
4. No breaking changes to existing data

Rollback migration:
```sql
-- 006-add-arabic-video-fields-rollback.sql
ALTER TABLE projects DROP COLUMN video_url_arabic;
ALTER TABLE projects DROP COLUMN video_url_full_arabic;
ALTER TABLE projects DROP COLUMN video_thumbnail_url_arabic;
```

## File Changes Summary

### CMS Files to Modify
1. `database/migrations/006-add-arabic-video-fields.sql` - NEW
2. `src/types/project.ts` - Add Arabic video fields to interface
3. `src/components/projects/ProjectForm.tsx` - Add Arabic upload fields
4. `src/app/api/projects/route.ts` - Handle Arabic fields in CRUD
5. `src/app/api/public/projects/route.ts` - Include Arabic fields in response

### Portfolio Files to Modify
1. `works/project-detail.html` - Add language toggle UI
2. `assets/css/project-detail.css` - NEW - Add toggle styling
3. `assets/js/page-renderer.js` - Update renderProjectDetail function

## Benefits of This Approach

✅ **Non-Breaking**: Existing projects work without Arabic videos  
✅ **Backward Compatible**: All existing functionality preserved  
✅ **Graceful Degradation**: Toggle only shows when needed  
✅ **Flexible**: Can add Arabic videos gradually  
✅ **User-Friendly**: Simple toggle interface  
✅ **SEO-Friendly**: Can add language metadata later  

## Future Enhancements

1. **Auto-detect user language** from browser settings
2. **Remember language preference** in localStorage
3. **Add language indicator** to video player
4. **Support more languages** (French, Spanish, etc.)
5. **Add subtitles/captions** support
6. **Language-specific thumbnails** for homepage/works page

## Timeline Estimate

- **Phase 1** (Database): 30 minutes
- **Phase 2** (CMS): 2-3 hours
- **Phase 3** (Portfolio): 2-3 hours
- **Phase 4** (API): 1 hour
- **Testing**: 1-2 hours

**Total**: 6-9 hours

## Next Steps

1. Review and approve this plan
2. Create database migration
3. Update CMS interfaces and forms
4. Update portfolio website UI
5. Test with sample project
6. Deploy to production

---

**Status**: 📋 Planning Complete - Ready for Implementation  
**Risk Level**: 🟢 Low (Non-breaking changes)  
**Complexity**: 🟡 Medium  
**Priority**: 🔴 High (Management Request)
