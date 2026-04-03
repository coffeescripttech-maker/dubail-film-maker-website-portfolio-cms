# Video Chapters/Moments Feature

## Overview
The Video Chapters feature allows you to mark important moments in your videos with timestamps and labels, similar to Vimeo's chapter markers. This helps viewers navigate to key scenes quickly.

## How It Works

### 1. Video Preview Player
When you upload or have a video in the project form, a video preview player appears in the "Video Chapters" section. This player allows you to:
- Watch your video
- Pause at important moments
- Capture timestamps with one click

### 2. Marking Moments (Easy Way)
1. Play the video in the preview player
2. Pause at an important moment (e.g., when the intro starts)
3. Click the **"⭐ Mark This Moment"** button
4. The current timestamp is automatically captured
5. Add a descriptive label (e.g., "Intro", "Key scene", "Action sequence")

### 3. Manual Entry (Alternative Way)
You can also manually add chapters by:
1. Click **"Add Chapter"** button
2. Type the timestamp manually (format: 0:15 or 1:02:30)
3. Add a label

### 4. Preview Your Chapters
- Each chapter shows a ▶️ play button
- Click it to jump to that moment in the video
- Verify your timestamps are correct before submitting

### 5. Chapter Preview
Before submitting, you'll see a sorted preview of all your chapters:
```
⭐ Preview Chapters (3)
0:15 → Intro
1:02 → Important scene
2:30 → Key dialogue
```

## User Interface

### Video Preview Section
```
🎬 Video Preview - Click to mark moments     [⭐ Mark This Moment]
┌─────────────────────────────────────────┐
│                                         │
│         Video Player                    │
│         (with controls)                 │
│                                         │
└─────────────────────────────────────────┘
💡 Tip: Play the video, pause at an important moment, then click "Mark This Moment"
```

### Chapter List
```
[0:15    ] [Intro                          ] [▶️] [⭐] [🗑️]
[1:02    ] [Important scene                ] [▶️] [⭐] [🗑️]
[2:30    ] [Key dialogue                   ] [▶️] [⭐] [🗑️]
```

- **Timestamp field**: Shows captured time or manual entry
- **Label field**: Describe what happens at this moment
- **▶️ button**: Jump to this moment in the video player
- **⭐ icon**: Indicates a complete, valid chapter
- **🗑️ button**: Remove this chapter

## Timestamp Format

### Supported Formats:
- `0:15` - 15 seconds
- `1:02` - 1 minute 2 seconds
- `1:02:30` - 1 hour 2 minutes 30 seconds

### Validation:
- Timestamps are validated in real-time
- Invalid formats show a red border and error message
- Only valid chapters are saved when you submit

## Workflow Example

### Scenario: Marking a 5-minute commercial

1. **Upload Video**
   - Upload your 5-minute commercial video
   - Video preview player appears

2. **Mark Opening Scene**
   - Play video
   - Pause at 0:15 when logo appears
   - Click "Mark This Moment"
   - Add label: "Brand Logo Reveal"

3. **Mark Product Showcase**
   - Continue playing
   - Pause at 1:02 when product appears
   - Click "Mark This Moment"
   - Add label: "Product Introduction"

4. **Mark Call to Action**
   - Continue playing
   - Pause at 4:40 near the end
   - Click "Mark This Moment"
   - Add label: "Call to Action"

5. **Review Chapters**
   - See preview: 3 chapters marked
   - Click ▶️ on each to verify timestamps
   - Adjust labels if needed

6. **Submit Project**
   - Chapters are saved with the project
   - Ready for use on the website

## Features

### ✅ Automatic Timestamp Capture
- No need to manually type timestamps
- Captures exact moment from video player
- Formats timestamp automatically

### ✅ Visual Feedback
- ⭐ icon shows complete chapters
- Green checkmarks for valid entries
- Red borders for invalid timestamps
- Orange borders for incomplete entries

### ✅ Jump to Moment
- Click ▶️ to preview any chapter
- Video scrolls into view and plays from that moment
- Verify your timestamps are accurate

### ✅ Sorted Preview
- Chapters automatically sorted by timestamp
- See chronological order before submitting
- Easy to spot gaps or duplicates

### ✅ Validation
- Real-time timestamp format validation
- Prevents invalid data from being saved
- Clear error messages

## Database Storage

Chapters are stored as JSON in the database:
```json
[
  { "timestamp": "0:15", "label": "Intro" },
  { "timestamp": "1:02", "label": "Important scene" },
  { "timestamp": "2:30", "label": "Key dialogue" }
]
```

## API Integration

### Creating Project with Chapters
```javascript
POST /api/projects
{
  "title": "My Project",
  "video_url": "https://...",
  "chapters": [
    { "timestamp": "0:15", "label": "Intro" },
    { "timestamp": "1:02", "label": "Key scene" }
  ]
}
```

### Updating Project Chapters
```javascript
PUT /api/projects/:id
{
  "chapters": [
    { "timestamp": "0:15", "label": "Updated Intro" },
    { "timestamp": "1:02", "label": "Key scene" },
    { "timestamp": "2:30", "label": "New chapter" }
  ]
}
```

## Migration

Run the migration to add the chapters column:
```bash
cd final_cms/database/migrations
./apply-video-chapters-migration.bat
```

This adds the `chapters` TEXT column to the projects table.

## Tips for Best Results

### 1. Watch First, Mark Later
- Watch the entire video once
- Note important moments mentally
- Then go back and mark them precisely

### 2. Use Descriptive Labels
- ✅ Good: "Product reveal", "Customer testimonial", "Call to action"
- ❌ Bad: "Scene 1", "Part 2", "Moment"

### 3. Don't Over-Mark
- Mark only truly important moments
- 3-5 chapters for a 5-minute video is ideal
- Too many chapters can be overwhelming

### 4. Verify Before Submitting
- Use the ▶️ button to preview each chapter
- Make sure timestamps are accurate
- Check labels are descriptive

### 5. Chronological Order
- Chapters are auto-sorted by timestamp
- No need to add them in order
- Preview shows final sorted order

## Future Enhancements (Optional)

- Export chapters as SRT/VTT subtitle files
- Import chapters from existing subtitle files
- Thumbnail preview for each chapter
- Chapter navigation on the public website
- Analytics: which chapters are most viewed

## Troubleshooting

### Video player not showing?
- Make sure video_url is set
- Check video file is accessible
- Try refreshing the page

### "Mark This Moment" not working?
- Make sure video is loaded
- Try playing the video first
- Check browser console for errors

### Timestamp validation failing?
- Use format: 0:15 or 1:02:30
- Don't use spaces
- Seconds must be 00-59

### Chapters not saving?
- Check all chapters have both timestamp and label
- Verify timestamps are valid format
- Look for validation errors before submitting
