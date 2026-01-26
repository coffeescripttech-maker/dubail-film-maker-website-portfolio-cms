# PortfolioPreview Component Implementation

## Overview

The PortfolioPreview component provides a real-time preview of how film arrangements and thumbnails will appear on the portfolio website. It allows content managers to visualize changes before publishing, with support for desktop, tablet, and mobile views.

## Component Location

```
final_cms/src/components/projects/PortfolioPreview.tsx
```

## Features Implemented

### ✅ Requirements Coverage

- **Requirement 8.1**: Preview button opens modal with portfolio layout
- **Requirement 8.2**: Modal displays portfolio website layout
- **Requirement 8.3**: Films shown with current thumbnails and order
- **Requirement 8.4**: View mode toggle (desktop/tablet/mobile)
- **Requirement 8.5**: State preservation when closing preview

### Core Functionality

1. **Modal Interface**
   - Full-screen overlay with backdrop blur
   - Smooth open/close animations
   - Click outside or press Escape to close
   - Prevents body scroll when open

2. **View Mode Switching**
   - **Desktop**: Full responsive layout (100% width)
   - **Tablet**: 768px × 1024px viewport
   - **Mobile**: 375px × 667px viewport
   - Visual device icons for each mode
   - Smooth transitions between modes

3. **Project Display**
   - Grid layout adapts to view mode:
     - Desktop: 1-4 columns (responsive)
     - Tablet: 2 columns
     - Mobile: 1 column
   - Projects sorted by `order_index`
   - Only published projects shown
   - Thumbnail priority: `thumbnail_url` → `poster_image` → placeholder

4. **Project Cards**
   - 16:9 aspect ratio maintained
   - Hover effects with project info overlay
   - Featured badge for featured projects
   - Order index badge for debugging
   - Smooth scale animation on hover

5. **State Preservation**
   - Component is read-only (no data modification)
   - Closing modal returns to edit interface
   - All unsaved changes preserved

## Component Props

```typescript
interface PortfolioPreviewProps {
  projects: Project[];  // Array of projects to preview
  onClose: () => void;  // Callback when modal closes
}
```

## Usage Example

```tsx
import PortfolioPreview from "@/components/projects/PortfolioPreview";
import { Project } from "@/lib/db";

function ProjectManagement() {
  const [showPreview, setShowPreview] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  return (
    <>
      <button onClick={() => setShowPreview(true)}>
        Preview Portfolio
      </button>

      {showPreview && (
        <PortfolioPreview
          projects={projects}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
}
```

## Integration Points

### 1. ProjectManagement Component

Add preview button to the header:

```tsx
<div className="flex gap-2">
  <button
    onClick={() => setShowPreview(true)}
    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
  >
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
    Preview Portfolio
  </button>
  {/* Other buttons */}
</div>
```

### 2. State Management

```tsx
const [showPreview, setShowPreview] = useState(false);

// Pass current projects state to preview
{showPreview && (
  <PortfolioPreview
    projects={projects}
    onClose={() => setShowPreview(false)}
  />
)}
```

## Styling Details

### Responsive Grid

```css
/* Desktop: 1-4 columns based on screen size */
grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4

/* Tablet: 2 columns */
grid-cols-2

/* Mobile: 1 column */
grid-cols-1
```

### View Mode Dimensions

- **Mobile**: 375px × 667px (iPhone SE/8)
- **Tablet**: 768px × 1024px (iPad)
- **Desktop**: 100% width, full height

### Animations

- Modal fade in/out: 200ms
- Scale transform: 200ms
- Hover scale: smooth transition
- Overlay opacity: smooth transition

## Accessibility Features

1. **Keyboard Navigation**
   - Escape key closes modal
   - Focus trap within modal
   - Tab navigation through controls

2. **ARIA Labels**
   - View mode buttons have titles
   - Close button has title
   - Semantic HTML structure

3. **Visual Feedback**
   - Active view mode highlighted
   - Hover states on interactive elements
   - Loading states (if needed)

## Testing

### Test File

```
final_cms/test-portfolio-preview.tsx
```

### Test Scenarios

1. **Modal Behavior**
   - ✓ Opens on button click
   - ✓ Closes on X button
   - ✓ Closes on Close button
   - ✓ Closes on Escape key
   - ✓ Closes on backdrop click
   - ✓ Prevents body scroll

2. **View Modes**
   - ✓ Desktop view shows responsive grid
   - ✓ Tablet view shows 2-column grid
   - ✓ Mobile view shows 1-column grid
   - ✓ Smooth transitions between modes

3. **Project Display**
   - ✓ Projects sorted by order_index
   - ✓ Only published projects shown
   - ✓ Thumbnails display correctly
   - ✓ Fallback to poster_image works
   - ✓ Placeholder shown when no image
   - ✓ Featured badge appears
   - ✓ Order index badge appears

4. **State Preservation**
   - ✓ No data modification
   - ✓ Closing preserves edit state
   - ✓ Re-opening shows current state

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Considerations

1. **Image Loading**
   - Uses native `<img>` tags
   - Browser handles lazy loading
   - Aspect ratio prevents layout shift

2. **Rendering**
   - Only published projects rendered
   - Efficient grid layout
   - Smooth animations with CSS transforms

3. **Memory**
   - Modal unmounts on close
   - No memory leaks
   - Event listeners cleaned up

## Future Enhancements

1. **Additional View Modes**
   - Large desktop (1920px+)
   - Small mobile (320px)
   - Custom viewport sizes

2. **Interactive Features**
   - Click to play video preview
   - Drag to reorder in preview
   - Filter by category in preview

3. **Export Options**
   - Screenshot preview
   - Share preview link
   - PDF export

4. **Performance**
   - Virtual scrolling for large lists
   - Image optimization
   - Progressive loading

## Troubleshooting

### Modal Not Opening

Check that:
- State is properly managed
- Component is imported correctly
- No z-index conflicts

### Images Not Displaying

Verify:
- Thumbnail URLs are valid
- CORS is configured for R2
- Fallback logic is working

### Layout Issues

Ensure:
- Tailwind CSS is properly configured
- Dark mode classes are supported
- Responsive breakpoints are correct

## Related Components

- `ProjectManagement.tsx` - Parent component
- `DraggableProjectTable.tsx` - Reordering interface
- `ThumbnailManager.tsx` - Thumbnail management
- `PresetManager.tsx` - Preset management

## API Dependencies

None - This is a pure UI component that receives data via props.

## Design Decisions

1. **Read-Only Preview**
   - No editing in preview mode
   - Keeps preview simple and focused
   - Prevents accidental changes

2. **Published Projects Only**
   - Matches actual portfolio behavior
   - Provides accurate preview
   - Filters draft content

3. **Order Index Badge**
   - Helps debug ordering issues
   - Can be removed in production
   - Useful during development

4. **Responsive Grid**
   - Matches portfolio website layout
   - Adapts to view mode
   - Provides realistic preview

## Conclusion

The PortfolioPreview component successfully implements all requirements (8.1-8.5) and provides a comprehensive preview experience for content managers. It integrates seamlessly with the existing project management system and maintains state preservation as required.
