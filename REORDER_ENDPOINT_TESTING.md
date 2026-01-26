# Testing the Reorder Endpoint

## Endpoint Details

**URL**: `PUT /api/projects/reorder`

**Authentication**: Required (NextAuth session)

**Request Body**:
```json
{
  "updates": [
    { "projectId": "project-id-1", "orderIndex": 10 },
    { "projectId": "project-id-2", "orderIndex": 20 },
    { "projectId": "project-id-3", "orderIndex": 30 }
  ]
}
```

**Success Response** (200):
```json
{
  "success": true,
  "projects": [
    { "id": "project-id-1", "title": "Film A", "order_index": 10, ... },
    { "id": "project-id-2", "title": "Film B", "order_index": 20, ... },
    { "id": "project-id-3", "title": "Film C", "order_index": 30, ... }
  ],
  "count": 3
}
```

## Manual Testing with Browser

1. **Start the development server**:
   ```bash
   cd final_cms
   npm run dev
   ```

2. **Sign in to the CMS**:
   - Navigate to http://localhost:3000/signin
   - Sign in with your credentials

3. **Open Browser DevTools**:
   - Press F12 to open DevTools
   - Go to the Console tab

4. **Get existing project IDs**:
   ```javascript
   // Fetch all projects
   fetch('/api/projects')
     .then(r => r.json())
     .then(data => {
       console.log('Projects:', data.projects);
       // Note down some project IDs
     });
   ```

5. **Test the reorder endpoint**:
   ```javascript
   // Replace with actual project IDs from step 4
   fetch('/api/projects/reorder', {
     method: 'PUT',
     headers: {
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({
       updates: [
         { projectId: 'your-project-id-1', orderIndex: 10 },
         { projectId: 'your-project-id-2', orderIndex: 5 },
         { projectId: 'your-project-id-3', orderIndex: 15 }
       ]
     })
   })
   .then(r => r.json())
   .then(data => console.log('Reorder result:', data));
   ```

6. **Verify the order changed**:
   ```javascript
   fetch('/api/projects')
     .then(r => r.json())
     .then(data => {
       console.log('Updated projects:', data.projects);
       // Check that order_index values match what you set
     });
   ```

## Testing Error Cases

### Test 1: Non-existent Project ID
```javascript
fetch('/api/projects/reorder', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    updates: [
      { projectId: 'non-existent-id-12345', orderIndex: 10 }
    ]
  })
})
.then(r => r.json())
.then(data => console.log('Expected 404:', data));
// Expected: { error: "Projects not found: non-existent-id-12345" }
```

### Test 2: Duplicate Project IDs
```javascript
fetch('/api/projects/reorder', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    updates: [
      { projectId: 'same-id', orderIndex: 10 },
      { projectId: 'same-id', orderIndex: 20 }
    ]
  })
})
.then(r => r.json())
.then(data => console.log('Expected 400:', data));
// Expected: { error: "Duplicate project IDs found in updates array" }
```

### Test 3: Empty Updates Array
```javascript
fetch('/api/projects/reorder', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    updates: []
  })
})
.then(r => r.json())
.then(data => console.log('Expected 400:', data));
// Expected: { error: "Updates array cannot be empty" }
```

### Test 4: Missing orderIndex
```javascript
fetch('/api/projects/reorder', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    updates: [
      { projectId: 'some-id' }
    ]
  })
})
.then(r => r.json())
.then(data => console.log('Expected 400:', data));
// Expected: { error: "Each update must have a valid orderIndex (number)" }
```

## Implementation Details

### Validation Checks
1. ✅ Validates updates array exists and is an array
2. ✅ Validates updates array is not empty
3. ✅ Validates each update has a valid projectId (string)
4. ✅ Validates each update has a valid orderIndex (number)
5. ✅ Checks for duplicate project IDs
6. ✅ Validates all project IDs exist in database before updating

### Database Operations
1. Queries database to verify all project IDs exist
2. Performs batch update of order_index values
3. Returns updated projects sorted by order_index

### Requirements Validated
- **Requirement 4.4**: Batch update order_index values in database ✅
- **Requirement 4.6**: Save all order changes to database ✅

## Next Steps

After manual testing confirms the endpoint works:
1. Integrate with DraggableProjectTable component (Task 13)
2. Add UI for reorder mode toggle
3. Implement drag-and-drop functionality
4. Connect drag-and-drop to this API endpoint
