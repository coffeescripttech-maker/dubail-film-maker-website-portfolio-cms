# DraggableProjectTable Component Implementation

## Overview

The `DraggableProjectTable` component extends the existing `ProjectTable` component with drag-and-drop reordering functionality. It allows content managers to visually reorder films by dragging rows to new positions, with all changes persisted to the database.

## Implementation Details

### Technology Stack

- **@dnd-kit/core**: Core drag-and-drop functionality
- **@dnd-kit/sortable**: Sortable list utilities
- **@dnd-kit/utilities**: CSS transform utilities
- **React**: Component framework
- **TypeScript**: Type safety

### Key Features

1. **Reorder Mode Toggle**
   - Button to enable/disable reorder mode
   - Visual feedback when mode is active
   - Disables other actions during reordering

2. **Drag-and-Drop**
   - Smooth drag interactions with pointer and keyboard sensors
   - Visual indicators during drag (cursor changes, opacity)
   - DragOverlay shows dragged item preview
   - Activation constraint prevents accidental drags

3. **Order Calculation**
   - Uses `arrayMove` to reorder items locally
   - Calculates new order indices based on position
   - Batch updates all affected projects

4. **API Integration**
   - Calls `/api/projects/reorder` endpoint
   - Sends array of `{projectId, orderIndex}` updates
   - Shows loading state during save
   - Handles success/error responses with toast notifications

5. **State Management**
   - Local state for immediate UI updates
   - Reverts to original order on error or cancel
   - Syncs with parent component props

## Component Props

```typescript
interface DraggableProjectTableProps {
  projects: Project[];              // Array of projects to display
  loading: boolean;                 // Loading state
  onEdit: (project: Project) => void;       // Edit handler
  onDelete: (projectId: string) => void;    // Delete handler
  selectedProjects?: string[];      // Selected project IDs
  onSelectionChange?: (selectedIds: string[]) => void;  // Selection handler
  reorderMode: boolean;             // Reorder mode state
  onReorderModeChange: (enabled: boolean) => void;  // Reorder mode toggle
}
```

## Usage Example

```tsx
import DraggableProjectTable from '@/components/projects/DraggableProjectTable';

function ProjectManagement() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [reorderMode, setReorderMode] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  return (
    <DraggableProjectTable
      projects={projects}
      loading={false}
      onEdit={handleEdit}
      onDelete={handleDelete}
      selectedProjects={selectedProjects}
      onSelectionChange={setSelectedProjects}
      reorderMode={reorderMode}
      onReorderModeChange={setReorderMode}
    />
  );
}
```

## Integration with ProjectManagement

To integrate this component into the existing `ProjectManagement` component:

1. Import the component:
```tsx
import DraggableProjectTable from '@/components/projects/DraggableProjectTable';
```

2. Add reorder mode state:
```tsx
const [reorderMode, setReorderMode] = useState(false);
```

3. Replace `ProjectTable` with `DraggableProjectTable`:
```tsx
<DraggableProjectTable
  projects={projects}
  loading={loading}
  onEdit={handleEditProject}
  onDelete={handleDeleteProject}
  selectedProjects={selectedProjects}
  onSelectionChange={setSelectedProjects}
  reorderMode={reorderMode}
  onReorderModeChange={setReorderMode}
/>
```

## User Experience Flow

1. **Enable Reorder Mode**
   - User clicks "Enable Reorder Mode" button
   - Table rows become draggable (cursor changes to move)
   - Edit/Delete buttons are disabled
   - Checkboxes are disabled
   - "Save Order" and "Cancel" buttons appear

2. **Drag and Drop**
   - User clicks and drags a project row
   - Row becomes semi-transparent (opacity: 0.5)
   - DragOverlay shows preview of dragged item
   - Other rows shift to make space
   - User drops row in new position

3. **Save Changes**
   - User clicks "Save Order" button
   - Loading spinner appears
   - API call updates all order indices
   - Success toast notification
   - Reorder mode exits automatically

4. **Cancel Changes**
   - User clicks "Cancel" button
   - Local changes are reverted
   - Original order is restored
   - Reorder mode exits

## Requirements Validation

### Requirement 4.1: Film Order Display
✓ Films are displayed in their current order based on `order_index` values

### Requirement 4.2: Reorder Mode
✓ "Enable Reorder Mode" toggle button makes rows draggable

### Requirement 4.3: Visual Indicators
✓ Cursor changes to move icon during reorder mode
✓ Dragged row becomes semi-transparent
✓ DragOverlay shows preview of dragged item
✓ Smooth animations during drag

### Requirement 4.4: Order Updates
✓ Calculates new order indices on drop
✓ Batch updates via `/api/projects/reorder` endpoint
✓ Sends array of `{projectId, orderIndex}` updates

### Requirement 4.6: Save Changes
✓ "Save Order" button persists changes to database
✓ Loading state shown during save
✓ Success/error notifications
✓ Exits reorder mode after successful save

## Error Handling

1. **API Errors**
   - Shows error toast with message
   - Reverts to original order
   - Logs error to console

2. **Network Errors**
   - Shows generic error toast
   - Reverts to original order
   - Allows retry

3. **Validation Errors**
   - Handled by API endpoint
   - Shows specific error message

## Accessibility

- **Keyboard Support**: Uses KeyboardSensor for keyboard navigation
- **Focus Management**: Maintains focus during drag operations
- **Screen Readers**: Buttons have descriptive labels
- **Visual Feedback**: Clear visual indicators for all states

## Performance Considerations

- **Local State**: Immediate UI updates for smooth UX
- **Batch Updates**: Single API call for all changes
- **Optimistic Updates**: Shows changes before API confirmation
- **Revert on Error**: Restores original state if save fails

## Testing

See `test-draggable-table.tsx` for manual testing examples.

### Test Scenarios

1. **Enable/Disable Reorder Mode**
   - Toggle button works correctly
   - UI updates appropriately

2. **Drag and Drop**
   - Rows can be dragged to new positions
   - Visual feedback is correct
   - Order updates locally

3. **Save Order**
   - API call is made with correct data
   - Success notification appears
   - Mode exits automatically

4. **Cancel Changes**
   - Original order is restored
   - Mode exits without saving

5. **Error Handling**
   - API errors show error toast
   - Order reverts on error
   - User can retry

## Future Enhancements

1. **Undo/Redo**: Add undo/redo functionality for order changes
2. **Preset Integration**: Save/load order presets
3. **Multi-Select Drag**: Drag multiple selected items at once
4. **Touch Support**: Optimize for touch devices
5. **Animation Improvements**: Add more sophisticated animations

## Dependencies

```json
{
  "@dnd-kit/core": "^6.x",
  "@dnd-kit/sortable": "^8.x",
  "@dnd-kit/utilities": "^3.x"
}
```

## Files Modified/Created

- ✅ Created: `src/components/projects/DraggableProjectTable.tsx`
- ✅ Created: `test-draggable-table.tsx`
- ✅ Created: `DRAGGABLE_PROJECT_TABLE_IMPLEMENTATION.md`
- 📝 To Update: `src/components/projects/ProjectManagement.tsx` (integration)

## Status

✅ **Task 13.1 Complete**: DraggableProjectTable component fully implemented with all required features.

## Next Steps

1. Integrate component into ProjectManagement (Task 18.1)
2. Add property-based tests (Tasks 13.2, 13.3)
3. Test end-to-end reordering flow
4. Add preset management integration
