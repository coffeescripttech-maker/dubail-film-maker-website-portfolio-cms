"use client";
import React, { useState, useRef, useEffect } from "react";
import { VideoChapter } from "@/lib/db";
import { toast } from "sonner";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

interface VideoChapterMarkerProps {
  videoUrl: string;
  currentThumbnailUrl?: string | null;
  chapters: VideoChapter[];
  onChaptersChange: (chapters: VideoChapter[]) => void;
  projectId?: string;
  onThumbnailClipUpdate?: (url: string) => void;
}

export default function VideoChapterMarker({ videoUrl, currentThumbnailUrl, chapters, onChaptersChange, projectId, onThumbnailClipUpdate }: VideoChapterMarkerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Range selection state
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | 'range' | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartValues, setDragStartValues] = useState({ start: 0, end: 0 });

  // Video event handlers
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  // Load FFmpeg
  useEffect(() => {
    loadFFmpeg();
  }, []);

  const loadFFmpeg = async () => {
    try {
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;

      ffmpeg.on("log", ({ message }) => {
        console.log(message);
      });

      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });

      setFfmpegLoaded(true);
      console.log("✅ FFmpeg loaded successfully");
    } catch (error) {
      console.error("Failed to load FFmpeg:", error);
      toast.error("FFmpeg failed to load");
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const formatTimeSimple = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Timeline interaction handlers
  const getTimeFromPosition = (clientX: number): number => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return (x / rect.width) * duration;
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) return;
    
    const clickedTime = getTimeFromPosition(e.clientX);
    
    if (videoRef.current) {
      videoRef.current.currentTime = clickedTime;
    }
  };

  // Draggable range handlers
  const handleStartDrag = (e: React.MouseEvent, type: 'start' | 'end' | 'range') => {
    e.stopPropagation();
    if (!selectedRange) return;
    
    setIsDragging(type);
    setDragStartX(e.clientX);
    setDragStartValues({ ...selectedRange });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !selectedRange || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragStartX;
    const deltaTime = (deltaX / rect.width) * duration;

    let newStart = selectedRange.start;
    let newEnd = selectedRange.end;

    if (isDragging === 'start') {
      newStart = Math.max(0, Math.min(dragStartValues.start + deltaTime, selectedRange.end - 0.5));
    } else if (isDragging === 'end') {
      newEnd = Math.max(selectedRange.start + 0.5, Math.min(dragStartValues.end + deltaTime, duration));
    } else if (isDragging === 'range') {
      const rangeDuration = selectedRange.end - selectedRange.start;
      newStart = Math.max(0, Math.min(dragStartValues.start + deltaTime, duration - rangeDuration));
      newEnd = newStart + rangeDuration;
    }

    setSelectedRange({ start: newStart, end: newEnd });
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, selectedRange, dragStartX, dragStartValues]);

  // Actions
  const createRangeFromSelection = () => {
    if (!selectedRange) {
      toast.error("No range selected", {
        description: "Please drag the handles on the timeline to select a range"
      });
      return;
    }

    const startTimestamp = formatTimeSimple(selectedRange.start);
    const endTimestamp = formatTimeSimple(selectedRange.end);
    
    onChaptersChange([...chapters, { 
      timestamp: startTimestamp, 
      endTime: endTimestamp,
      label: '',
      type: 'range'
    }]);
    
    toast.success('Range Added!', {
      description: `Clip from ${startTimestamp} to ${endTimestamp} saved.`
    });
  };

  const markCurrentMoment = () => {
    const timestamp = formatTimeSimple(currentTime);
    onChaptersChange([...chapters, { timestamp, label: '', type: 'moment' }]);
    toast.success('Moment Marked!', {
      description: `Timestamp ${timestamp} captured.`
    });
  };

  const setRangeFromCurrent = () => {
    const start = Math.max(0, currentTime - 5);
    const end = Math.min(duration, currentTime + 5);
    setSelectedRange({ start, end });
    toast.info('Range set', {
      description: 'Drag the handles to adjust'
    });
  };

  const exportClip = async (chapter: VideoChapter) => {
    if (!ffmpegLoaded || !ffmpegRef.current) {
      toast.error("FFmpeg not loaded", {
        description: "Please wait for FFmpeg to initialize (check green checkmark below)"
      });
      return;
    }

    if (!chapter.endTime) {
      toast.error("Cannot export", {
        description: "This chapter has no end time"
      });
      return;
    }

    setIsExporting(true);
    const ffmpeg = ffmpegRef.current;

    try {
      // Step 1: Fetch video
      toast.loading("📥 Downloading video file...", { id: "export-clip" });
      const videoData = await fetchFile(videoUrl);
      
      // Step 2: Write to FFmpeg
      toast.loading("📝 Preparing video for processing...", { id: "export-clip" });
      await ffmpeg.writeFile("input.mp4", videoData);

      // Parse timestamps
      const startParts = chapter.timestamp.split(':').map(Number);
      const startSeconds = startParts[0] * 60 + startParts[1];

      const endParts = chapter.endTime.split(':').map(Number);
      const endSeconds = endParts[0] * 60 + endParts[1];

      const clipDuration = endSeconds - startSeconds;

      // Step 3: Process with FFmpeg
      toast.loading(`✂️ Trimming clip (${clipDuration}s)...`, { id: "export-clip" });

      await ffmpeg.exec([
        "-i", "input.mp4",
        "-ss", startSeconds.toString(),
        "-t", clipDuration.toString(),
        "-c", "copy", // Fast copy without re-encoding
        "output.mp4"
      ]);

      // Step 4: Read output
      toast.loading("📦 Preparing download...", { id: "export-clip" });
      const data = await ffmpeg.readFile("output.mp4");
      const blob = new Blob([new Uint8Array(data as unknown as ArrayBuffer)], { type: "video/mp4" });
      const url = URL.createObjectURL(blob);

      // Step 5: Download
      const filename = `${chapter.label || 'clip'}_${chapter.timestamp.replace(':', '-')}-${chapter.endTime.replace(':', '-')}.mp4`;
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Cleanup
      URL.revokeObjectURL(url);
      await ffmpeg.deleteFile("input.mp4");
      await ffmpeg.deleteFile("output.mp4");

      toast.success("✅ Clip exported!", { 
        id: "export-clip",
        description: `Downloaded: ${filename}`
      });
    } catch (error) {
      console.error("Export error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error("❌ Export failed", { 
        id: "export-clip",
        description: errorMessage
      });
    } finally {
      setIsExporting(false);
    }
  };

  const uploadAsThumbnail = async (chapter: VideoChapter) => {
    console.log('🎬 ========== SET AS THUMBNAIL CLICKED ==========');
    console.log('📋 Chapter data:', chapter);
    console.log('🆔 Project ID:', projectId);
    console.log('🎥 Video URL:', videoUrl);
    
    if (!ffmpegLoaded || !ffmpegRef.current) {
      console.error('❌ FFmpeg not loaded');
      toast.error("FFmpeg not loaded");
      return;
    }

    if (!chapter.endTime) {
      console.error('❌ No end time in chapter');
      toast.error("Cannot upload", {
        description: "This chapter has no end time"
      });
      return;
    }

    if (!projectId) {
      console.error('❌ No project ID');
      toast.error("Cannot upload", {
        description: "Project must be saved first"
      });
      return;
    }

    setIsExporting(true);
    const ffmpeg = ffmpegRef.current;

    try {
      // Generate clip
      console.log('📥 Step 1: Fetching video file...');
      toast.loading("📥 Processing video...", { id: "upload-thumbnail" });
      const videoData = await fetchFile(videoUrl);
      console.log('✅ Video fetched, size:', videoData.byteLength, 'bytes');
      
      await ffmpeg.writeFile("input.mp4", videoData);
      console.log('✅ Video written to FFmpeg');

      const startParts = chapter.timestamp.split(':').map(Number);
      const startSeconds = startParts[0] * 60 + startParts[1];

      const endParts = chapter.endTime.split(':').map(Number);
      const endSeconds = endParts[0] * 60 + endParts[1];

      const clipDuration = endSeconds - startSeconds;
      
      console.log('✂️ Step 2: Trimming clip...');
      console.log('   Start:', startSeconds, 'seconds');
      console.log('   Duration:', clipDuration, 'seconds');

      toast.loading(`✂️ Trimming clip (${clipDuration}s)...`, { id: "upload-thumbnail" });

      await ffmpeg.exec([
        "-i", "input.mp4",
        "-ss", startSeconds.toString(),
        "-t", clipDuration.toString(),
        "-c", "copy",
        "output.mp4"
      ]);
      console.log('✅ Clip trimmed successfully');

      const data = await ffmpeg.readFile("output.mp4");
      const blob = new Blob([new Uint8Array(data as unknown as ArrayBuffer)], { type: "video/mp4" });
      console.log('✅ Clip blob created, size:', blob.size, 'bytes');

      // Upload to R2
      console.log('☁️ Step 3: Uploading to R2 storage...');
      toast.loading("☁️ Uploading to storage...", { id: "upload-thumbnail" });
      const formData = new FormData();
      formData.append('video', blob, 'thumbnail-clip.mp4');

      const apiUrl = `/api/projects/${projectId}/thumbnail-clip`;
      console.log('📡 API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData
      });

      console.log('📡 Response status:', response.status, response.statusText);
      const result = await response.json();
      console.log('📡 Response data:', result);

      if (!response.ok) {
        console.error('❌ API error:', result);
        throw new Error(result.error || 'Upload failed');
      }

      console.log('✅ Upload successful!');
      console.log('🔗 Thumbnail URL:', result.url);

      // Cleanup
      await ffmpeg.deleteFile("input.mp4");
      await ffmpeg.deleteFile("output.mp4");
      console.log('🧹 FFmpeg files cleaned up');

      toast.success("✅ Thumbnail clip saved!", {
        id: "upload-thumbnail",
        description: "Video thumbnail URL updated in database"
      });

      // Notify parent component
      console.log('📢 Step 4: Notifying parent component...');
      if (onThumbnailClipUpdate) {
        console.log('📢 Calling onThumbnailClipUpdate with URL:', result.url);
        onThumbnailClipUpdate(result.url);
        console.log('✅ Parent component notified');
      } else {
        console.warn('⚠️ No onThumbnailClipUpdate callback provided');
      }
      
      console.log('🎬 ========== PROCESS COMPLETE ==========');
    } catch (error) {
      console.error("❌ Upload error:", error);
      toast.error("❌ Upload failed", {
        id: "upload-thumbnail",
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Custom video upload handler
  const handleCustomVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!projectId) {
      toast.error("Cannot upload", {
        description: "Project must be saved first"
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error("Invalid file type", {
        description: "Please upload a video file (MP4, WebM, MOV)"
      });
      return;
    }

    // Validate file size (max 100MB for thumbnail clips)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      toast.error("File too large", {
        description: "Thumbnail clips should be under 100MB. Please trim your video first."
      });
      return;
    }

    setIsExporting(true);

    try {
      console.log('📤 ========== CUSTOM VIDEO UPLOAD ==========');
      console.log('📁 File:', file.name, 'Size:', file.size, 'bytes');
      
      toast.loading("☁️ Uploading custom thumbnail...", { id: "custom-upload" });

      const formData = new FormData();
      formData.append('video', file);

      const response = await fetch(`/api/projects/${projectId}/thumbnail-clip`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ API error response:', result);
        throw new Error(result.details || result.error || 'Upload failed');
      }

      console.log('✅ Upload successful!');
      console.log('🔗 Thumbnail URL:', result.url);

      toast.success("✅ Custom thumbnail uploaded!", {
        id: "custom-upload",
        description: "Video thumbnail URL updated"
      });

      // Notify parent component
      if (onThumbnailClipUpdate) {
        onThumbnailClipUpdate(result.url);
      }

      console.log('📤 ========== UPLOAD COMPLETE ==========');
    } catch (error) {
      console.error("❌ Upload error:", error);
      toast.error("❌ Upload failed", {
        id: "custom-upload",
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsExporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Video Thumbnail Clip
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Create a short preview clip for the homepage and works page. The full video below is for reference only.
        </p>
      </div>

      {/* Current Thumbnail Display */}
      {currentThumbnailUrl && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 text-2xl">✅</div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
                Current Thumbnail Clip
              </h4>
              <div className="space-y-3">
                <video
                  src={currentThumbnailUrl}
                  controls
                  className="w-full max-w-md rounded-lg border border-green-300 dark:border-green-700"
                  style={{ maxHeight: '200px' }}
                />
                <div className="flex items-center gap-2">
                  <a
                    href={currentThumbnailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-700 dark:text-green-300 hover:underline break-all"
                  >
                    {currentThumbnailUrl}
                  </a>
                </div>
                <p className="text-xs text-green-700 dark:text-green-300">
                  This clip is currently being used on the portfolio website. Upload a new one below to replace it.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!currentThumbnailUrl && videoUrl && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="text-2xl">ℹ️</div>
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                No thumbnail clip set
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                The full video will be used on the portfolio website. Upload or generate a thumbnail clip below for better performance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Custom Video Upload Option */}
      {videoUrl && projectId && (
        <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border-2 border-dashed border-purple-300 dark:border-purple-700">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 text-3xl">📤</div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Option 1: Upload Custom Thumbnail Video
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                Already have a trimmed video? Upload it directly (recommended for best quality).
              </p>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/mov"
                    onChange={handleCustomVideoUpload}
                    disabled={isExporting}
                    className="hidden"
                  />
                  <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
                    {isExporting ? '⏳ Uploading...' : '📤 Choose Video File'}
                  </span>
                </label>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  MP4, WebM, MOV • Max 100MB
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {!projectId && videoUrl && (
        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <p className="text-sm text-orange-800 dark:text-orange-200">
            ⚠️ Save the project first before uploading thumbnail clips
          </p>
        </div>
      )}

      {videoUrl && projectId && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
              OR
            </span>
          </div>
        </div>
      )}

      {/* Generate from Timeline Section */}
      {videoUrl && projectId && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Option 2: Generate from Full Video Timeline
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Select a range from the full video below and generate a clip automatically.
          </p>
        </div>
      )}

      {/* Full Video Player - For Reference */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Full Video (For Reference)
          </h4>
          {videoUrl && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Use timeline below to select a range
            </span>
          )}
        </div>
        <div className="relative rounded-lg overflow-hidden bg-black shadow-lg">
          {!videoUrl ? (
            <div className="w-full h-64 flex items-center justify-center text-white bg-gray-900">
              <div className="text-center">
                <p className="text-lg mb-2">📹 No video uploaded yet</p>
                <p className="text-sm text-gray-400">Upload a video file in the Media tab first</p>
              </div>
            </div>
          ) : (
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full max-h-[500px] bg-black"
                controls
                playsInline
                // crossOrigin="anonymous"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                <source src={videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          )}
        </div>
      </div>

      {!videoUrl && (
        <div className="text-center p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ Please upload a video file in the Media tab first
          </p>
        </div>
      )}

      {videoUrl && duration === 0 && (
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            ⏳ Loading video... Please wait
          </p>
        </div>
      )}

      {videoUrl && projectId && (
        <>
      {/* Custom Timeline with Draggable Range */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">0:00</span>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 font-mono text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md border border-gray-300 dark:border-gray-600">
              Current: {formatTime(currentTime)}
            </span>
            {selectedRange && (
              <span className="px-3 py-1 font-mono text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md border-2 border-blue-500">
                Selection: {formatTimeSimple(selectedRange.start)} → {formatTimeSimple(selectedRange.end)}
              </span>
            )}
          </div>
          <span className="text-gray-600 dark:text-gray-400">{formatTimeSimple(duration)}</span>
        </div>

        {/* Interactive Timeline */}
        <div 
          ref={timelineRef}
          className="relative h-20 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg cursor-pointer overflow-hidden border border-gray-700"
          onClick={handleTimelineClick}
        >
          {duration === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
              ⏳ Loading video metadata...
            </div>
          )}
          
          {duration > 0 && (
            <>
          {/* Existing chapter markers (saved ranges) */}
          {chapters.map((chapter, idx) => {
            const parts = chapter.timestamp.split(':').map(Number);
            const startSeconds = parts[0] * 60 + parts[1];
            
            const isRange = chapter.type === 'range' && chapter.endTime;
            let endSeconds = startSeconds;
            
            if (isRange && chapter.endTime) {
              const endParts = chapter.endTime.split(':').map(Number);
              endSeconds = endParts[0] * 60 + endParts[1];
            }
            
            return (
              <div key={idx} className="pointer-events-none">
                {isRange ? (
                  <div 
                    className="absolute top-0 h-full bg-green-500/40 border-l-2 border-r-2 border-green-600"
                    style={{ 
                      left: `${(startSeconds / duration) * 100}%`,
                      width: `${((endSeconds - startSeconds) / duration) * 100}%`
                    }}
                    title={`${chapter.label || 'Range'}: ${chapter.timestamp} - ${chapter.endTime}`}
                  />
                ) : (
                  <div 
                    className="absolute top-0 h-full w-1 bg-yellow-500"
                    style={{ left: `${(startSeconds / duration) * 100}%` }}
                    title={`${chapter.label || 'Moment'}: ${chapter.timestamp}`}
                  />
                )}
              </div>
            );
          })}
          
          {/* Selected Range with Draggable Handles */}
          {selectedRange && (
            <div 
              className="absolute top-0 h-full bg-blue-500/30 border-l-4 border-r-4 border-blue-600 cursor-move"
              style={{ 
                left: `${(selectedRange.start / duration) * 100}%`,
                width: `${((selectedRange.end - selectedRange.start) / duration) * 100}%`
              }}
              onMouseDown={(e) => handleStartDrag(e, 'range')}
            >
              {/* Start Handle */}
              <div 
                className="absolute left-0 top-0 h-full w-4 bg-blue-600 cursor-ew-resize hover:bg-blue-700 flex items-center justify-center"
                style={{ marginLeft: '-16px' }}
                onMouseDown={(e) => handleStartDrag(e, 'start')}
              >
                <div className="w-1 h-8 bg-white rounded-full" />
              </div>
              
              {/* End Handle */}
              <div 
                className="absolute right-0 top-0 h-full w-4 bg-blue-600 cursor-ew-resize hover:bg-blue-700 flex items-center justify-center"
                style={{ marginRight: '-16px' }}
                onMouseDown={(e) => handleStartDrag(e, 'end')}
              >
                <div className="w-1 h-8 bg-white rounded-full" />
              </div>
            </div>
          )}
          
          {/* Current time indicator (playhead) - Simple vertical line */}
          <div 
            className="absolute top-0 h-full w-0.5 bg-red-600 shadow-lg pointer-events-none z-10"
            style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          >
            <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-600 rounded-full shadow-lg" />
          </div>
            </>
          )}
        </div>

        {/* Timeline Instructions */}
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Click timeline to seek • Drag blue handles to adjust range • Drag blue bar to move range
        </p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={setRangeFromCurrent}
          className="px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-colors"
        >
          📍 Set Range Here
        </button>
        <button
          type="button"
          onClick={createRangeFromSelection}
          disabled={!selectedRange}
          className="px-4 py-3 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          ✓ Save Range
        </button>
      </div>

      {/* Instructions */}
      <div className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <span className="text-2xl">💡</span>
        <div className="flex-1 space-y-2">
          <p className="font-semibold text-blue-900 dark:text-blue-100">How to select video range:</p>
          <ol className="space-y-1.5 text-sm list-decimal list-inside">
            <li><strong>Play the video</strong> and find the part you want</li>
            <li><strong>Click "Set Range Here"</strong> to create a selection around current time</li>
            <li><strong>Drag the blue handles</strong> to adjust start and end times precisely</li>
            <li><strong>Click "Save Range"</strong> to add it to your project</li>
            <li><strong>Export Clip</strong> button will appear to download that segment as MP4</li>
          </ol>
          <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
            <p className="text-xs"><strong>Timeline Guide:</strong></p>
            <ul className="text-xs space-y-1 mt-1">
              <li>• <span className="inline-block w-3 h-3 bg-red-600 rounded-full"></span> Red line = Current video position (playhead)</li>
              <li>• <span className="inline-block w-3 h-3 bg-blue-500/40 border-2 border-blue-600"></span> Blue bar = Your selection (drag handles to adjust)</li>
              <li>• <span className="inline-block w-3 h-3 bg-green-500/40 border-2 border-green-600"></span> Green bar = Saved range (ready to export)</li>
            </ul>
          </div>
          {ffmpegLoaded ? (
            <p className="text-green-700 dark:text-green-300 font-medium mt-2">
              ✅ FFmpeg ready - Clip export available
            </p>
          ) : (
            <p className="text-orange-600 dark:text-orange-400 mt-2">
              ⏳ Loading FFmpeg for clip export...
            </p>
          )}
        </div>
      </div>

      {/* Chapter List */}
      {chapters.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Saved Chapters ({chapters.length})
            </h4>
            <button
              type="button"
              onClick={() => {
                if (confirm('Remove all chapters?')) {
                  onChaptersChange([]);
                  toast.success('All chapters removed');
                }
              }}
              className="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
            >
              Clear All
            </button>
          </div>
          
          <div className="space-y-2">
            {chapters.map((chapter, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full text-sm font-medium">
                  {idx + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={chapter.label}
                    onChange={(e) => {
                      const newChapters = [...chapters];
                      newChapters[idx].label = e.target.value;
                      onChaptersChange(newChapters);
                    }}
                    placeholder={`${chapter.type === 'range' ? 'Range' : 'Moment'} ${idx + 1}`}
                    className="w-full text-sm font-medium bg-transparent border-none focus:outline-none focus:ring-0 p-0 text-gray-900 dark:text-gray-100 placeholder-gray-400"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                    {chapter.type === 'range' && chapter.endTime 
                      ? `${chapter.timestamp} → ${chapter.endTime}` 
                      : chapter.timestamp
                    }
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  {chapter.type === 'range' && chapter.endTime && (
                    <>
                      <button
                        type="button"
                        onClick={() => exportClip(chapter)}
                        disabled={!ffmpegLoaded || isExporting}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        title="Download this clip as MP4"
                      >
                        {isExporting ? '⏳' : '💾'} Download
                      </button>
                      {projectId && (
                        <button
                          type="button"
                          onClick={() => uploadAsThumbnail(chapter)}
                          disabled={!ffmpegLoaded || isExporting}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                          title="Upload as video thumbnail clip"
                        >
                          {isExporting ? '⏳' : '☁️'} Set as Thumbnail
                        </button>
                      )}
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const newChapters = chapters.filter((_, i) => i !== idx);
                      onChaptersChange(newChapters);
                      toast.success('Chapter removed');
                    }}
                    className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    title="Remove chapter"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>)}

    </div>
  );

}
