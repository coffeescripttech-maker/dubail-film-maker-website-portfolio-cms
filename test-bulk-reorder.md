# Bulk Reorder Manual Testing Guide

## Prerequisites
- CMS is running locally
- You are logged in as an admin user
- You have at least 3 projects in the database

## Test Scenarios

### Test 1: Basic Bulk Reorder
**Steps:**
1. Navigate to Project Management page
2. Select 2-3 projects using checkboxes
3. Verify bulk actions bar appears with project count
4. Click "Reorder Selected" button
5. Verify modal opens with selected projects listed
6. Change order index values for the projects
7. Click "Apply Reorder"
8. Verify loading toast appears
9. Verify success toast shows correct count
10. Verify project list refreshes with new order

**Expected Results:**
- ✅ Bulk actions bar shows correct count
- ✅ Modal displays all selected projects
- ✅ Current order indices are pre-populated
- ✅ Loading toast shows during operation
- ✅ Success toast shows: "Successfully reordered N project(s)"
- ✅ Projects appear in new order after refresh

### Test 2: No Selection Error
**Steps:**
1. Navigate to Project Management page
2. Ensure no projects are selected
3. Click "Reorder Selected" button (should not be visible)

**Expected Results:**
- ✅ "Reorder Selected" button only appears when projects are selected

### Test 3: Cancel Modal
**Steps:**
1. Select 2 projects
2. Click "Reorder Selected"
3. Change some order values
4. Click "Cancel"
5. Verify modal closes
6. Verify no changes were made

**Expected Results:**
- ✅ Modal closes without saving
- ✅ Project order remains unchanged
- ✅ Selection is preserved

### Test 4: Large Selection
**Steps:**
1. Select 10+ projects
2. Click "Reorder Selected"
3. Verify modal is scrollable
4. Scroll through all projects
5. Update order values
6. Apply changes

**Expected Results:**
- ✅ Modal has scrollable content area
- ✅ All projects are visible
- ✅ Modal doesn't overflow screen
- ✅ All updates are applied correctly

### Test 5: Input Validation
**Steps:**
1. Select 2 projects
2. Click "Reorder Selected"
3. Try entering negative numbers
4. Try entering non-numeric values
5. Try entering decimal numbers

**Expected Results:**
- ✅ Input field has min="0" attribute
- ✅ Non-numeric values are rejected
- ✅ Only integers are accepted

### Test 6: Dark Mode
**Steps:**
1. Switch to dark mode
2. Select projects
3. Open bulk reorder modal
4. Verify all elements are visible

**Expected Results:**
- ✅ Modal background is dark
- ✅ Text is readable
- ✅ Input fields are styled correctly
- ✅ Buttons are visible

### Test 7: API Error Handling
**Steps:**
1. Select projects
2. Open bulk reorder modal
3. Disconnect network (or use browser dev tools to simulate)
4. Apply reorder
5. Verify error handling

**Expected Results:**
- ✅ Error toast appears
- ✅ Modal remains open
- ✅ User can retry or cancel

### Test 8: Clear Selection
**Steps:**
1. Select multiple projects
2. Click "Clear selection" link
3. Verify selection is cleared
4. Verify bulk actions bar disappears

**Expected Results:**
- ✅ All checkboxes are unchecked
- ✅ Bulk actions bar is hidden
- ✅ Selection state is reset

## UI/UX Checks

### Visual Elements
- [ ] "Reorder Selected" button has list icon
- [ ] Button styling matches design system
- [ ] Modal is centered on screen
- [ ] Modal has proper spacing and padding
- [ ] Project cards in modal are visually distinct
- [ ] Input fields are properly labeled
- [ ] Footer buttons are aligned correctly

### Accessibility
- [ ] Modal can be closed with Escape key (if implemented)
- [ ] Tab navigation works correctly
- [ ] Input fields have proper labels
- [ ] Focus states are visible
- [ ] Screen reader support (if applicable)

### Responsive Design
- [ ] Modal works on tablet size (768px)
- [ ] Modal works on mobile size (375px)
- [ ] Content is scrollable on small screens
- [ ] Buttons don't overflow on mobile

## Integration Tests

### Database Persistence
1. Reorder projects
2. Refresh the page
3. Verify order is maintained

### Portfolio Sync
1. Reorder projects in CMS
2. Navigate to portfolio website
3. Verify films appear in new order

### Concurrent Operations
1. Open CMS in two browser tabs
2. Reorder projects in tab 1
3. Refresh tab 2
4. Verify changes are reflected

## Performance Tests

### Response Time
- Bulk reorder of 5 projects: < 1 second
- Bulk reorder of 20 projects: < 2 seconds
- Modal open time: < 100ms

### UI Responsiveness
- No lag when typing in input fields
- Smooth scrolling in modal
- Instant feedback on button clicks

## Known Limitations

1. No drag-and-drop within modal (future enhancement)
2. No auto-sequence feature (future enhancement)
3. No preview before applying (future enhancement)
4. No undo functionality (future enhancement)

## Troubleshooting

### Modal doesn't open
- Check browser console for errors
- Verify projects are selected
- Check if modal state is being set

### Changes don't persist
- Check network tab for API errors
- Verify database connection
- Check server logs

### Toast notifications don't appear
- Verify sonner is installed
- Check if Toaster component is in layout
- Check browser console for errors

---

**Test Date:** _____________
**Tester:** _____________
**Results:** _____________
