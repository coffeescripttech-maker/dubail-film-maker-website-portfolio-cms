# Film Preset API Implementation

## Overview

This document describes the implementation of the Film Preset API endpoints for the Thumbnail & Film Arrangement Control feature. These endpoints allow content managers to save, retrieve, apply, and delete film arrangement presets.

## Implementation Summary

### Database Functions (d1-client.ts)

Added the following functions to `src/lib/d1-client.ts`:

1. **createFilmPreset** - Creates a new preset with name, description, and order configuration
2. **getAllFilmPresets** - Retrieves all saved presets ordered by creation date
3. **getFilmPresetById** - Retrieves a specific preset by ID
4. **deleteFilmPreset** - Deletes a preset by ID

### API Endpoints

#### 1. POST /api/projects/presets
**Purpose**: Save a new film arrangement preset

**Request Body**:
```json
{
  "name": "My Preset",
  "description": "Optional description",
  "orderConfig": [
    { "projectId": "project-1", "orderIndex": 0 },
    { "projectId": "project-2", "orderIndex": 1 }
  ]
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "preset": {
    "id": "uuid",
    "name": "My Preset",
    "description": "Optional description",
    "order_config": [...],
    "created_at": "2026-01-26T...",
    "updated_at": "2026-01-26T..."
  }
}
```

**Validation**:
- Name is required and must be non-empty string
- orderConfig must be an array with at least one item
- Each orderConfig item must have valid projectId (string) and orderIndex (number)

**Error Responses**:
- 400: Invalid request body or validation failure
- 401: Unauthorized (no session)
- 500: Server error

---

#### 2. GET /api/projects/presets
**Purpose**: List all saved presets

**Response** (200 OK):
```json
{
  "success": true,
  "presets": [
    {
      "id": "uuid",
      "name": "Preset 1",
      "description": "...",
      "order_config": [...],
      "created_at": "2026-01-26T...",
      "updated_at": "2026-01-26T..."
    }
  ],
  "count": 1
}
```

**Error Responses**:
- 401: Unauthorized (no session)
- 500: Server error

---

#### 3. PUT /api/projects/presets/:id/apply
**Purpose**: Apply a saved preset to reorder all films

**Response** (200 OK):
```json
{
  "success": true,
  "preset": {
    "id": "uuid",
    "name": "Preset 1",
    "description": "..."
  },
  "projects": [...],
  "count": 5
}
```

**Error Responses**:
- 400: Preset has no order configuration
- 401: Unauthorized (no session)
- 404: Preset not found OR some projects in preset no longer exist
- 500: Server error

---

#### 4. DELETE /api/projects/presets/:id
**Purpose**: Delete a saved preset

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Preset deleted successfully"
}
```

**Error Responses**:
- 401: Unauthorized (no session)
- 404: Preset not found
- 500: Server error

---

## File Structure

```
final_cms/
├── src/
│   ├── lib/
│   │   └── d1-client.ts (updated with preset functions)
│   └── app/
│       └── api/
│           └── projects/
│               └── presets/
│                   ├── route.ts (POST, GET)
│                   └── [id]/
│                       ├── route.ts (DELETE)
│                       └── apply/
│                           └── route.ts (PUT)
└── test-preset-endpoints.js (test script)
```

## Testing

### Manual Testing

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Use the test script (requires authentication):
   ```bash
   node test-preset-endpoints.js
   ```

### Expected Behavior

1. **Create Preset**: Returns 201 with preset object
2. **List Presets**: Returns 200 with array of presets
3. **Apply Preset**: Returns 200 and updates project order in database
4. **Delete Preset**: Returns 200 and removes preset from database

### Authentication

All endpoints require authentication via NextAuth session. Requests without valid session return 401 Unauthorized.

## Requirements Validation

This implementation satisfies the following requirements:

- **Requirement 7.3**: Save film arrangement as preset with name and configuration
- **Requirement 7.4**: Display all saved presets with names and creation dates
- **Requirement 7.5**: Apply preset to reorder films according to saved configuration

## Database Schema

The `film_presets` table was already created in the database schema:

```sql
CREATE TABLE IF NOT EXISTS film_presets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  order_config TEXT NOT NULL, -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Next Steps

The API endpoints are now ready for integration with the UI components:
- PresetManager component (Task 14.1)
- Integration into ProjectManagement (Task 20.1)

## Notes

- All endpoints use NextAuth for authentication
- Preset order_config is stored as JSON string in database
- Apply endpoint reuses the existing `batchUpdateProjectOrder` function
- Error handling includes specific messages for missing projects
- All endpoints follow the same pattern as existing project endpoints
