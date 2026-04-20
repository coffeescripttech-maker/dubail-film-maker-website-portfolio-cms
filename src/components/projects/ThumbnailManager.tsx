"use client";
import { useState, useEffect } from "react";
import FileUpload from "@/components/upload/FileUpload";
import VideoFrameCapture, { FrameCaptureResult } from "./VideoFrameCapture";
import { TrashBinIcon } from "@/icons";
import { toast } from "sonner";
import { ThumbnailOption } from "@/lib/thumbnail-service";

interface ThumbnailManagerProps {
  projectId: string;
  currentThumbnail?: string;
  videoUrl?: string;
  onThumbnailChange: (thumbnailUrl: string) => void;
}

export default function ThumbnailManager({
  projectId,
  currentThumbnail,
  videoUrl,
  onThumbnailChange,
}: ThumbnailManagerProps) {
  const [thumbnailOptions, setThumbnailOptions] = useState<ThumbnailOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoveredThumbnail, setHoveredThumbnail] = useState<string | null>(null);
  const [showVideoFrameCapture, setShowVideoFrameCapture] = useState(false);

  // Load thumbnail options when component mounts or projectId changes
  useEffect(() => {
    if (projectId) {
      loadThumbnailOptions();
    }
  }, [projectId]);

  const loadThumbnailOptions = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/thumbnails`);
      if (!response.ok) {
        throw new Error('Failed to fetch thumbnail options');
      }
      const data = await response.json();
      setThumbnailOptions(data.thumbnails || []);
    } catch (error) {
      console.error("Error loading thumbnail options:", error);
      setThumbnailOptions([]);
    }
  };

  const handleCustomThumbnailUpload = async (result: any) => {
    try {
      setLoading(true);

      // Save thumbnail metadata to database via API route
      const response = await fetch(`/api/projects/${projectId}/thumbnails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          thumbnail_url: result.publicUrl,
          thumbnail_type: "custom",
          metadata: {
            width: result.width,
            height: result.height,
            size: result.size,
          },
          setAsActive: true
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save thumbnail');
      }

      // Reload thumbnail options
      await loadThumbnailOptions();

      // Notify parent component
      onThumbnailChange(result.publicUrl);

      toast.success("Thumbnail Uploaded!", {
        description: "Custom thumbnail has been set as active.",
      });
    } catch (error) {
      console.error("Error uploading thumbnail:", error);
      toast.error("Upload Failed", {
        description: "Failed to save thumbnail. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleThumbnailSelect = async (thumbnailId: string) => {
    try {
      setLoading(true);

      const response = await fetch(`/api/thumbnails/${thumbnailId}/activate`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to activate thumbnail');
      }

      const data = await response.json();
      const updatedThumbnail = data.data;

      if (updatedThumbnail) {
        // Reload thumbnail options to update active states
        await loadThumbnailOptions();

        // Notify parent component
        onThumbnailChange(updatedThumbnail.thumbnail_url);

        toast.success("Thumbnail Activated!", {
          description: "Selected thumbnail is now active.",
        });
      }
    } catch (error) {
      console.error("Error activating thumbnail:", error);
      toast.error("Activation Failed", {
        description: "Failed to activate thumbnail. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleThumbnailDelete = async (thumbnailId: string) => {
    if (!confirm("Are you sure you want to delete this thumbnail?")) {
      return;
    }

    try {
      setLoading(true);

      // Check if the thumbnail to delete is active before deletion
      const deletedOption = thumbnailOptions.find((opt) => opt.id === thumbnailId);
      const wasActive = deletedOption?.is_active;

      const response = await fetch(`/api/thumbnails/${thumbnailId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete thumbnail');
      }

      // Reload thumbnail options
      await loadThumbnailOptions();

      toast.success("Thumbnail Deleted!", {
        description: "Thumbnail has been removed.",
      });

      // If the deleted thumbnail was active, notify parent
      if (wasActive) {
        onThumbnailChange("");
      }
    } catch (error) {
      console.error("Error deleting thumbnail:", error);
      toast.error("Delete Failed", {
        description: "Failed to delete thumbnail. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFromVideo = () => {
    setShowVideoFrameCapture(true);
  };

  const handleFrameCaptured = async (result: FrameCaptureResult) => {
    try {
      // Reload thumbnail options to show the new captured frame
      await loadThumbnailOptions();

      // Notify parent component
      onThumbnailChange(result.thumbnailUrl);

      // Close the video frame capture modal
      setShowVideoFrameCapture(false);

      toast.success("Frame Captured!", {
        description: `Thumbnail generated from video at ${result.timestamp.toFixed(2)}s`,
      });
    } catch (error) {
      console.error("Error handling captured frame:", error);
      toast.error("Error", {
        description: "Failed to process captured frame. Please try again.",
      });
    }
  };

  // Get active thumbnail
  const activeThumbnail = thumbnailOptions.find((opt) => opt.is_active);

  return (
    <div className="space-y-6">
      {/* Current Active Thumbnail */}
      {activeThumbnail && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Current Active Thumbnail
          </label>
          <div className="relative">
            <img
              src={activeThumbnail.thumbnail_url}
              alt="Active thumbnail"
              className="w-full h-48 object-cover rounded-lg border-2 border-blue-500 dark:border-blue-400"
            />
            <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded">
              Active
            </div>
            {activeThumbnail.thumbnail_type === "video_frame" && activeThumbnail.timestamp !== undefined && (
              <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 text-white text-xs font-medium rounded">
                Frame at {activeThumbnail.timestamp.toFixed(2)}s
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Custom Thumbnail */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Upload Custom Thumbnail
        </label>
        <FileUpload
          type="image"
          folder="thumbnails/custom"
          onUploadComplete={handleCustomThumbnailUpload}
          onUploadError={(error) => {
            toast.error("Upload Error", {
              description: error,
            });
          }}
          accept="image/jpeg,image/png,image/webp"
          maxSizeMB={10}
          showPreview={false}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Upload a custom thumbnail image (JPEG, PNG, or WebP, max 10MB)
        </p>
      </div>

      {/* Generate from Video Button */}
      {videoUrl && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleGenerateFromVideo}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Generate Thumbnail from Video
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Extract a frame from your uploaded video to use as thumbnail
          </p>
        </div>
      )}

      {/* All Available Thumbnail Options */}
      {thumbnailOptions.length > 0 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            All Thumbnail Options ({thumbnailOptions.length})
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {thumbnailOptions.map((option) => (
              <div
                key={option.id}
                className="relative group"
                onMouseEnter={() => setHoveredThumbnail(option.id)}
                onMouseLeave={() => setHoveredThumbnail(null)}
              >
                <div
                  className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    option.is_active
                      ? "border-blue-500 dark:border-blue-400"
                      : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
                  }`}
                  onClick={() => !option.is_active && handleThumbnailSelect(option.id)}
                  role="button"
                  tabIndex={option.is_active ? -1 : 0}
                  aria-label={`${option.is_active ? 'Active' : 'Select'} ${option.thumbnail_type === 'custom' ? 'custom' : 'video frame'} thumbnail`}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !option.is_active) {
                      e.preventDefault();
                      handleThumbnailSelect(option.id);
                    }
                  }}
                >
                  <img
                    src={option.thumbnail_url}
                    alt={`Thumbnail option ${option.thumbnail_type}`}
                    className="w-full h-32 sm:h-36 object-cover"
                  />
                  
                  {/* Active Badge */}
                  {option.is_active && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded">
                      Active
                    </div>
                  )}

                  {/* Type Badge */}
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 text-white text-xs font-medium rounded">
                    {option.thumbnail_type === "custom" ? "Custom" : "Video Frame"}
                  </div>

                  {/* Timestamp for video frames */}
                  {option.thumbnail_type === "video_frame" && option.timestamp !== undefined && (
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs font-medium rounded">
                      {option.timestamp.toFixed(2)}s
                    </div>
                  )}

                  {/* Hover/Touch Overlay */}
                  {(hoveredThumbnail === option.id || !option.is_active) && (
                    <div className="absolute inset-0 bg-blue-600/0 hover:bg-blue-600/20 active:bg-blue-600/30 flex items-center justify-center transition-colors sm:group-hover:bg-blue-600/20">
                      {!option.is_active && (
                        <span className="opacity-0 sm:group-hover:opacity-100 text-white text-sm font-medium bg-blue-600 px-3 py-1 rounded transition-opacity">
                          Tap to Activate
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Delete Button */}
                {!option.is_active && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleThumbnailDelete(option.id);
                    }}
                    aria-label="Delete thumbnail"
                    className="absolute -top-2 -right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  >
                    <TrashBinIcon className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video Frame Capture Modal */}
      {showVideoFrameCapture && videoUrl && (
        <VideoFrameCapture
          videoUrl={videoUrl}
          projectId={projectId}
          onFrameCapture={handleFrameCaptured}
          onCancel={() => setShowVideoFrameCapture(false)}
        />
      )}
    </div>
  );
}
