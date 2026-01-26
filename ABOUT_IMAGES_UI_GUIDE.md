# About Images UI Guide

## Admin Interface Overview

### Navigation Path
```
Admin Panel → Settings → About Images Tab
```

## UI Components

### 1. Upload Section
```
┌─────────────────────────────────────────────────┐
│ Upload About Images                             │
├─────────────────────────────────────────────────┤
│                                                 │
│ Select Image                                    │
│ [Choose File] No file chosen                    │
│                                                 │
│ ℹ️ Supported formats: JPG, PNG, GIF, WebP      │
│   Max size: 5MB                                 │
│                                                 │
│ [🔄 Uploading...] (when active)                │
└─────────────────────────────────────────────────┘
```

### 2. Images Grid (Empty State)
```
┌─────────────────────────────────────────────────┐
│ Manage Images (0)              Drag to reorder  │
├─────────────────────────────────────────────────┤
│                                                 │
│              🖼️                                 │
│         No images uploaded yet                  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 3. Images Grid (With Images)
```
┌─────────────────────────────────────────────────┐
│ Manage Images (3)              Drag to reorder  │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ #1       │  │ #2       │  │ #3       │     │
│  │          │  │          │  │          │     │
│  │ [Image]  │  │ [Image]  │  │ [Image]  │     │
│  │          │  │          │  │          │     │
│  ├──────────┤  ├──────────┤  ├──────────┤     │
│  │ Alt text │  │ Alt text │  │ Alt text │     │
│  │[Edit Alt]│  │[Edit Alt]│  │[Edit Alt]│     │
│  │[Delete]  │  │[Delete]  │  │[Delete]  │     │
│  └──────────┘  └──────────┘  └──────────┘     │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 4. Edit Mode
```
┌──────────┐
│ #1       │
│          │
│ [Image]  │
│          │
├──────────┤
│ [Alt text input field]                         │
│ [Save] [Cancel]                                │
└──────────┘
```

### 5. Info Panel
```
┌─────────────────────────────────────────────────┐
│ ℹ️ About Images Tips:                           │
│                                                 │
│ • Images are displayed on the About page in    │
│   the order shown                               │
│ • Drag and drop to reorder images              │
│ • Add descriptive alt text for accessibility   │
│ • Recommended aspect ratio: 16:9 for best      │
│   display                                       │
└─────────────────────────────────────────────────┘
```

## User Interactions

### Upload Flow
1. Click "Choose File" button
2. Select image from file system
3. See "Uploading..." indicator
4. Image appears in grid automatically
5. Success toast notification appears

### Reorder Flow
1. Click and hold on any image card
2. Drag to desired position
3. Other images shift to make space
4. Release to drop
5. Order saves automatically
6. Success toast notification appears

### Edit Alt Text Flow
1. Click "Edit Alt" button on image
2. Input field appears with current alt text
3. Type new alt text
4. Click "Save" to confirm or "Cancel" to discard
5. Success toast notification appears

### Delete Flow
1. Click "Delete" button on image
2. Confirmation dialog appears
3. Click "OK" to confirm deletion
4. Image removed from grid
5. Success toast notification appears

## Responsive Behavior

### Desktop (lg: 1024px+)
- 3 columns grid layout
- Full-size preview images
- All controls visible

### Tablet (md: 768px - 1023px)
- 2 columns grid layout
- Medium-size preview images
- All controls visible

### Mobile (< 768px)
- 1 column layout
- Full-width images
- Stacked controls
- Touch-friendly drag and drop

## Visual States

### Normal State
- Border: gray-200 / gray-700
- Background: white / gray-800
- Cursor: move (grab)

### Hover State
- Shadow: lg
- Border: unchanged
- Slight scale effect

### Dragging State
- Opacity: 50%
- Scale: 95%
- Cursor: grabbing

### Uploading State
- Upload button: disabled
- Spinner animation visible
- Blue accent color

## Color Scheme

### Light Mode
- Background: white
- Border: gray-200
- Text: gray-900
- Accent: blue-600
- Success: green-500
- Error: red-600

### Dark Mode
- Background: gray-800
- Border: gray-700
- Text: white
- Accent: blue-400
- Success: green-400
- Error: red-400

## Accessibility Features

1. **Keyboard Navigation**
   - Tab through all interactive elements
   - Enter/Space to activate buttons
   - Escape to cancel edit mode

2. **Screen Reader Support**
   - Alt text for all images
   - ARIA labels on buttons
   - Status announcements for actions

3. **Visual Feedback**
   - Loading indicators
   - Success/error messages
   - Hover states
   - Focus indicators

4. **Color Contrast**
   - WCAG AA compliant
   - High contrast in dark mode
   - Clear visual hierarchy

## Toast Notifications

### Success Messages
- ✅ "Image uploaded successfully"
- ✅ "Alt text updated"
- ✅ "Order updated successfully"
- ✅ "Image deleted successfully"

### Error Messages
- ❌ "Please select an image file"
- ❌ "Image size must be less than 5MB"
- ❌ "Failed to upload image"
- ❌ "Failed to update alt text"
- ❌ "Failed to delete image"

## Performance Optimizations

1. **Lazy Loading**: Images load as they enter viewport
2. **Optimistic Updates**: UI updates before server confirmation
3. **Debounced Reorder**: Prevents excessive API calls during drag
4. **Image Compression**: Automatic optimization on upload
5. **Caching**: Browser caches image URLs

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Tips for Best UX

1. **Upload Quality Images**: Use high-resolution images for professional look
2. **Consistent Sizing**: Keep similar aspect ratios for visual harmony
3. **Meaningful Alt Text**: Helps SEO and accessibility
4. **Logical Order**: Arrange images to tell a story
5. **Regular Updates**: Keep content fresh and relevant
