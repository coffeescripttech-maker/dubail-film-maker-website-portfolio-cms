"use client";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

interface VideoFrameCaptureProps {
  videoUrl: string;
  projectId: string;
  onFrameCapture: (result: FrameCaptureResult) => void;
  onCancel: () => void;
}

export interface FrameCaptureResult {
  thumbnailUrl: string;
  thumbnailId: string;
  timestamp: number;
}

interface FilmstripFrame {
  timestamp: number;
  dataUrl: string;
}

export default function VideoFrameCapture({
  videoUrl,
  projectId,
  onFrameCapture,
  onCancel,
}: VideoFrameCaptureProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [filmstripFrames, setFilmstripFrames] = useState<FilmstripFrame[]>([]);
  const [generatingFilmstrip, setGeneratingFilmstrip] = useState(false);
  const [filmstripProgress, setFilmstripProgress] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const filmstripRef = useRef<HTMLDivElement>(null);

  // Load video metadata and generate filmstrip
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setVideoLoaded(true);
      // Generate filmstrip after video is loaded
      generateFilmstrip(video);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      // Auto-scroll filmstrip to current position
      scrollFilmstripToTime(video.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  // Generate continuous filmstrip (like video editor timeline)
  const generateFilmstrip = async (video: HTMLVideoElement) => {
    if (!canvasRef.current) return;

    setGeneratingFilmstrip(true);
    const frames: FilmstripFrame[] = [];
    
    // Generate frame every 0.5 seconds for smooth filmstrip
    const frameInterval = 0.5; // seconds between frames
    const totalFrames = Math.ceil(video.duration / frameInterval);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas size for filmstrip frames (smaller for performance)
    canvas.width = 120;
    canvas.height = 68;

    try {
      for (let i = 0; i < totalFrames; i++) {
        const timestamp = Math.min(i * frameInterval, video.duration);
        
        // Seek to timestamp
        video.currentTime = timestamp;
        
        // Wait for seek to complete
        await new Promise<void>((resolve) => {
          const onSeeked = () => {
            video.removeEventListener('seeked', onSeeked);
            resolve();
          };
          video.addEventListener('seeked', onSeeked);
        });

        // Draw frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        
        frames.push({ timestamp, dataUrl });
        
        // Update progress
        setFilmstripProgress(Math.round(((i + 1) / totalFrames) * 100));
      }

      setFilmstripFrames(frames);
      
      // Reset video to start
      video.currentTime = 0;
    } catch (error) {
      console.error('Error generating filmstrip:', error);
      toast.error('Failed to generate timeline preview');
    } finally {
      setGeneratingFilmstrip(false);
      setFilmstripProgress(0);
    }
  };

  // Scroll filmstrip to show current time
  const scrollFilmstripToTime = (time: number) => {
    if (!filmstripRef.current || filmstripFrames.length === 0) return;

    const percentage = time / duration;
    const scrollWidth = filmstripRef.current.scrollWidth - filmstripRef.current.clientWidth;
    filmstripRef.current.scrollLeft = scrollWidth * percentage;
  };

  // Handle filmstrip click to seek
  const handleFilmstripClick = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      setCurrentTime(timestamp);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoLoaded) return;

      // Prevent default for arrow keys to avoid page scrolling
      if (['ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      switch (e.code) {
        case 'Space':
          handlePlayPause();
          break;
        case 'ArrowLeft':
          if (e.shiftKey) {
            seekFrames(-1); // Frame backward
          } else {
            skipTime(-5); // 5s backward
          }
          break;
        case 'ArrowRight':
          if (e.shiftKey) {
            seekFrames(1); // Frame forward
          } else {
            skipTime(5); // 5s forward
          }
          break;
        case 'Home':
          jumpToPercent(0); // Jump to start
          break;
        case 'End':
          jumpToPercent(100); // Jump to end
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [videoLoaded, isPlaying, currentTime, duration]);

  const handleTimelineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  // Frame-by-frame navigation (assuming 30fps, 1 frame = 1/30 second)
  const seekFrames = (frames: number) => {
    if (!videoRef.current) return;
    const frameTime = 1 / 30; // 30fps
    const newTime = Math.max(0, Math.min(duration, currentTime + (frames * frameTime)));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Skip forward/backward by seconds
  const skipTime = (seconds: number) => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Jump to specific percentage of video
  const jumpToPercent = (percent: number) => {
    if (!videoRef.current) return;
    const newTime = (duration * percent) / 100;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error('Error', {
        description: 'Video or canvas not ready'
      });
      return;
    }

    try {
      setCapturing(true);

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          },
          'image/jpeg',
          0.95
        );
      });

      // Convert blob to base64
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to read blob as base64'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Upload frame to server
      const response = await fetch('/api/thumbnails/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          timestamp: currentTime,
          frameData: base64Data,
          width: canvas.width,
          height: canvas.height,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload frame');
      }

      const result = await response.json();

      toast.success('Frame Captured!', {
        description: `Thumbnail generated from ${formatTime(currentTime)}`
      });

      // Call the callback with the result
      onFrameCapture({
        thumbnailUrl: result.data.thumbnailUrl,
        thumbnailId: result.data.thumbnailId,
        timestamp: currentTime,
      });

    } catch (error) {
      console.error('Frame capture error:', error);
      toast.error('Capture Failed', {
        description: error instanceof Error ? error.message : 'Failed to capture frame'
      });
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Capture Video Frame
          </h3>
          <button
            type="button"
            onClick={onCancel}
            disabled={capturing}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Video Player */}
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-auto max-h-[50vh]"
              crossOrigin="anonymous"
            >
              Your browser does not support the video tag.
            </video>

            {/* Play/Pause Overlay */}
            {!isPlaying && videoLoaded && (
              <button
                type="button"
                onClick={handlePlayPause}
                className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
              >
                <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </button>
            )}
          </div>

          {/* Timeline Controls */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Timeline Filmstrip
                {generatingFilmstrip && (
                  <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                    Generating... {filmstripProgress}%
                  </span>
                )}
              </span>
              <span className="font-mono text-blue-600 dark:text-blue-400">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Continuous Filmstrip Container */}
            <div className="relative bg-gray-900 dark:bg-black rounded-lg border-2 border-gray-700 dark:border-gray-800 overflow-hidden">
              {generatingFilmstrip ? (
                <div className="h-24 flex items-center justify-center">
                  <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-2"></div>
                    <p className="text-sm text-gray-400">Generating filmstrip... {filmstripProgress}%</p>
                  </div>
                </div>
              ) : filmstripFrames.length > 0 ? (
                <>
                  {/* Scrollable Filmstrip */}
                  <div
                    ref={filmstripRef}
                    className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 py-2 px-1"
                    style={{ scrollBehavior: 'smooth' }}
                  >
                    {filmstripFrames.map((frame, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleFilmstripClick(frame.timestamp)}
                        className="relative flex-shrink-0 group"
                        title={formatTime(frame.timestamp)}
                      >
                        <img
                          src={frame.dataUrl}
                          alt={`Frame at ${formatTime(frame.timestamp)}`}
                          className="h-20 w-auto object-cover border-r border-gray-700 group-hover:brightness-110 transition-all"
                        />
                        {/* Timestamp overlay on hover */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-[10px] px-1 py-0.5 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                          {formatTime(frame.timestamp)}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Current Position Indicator (Red Line) */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-10"
                    style={{
                      left: `${(currentTime / duration) * 100}%`,
                      boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)'
                    }}
                  >
                    {/* Triangle at top */}
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
                      <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-500"></div>
                    </div>
                    {/* Triangle at bottom */}
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                      <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-red-500"></div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-24 flex items-center justify-center text-gray-500">
                  <p className="text-sm">Loading video...</p>
                </div>
              )}
            </div>

            {/* Timeline Scrubber */}
            <div className="relative">
              <input
                type="range"
                min="0"
                max={duration || 0}
                step="0.1"
                value={currentTime}
                onChange={handleTimelineChange}
                disabled={!videoLoaded}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg
                  [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-red-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-lg"
              />
              
              {/* Progress indicator */}
              <div 
                className="absolute top-0 left-0 h-2 bg-red-500 rounded-l-lg pointer-events-none"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>

            {/* Enhanced Playback Controls */}
            <div className="space-y-3">
              {/* Main Controls Row */}
              <div className="flex items-center justify-center gap-2">
                {/* Skip Backward 5s */}
                <button
                  type="button"
                  onClick={() => skipTime(-5)}
                  disabled={!videoLoaded}
                  className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Skip backward 5 seconds"
                >
                  <svg className="w-5 h-5 text-gray-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                  </svg>
                </button>

                {/* Previous Frame */}
                <button
                  type="button"
                  onClick={() => seekFrames(-1)}
                  disabled={!videoLoaded}
                  className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous frame (1/30s)"
                >
                  <svg className="w-5 h-5 text-gray-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Play/Pause */}
                <button
                  type="button"
                  onClick={handlePlayPause}
                  disabled={!videoLoaded}
                  className="p-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                {/* Next Frame */}
                <button
                  type="button"
                  onClick={() => seekFrames(1)}
                  disabled={!videoLoaded}
                  className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next frame (1/30s)"
                >
                  <svg className="w-5 h-5 text-gray-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Skip Forward 5s */}
                <button
                  type="button"
                  onClick={() => skipTime(5)}
                  disabled={!videoLoaded}
                  className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Skip forward 5 seconds"
                >
                  <svg className="w-5 h-5 text-gray-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                  </svg>
                </button>
              </div>

              {/* Quick Jump Buttons */}
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Quick Jump:</span>
                <button
                  type="button"
                  onClick={() => jumpToPercent(0)}
                  disabled={!videoLoaded}
                  className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start
                </button>
                <button
                  type="button"
                  onClick={() => jumpToPercent(25)}
                  disabled={!videoLoaded}
                  className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  25%
                </button>
                <button
                  type="button"
                  onClick={() => jumpToPercent(50)}
                  disabled={!videoLoaded}
                  className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => jumpToPercent(75)}
                  disabled={!videoLoaded}
                  className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  75%
                </button>
                <button
                  type="button"
                  onClick={() => jumpToPercent(100)}
                  disabled={!videoLoaded}
                  className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  End
                </button>
              </div>

              {/* Keyboard Shortcuts Info */}
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-medium">Tip:</span> Use arrow keys: ← → for 5s skip, Shift+← → for frame-by-frame
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <p className="font-medium mb-2">How to capture the perfect frame:</p>
                <div className="space-y-2 text-blue-700 dark:text-blue-400">
                  <div>
                    <p className="font-medium">Filmstrip Navigation:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><strong>Click any frame</strong> in the filmstrip to jump instantly</li>
                      <li><strong>Scroll horizontally</strong> to browse through all frames</li>
                      <li><strong>Red line indicator</strong> shows your current position</li>
                      <li><strong>Hover over frames</strong> to see exact timestamps</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium">Fine-Tuning:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><strong>Timeline Scrubber:</strong> Drag for precise positioning</li>
                      <li><strong>Frame-by-Frame:</strong> Use ← → buttons or Shift+Arrow keys</li>
                      <li><strong>Keyboard Shortcuts:</strong> Space (play/pause), Arrow keys (skip 5s)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button
            type="button"
            onClick={onCancel}
            disabled={capturing}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={captureFrame}
            disabled={!videoLoaded || capturing}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {capturing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Capturing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Capture Frame
              </>
            )}
          </button>
        </div>

        {/* Hidden canvas for frame extraction */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}

