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
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load video metadata
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setVideoLoaded(true);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
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
                Timeline
              </span>
              <span className="font-mono text-blue-600 dark:text-blue-400">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
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
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
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
                    <p className="font-medium">Navigation Options:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><strong>Timeline Scrubber:</strong> Drag to any position</li>
                      <li><strong>Frame-by-Frame:</strong> Use ← → buttons or Shift+Arrow keys</li>
                      <li><strong>Skip 5 Seconds:</strong> Use ⏪ ⏩ buttons or Arrow keys</li>
                      <li><strong>Quick Jump:</strong> Click Start, 25%, 50%, 75%, or End</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium">Keyboard Shortcuts:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><strong>Space:</strong> Play/Pause</li>
                      <li><strong>← →:</strong> Skip 5 seconds backward/forward</li>
                      <li><strong>Shift+← →:</strong> Previous/Next frame (precise!)</li>
                      <li><strong>Home/End:</strong> Jump to start/end</li>
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
