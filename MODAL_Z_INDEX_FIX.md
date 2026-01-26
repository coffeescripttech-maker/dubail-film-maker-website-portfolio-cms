# Modal Z-Index Fix

## Issue

Modals were appearing behind the header because the header has a very high z-index (`z-99999`) while modals were using `z-50`.

## Root Cause

The AppHeader component uses `z-99999` to ensure it stays on top of all content. However, modals were using the standard `z-50` which is much lower, causing them to appear behind the header.

## Solution

Updated all modal components to use `z-[99999]` to match or exceed the header's z-index, ensuring modals always appear on top of everything including the header.

## Files Fixed

### 1. VideoFrameCapture.tsx
**Before:** `z-50`  
**After:** `z-[99999]`

This modal is used for capturing video frames as thumbnails.

### 2. PortfolioPreview.tsx
**Before:** `z-50`  
**After:** `z-[99999]`

This modal shows a preview of the portfolio with different device views.

### 3. ProjectManagement.tsx (Bulk Reorder Modal)
**Before:** `z-50`  
**After:** `z-[99999]`

This modal allows bulk reordering of projects with number inputs.

### 4. PresetManager.tsx (Save Preset Modal)
**Before:** `z-50`  
**After:** `z-[99999]`

This modal prompts for a preset name when saving arrangements.

## Z-Index Hierarchy

Current z-index values in the application:

```
z-[99999] - Modals (highest priority)
z-99999   - Header (sticky navigation)
z-50      - Other overlays (dropdowns, tooltips)
z-20      - Sticky elements
z-10      - Elevated content
z-1       - Slightly elevated
z-0       - Base layer
```

## Best Practices

### When to Use High Z-Index

Use `z-[99999]` for:
- ✅ Full-screen modals
- ✅ Dialog boxes
- ✅ Confirmation prompts
- ✅ Any overlay that should block all interaction

### When to Use Medium Z-Index

Use `z-50` for:
- ✅ Dropdowns
- ✅ Tooltips
- ✅ Popovers
- ✅ Context menus

### When to Use Low Z-Index

Use `z-10` or `z-20` for:
- ✅ Sticky headers (within content)
- ✅ Floating action buttons
- ✅ Badges
- ✅ Notifications

## Testing

To verify the fix:

1. Open any project for editing
2. Click "Generate from Video" in the thumbnail section
3. The "Capture Video Frame" modal should appear
4. ✅ Modal should be fully visible above the header
5. ✅ Header should not overlap the modal
6. ✅ Background overlay should cover everything including header

Repeat for:
- Portfolio Preview modal
- Bulk Reorder modal
- Save Preset modal

## Future Considerations

### Option 1: Use CSS Variables
Define z-index values as CSS variables for consistency:

```css
:root {
  --z-modal: 99999;
  --z-header: 99999;
  --z-dropdown: 50;
  --z-sticky: 20;
  --z-elevated: 10;
}
```

### Option 2: Tailwind Config
Add custom z-index values to Tailwind config:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      zIndex: {
        'modal': '99999',
        'header': '99999',
        'dropdown': '50',
      }
    }
  }
}
```

Then use: `z-modal`, `z-header`, `z-dropdown`

### Option 3: Lower Header Z-Index
Consider lowering the header z-index to a more reasonable value like `z-50` and use `z-[60]` for modals. This would be more maintainable but requires testing to ensure the header still works correctly.

## Related Issues

This fix resolves:
- ✅ Modals appearing behind header
- ✅ Unable to interact with modal content
- ✅ Visual layering issues
- ✅ Poor user experience with overlapping elements

## Conclusion

All modals now properly appear above the header with `z-[99999]`, ensuring a consistent and functional user experience across the application.
