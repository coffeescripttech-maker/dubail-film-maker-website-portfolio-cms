# Arabic/English Video Feature - Implementation Steps

## ✅ Phase 1: Database Schema (COMPLETE)

### Files Created:
1. ✅ `database/migrations/006-add-arabic-video-fields.sql`
2. ✅ `database/migrations/006-add-arabic-video-fields-rollback.sql`
3. ✅ `src/lib/db.ts` - Arabic fields already added to Project interface

### Next Step: Run Migration
```bash
# Local database
wrangler d1 execute portfolio-cms-db --local --file=./database/migrations/006-add-arabic-video-fields.sql

# Remote database (production)
wrangler d1 execute portfolio-cms-db --remote --file=./database/migrations/006-add-arabic-video-fields.sql
```

---

## 📝 Phase 2: CMS Updates (IN PROGRESS)

### 2.1 Update ProjectForm Component
**File**: `src/components/projects/ProjectForm.tsx`

**Changes Needed**:
1. Add Arabic video fields to formData state:
```typescript
const [formData, setFormData] = useState({
  // ... existing fields
  video_url_arabic: '',
  video_url_full_arabic: '',
  video_thumbnail_url_arabic: '',
});
```

2. Update useEffect to load Arabic fields from project:
```typescript
useEffect(() => {
  if (project) {
    setFormData({
      // ... existing fields
      video_url_arabic: project.video_url_arabic || '',
      video_url_full_arabic: project.video_url_full_arabic || '',
      video_thumbnail_url_arabic: project.video_thumbnail_url_arabic || '',
    });
  }
}, [project]);
```

3. Add Arabic video upload section in the "Media" tab (after English videos):
```tsx
{/* Arabic Version Section */}
<div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
  <div className="flex items-center gap-2">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
      Arabic Version (Optional)
    </h3>
    <span className="text-xs text-gray-500 dark:text-gray-400">
      العربية
    </span>
  </div>
  
  <p className="text-sm text-gray-600 dark:text-gray-400">
    Upload Arabic language versions of your videos. The language toggle will appear on the project detail page if Arabic videos are provided.
  </p>

  <FileUpload
    label="Video File (Arabic) - عربي"
    accept="video/*"
    value={formData.video_url_arabic}
    onChange={(url) => handleFieldChange('video_url_arabic', url)}
    folder="projects/videos"
    type="video"
  />

  <FileUpload
    label="Full Video (Arabic) - فيديو كامل"
    accept="video/*"
    value={formData.video_url_full_arabic}
    onChange={(url) => handleFieldChange('video_url_full_arabic', url)}
    folder="projects/videos"
    type="video"
  />

  <FileUpload
    label="Thumbnail Clip (Arabic) - مقطع مصغر"
    accept="video/*"
    value={formData.video_thumbnail_url_arabic}
    onChange={(url) => handleFieldChange('video_url_thumbnail_arabic', url)}
    folder="projects/videos"
    type="video"
  />
</div>
```

### 2.2 Update API Routes
**Files**: 
- `src/app/api/projects/route.ts` (POST/PUT)
- `src/app/api/public/projects/route.ts` (GET)

**Changes**: Include Arabic video fields in database operations

---

## 🌐 Phase 3: Portfolio Website Updates (PENDING)

### 3.1 Update Project Detail Page
**File**: `final_portfolio_website/works/project-detail.html`

**Add Language Toggle UI** (after project title):
```html
<!-- Language Toggle Button -->
<div class="language-toggle" id="language-toggle" style="display: none;">
  <button class="btn-language active" data-lang="en">English</button>
  <button class="btn-language" data-lang="ar">العربية</button>
</div>
```

