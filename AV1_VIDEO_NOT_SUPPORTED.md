# AV1 Video Format Not Supported

## Problem

When trying to generate a thumbnail clip from an AV1-encoded video (typically `.webm` files), the process fails with a 0-byte output file. This is because **FFmpeg.wasm cannot decode AV1 videos** in the browser environment.

### Error Symptoms
- Video uploads successfully but creates 0-byte thumbnail clip
- FFmpeg console shows errors like:
  - "Missing Sequence Header"
  - "Failed to get pixel format"
- Generated file doesn't play in browsers (but may play in VLC which has better codec support)

## Root Cause

FFmpeg.wasm (the browser version of FFmpeg) has limited codec support compared to desktop FFmpeg. The AV1 codec decoder is not included in the WebAssembly build, making it impossible to process AV1 videos client-side.

## Solutions

### Option 1: Upload Pre-Converted Thumbnail (Recommended)
1. Convert your video to H.264/MP4 format using desktop tools
2. Trim the desired thumbnail clip (5-15 seconds recommended)
3. Use the **"Upload Custom Thumbnail Video"** option in the CMS
4. This bypasses FFmpeg.wasm entirely and gives you full control over quality

### Option 2: Convert Source Video
1. Convert your main project video to H.264/MP4 format
2. Re-upload it to the CMS
3. Then use the timeline tool to generate thumbnail clips

### Conversion Tools

**HandBrake (Free, GUI)**
- Download: https://handbrake.fr/
- Preset: "Fast 1080p30" or "Web > Gmail Large 3 Minutes 720p30"
- Video Codec: H.264 (x264)
- Container: MP4

**FFmpeg Desktop (Free, Command Line)**
```bash
ffmpeg -i input.webm -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k output.mp4
```

**Online Converters**
- CloudConvert: https://cloudconvert.com/webm-to-mp4
- FreeConvert: https://www.freeconvert.com/webm-to-mp4

## Detection & Prevention

The CMS now automatically detects AV1 videos and:
- Shows a warning banner explaining the limitation
- Disables the "Set as Thumbnail" button for timeline-generated clips
- Provides clear error messages if you try to process AV1 videos
- Suggests using the "Upload Custom Thumbnail Video" option instead

### How Detection Works
The system checks if the video URL contains:
- `.webm` file extension (most AV1 videos use WebM container)
- `av1` in the filename or path

## Technical Details

### Why AV1 Doesn't Work
1. FFmpeg.wasm is compiled without AV1 decoder support
2. AV1 decoding requires significant computational resources
3. The WebAssembly build prioritizes size and compatibility over codec coverage
4. Desktop FFmpeg has AV1 support, but browser version does not

### What Happens When You Try
1. FFmpeg attempts to read the AV1 stream
2. Fails to find sequence header (AV1-specific metadata)
3. Cannot determine pixel format without decoder
4. Creates empty output file (0 bytes)
5. Browser cannot play the corrupted file

## Recommended Workflow

For best results with video thumbnails:

1. **Source Video**: Upload H.264/MP4 format to CMS
2. **Thumbnail Clips**: 
   - Use timeline tool to select range
   - Generate clip automatically (5-15 seconds)
   - Or upload pre-trimmed H.264/MP4 clip

3. **Video Specs for Web**:
   - Codec: H.264 (libx264)
   - Container: MP4
   - Resolution: 1920x1080 or 1280x720
   - Frame Rate: 30fps or 24fps
   - Bitrate: 5-10 Mbps for full video, 2-5 Mbps for thumbnails

## Future Improvements

Potential solutions for future versions:
- Server-side video processing (requires backend infrastructure)
- Different FFmpeg.wasm build with AV1 support (larger file size)
- Automatic video conversion on upload (requires processing time)
- Integration with cloud video processing services

## Related Files

- `final_cms/src/components/projects/VideoChapterMarker.tsx` - AV1 detection logic
- `final_cms/VIDEO_THUMBNAIL_FIRST_FRAME_FIX.md` - Keyframe fix for H.264 videos
- `final_cms/FIX_VIDEO_416_RANGE_ERROR.md` - CORS configuration for video playback

## Support

If you encounter this issue:
1. Check the video format (right-click > Properties > Details)
2. Convert to H.264/MP4 using tools above
3. Use "Upload Custom Thumbnail Video" option
4. Contact support if conversion doesn't resolve the issue