**Add JavaScript Logic**:
```javascript
let currentProject = null;
let currentLanguage = 'en';

function renderProjectDetail(project) {
  currentProject = project;
  
  // Show language toggle if Arabic version exists
  const languageToggle = document.getElementById('language-toggle');
  const hasArabicVersion = project.video_url_full_arabic || project.video_url_arabic;
  
  if (hasArabicVersion) {
    languageToggle.style.display = 'flex';
    setupLanguageToggle();
  }
  
  loadVideoForLanguage('en');
}

function setupLanguageToggle() {
  const buttons = document.querySelectorAll('.btn-language');
  buttons.forEach(btn => {
    btn.addEventListener('click', function() {
      switchLanguage(this.dataset.lang);
    });
  });
}

function switchLanguage(lang) {
  currentLanguage = lang;
  
  // Update button states
  document.querySelectorAll('.btn-language').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
  
  loadVideoForLanguage(lang);
}

function loadVideoForLanguage(lang) {
  const videoElement = document.getElementById('project-video');
  const currentTime = videoElement.currentTime;
  const wasPaused = videoElement.paused;
  
  let videoUrl;
  if (lang === 'ar') {
    videoUrl = currentProject.video_url_full_arabic || 
               currentProject.video_url_arabic || 
               currentProject.video_url_full || 
               currentProject.video_url;
  } else {
    videoUrl = currentProject.video_url_full || currentProject.video_url;
  }
  
  videoElement.src = videoUrl;
  
  videoElement.addEventListener('loadedmetadata', function() {
    if (currentTime > 0 && currentTime < videoElement.duration) {
      videoElement.currentTime = currentTime;
    }
    if (!wasPaused) {
      videoElement.play().catch(err => console.log('Autoplay prevented'));
    }
  }, { once: true });
}
```

### 3.2 Add CSS Styling
**File**: Create `final_portfolio_website/assets/css/language-toggle.css`

```css
.language-toggle {
  display: flex;
  gap: 0.5rem;
  margin: 1rem 0;
  align-items: center;
}

.btn-language {
  padding: 0.5rem 1rem;
  border: 1px solid currentColor;
  background: transparent;
  color: inherit;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.875rem;
  font-family: inherit;
}

.btn-language:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-language.active {
  background: currentColor;
  color: var(--bg-color, #000);
}

/* Dark mode support */
body.template-project .btn-language {
  color: #fff;
}

body.template-project .btn-language.active {
  background: #fff;
  color: #000;
}
```

---

## 📊 Testing Checklist

### Database Testing
- [ ] Run migration on local database
- [ ] Verify columns exist: `SELECT * FROM projects LIMIT 1;`
- [ ] Test inserting Arabic video URLs
- [ ] Test querying projects with Arabic videos

### CMS Testing
- [ ] Create new project with Arabic videos
- [ ] Edit existing project to add Arabic videos
- [ ] Verify Arabic videos save correctly
- [ ] Verify Arabic videos load on edit
- [ ] Test removing Arabic videos

### Portfolio Website Testing
- [ ] Project without Arabic video - toggle hidden ✓
- [ ] Project with Arabic video - toggle visible ✓
- [ ] Switch from English to Arabic - video changes ✓
- [ ] Switch from Arabic to English - video changes ✓
- [ ] Video playback continues from same position ✓
- [ ] Button states update correctly ✓

---

## 🚀 Deployment Steps

### 1. Database Migration
```bash
# Test locally first
wrangler d1 execute portfolio-cms-db --local --file=./database/migrations/006-add-arabic-video-fields.sql

# Deploy to production
wrangler d1 execute portfolio-cms-db --remote --file=./database/migrations/006-add-arabic-video-fields.sql
```

### 2. Deploy CMS
```bash
cd final_cms
npm run build
# Deploy to Vercel/Cloudflare Pages
```

### 3. Deploy Portfolio Website
```bash
cd final_portfolio_website
# Deploy to hosting (Vercel/Cloudflare Pages)
```

---

## 🔄 Rollback Plan

If issues occur:

### 1. Rollback Database
```bash
wrangler d1 execute portfolio-cms-db --remote --file=./database/migrations/006-add-arabic-video-fields-rollback.sql
```

### 2. Revert Code Changes
```bash
git revert <commit-hash>
```

### 3. Redeploy
Deploy previous working version

---

## 📝 Next Actions

1. ✅ Create migration files
2. ⏳ Run database migration
3. ⏳ Update ProjectForm component
4. ⏳ Update API routes
5. ⏳ Update portfolio website
6. ⏳ Test thoroughly
7. ⏳ Deploy to production

---

**Current Status**: Phase 1 Complete, Phase 2 In Progress  
**Estimated Time Remaining**: 4-6 hours  
**Risk Level**: 🟢 Low (Non-breaking changes)
