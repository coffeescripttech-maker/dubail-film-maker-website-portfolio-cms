"use client";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";

interface AboutImage {
  id: string;
  url: string;
  alt: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
}

export default function AboutImagesSettings() {
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<AboutImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAlt, setEditAlt] = useState("");

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/about/images');
      
      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }

      const data = await response.json();
      setImages(data.images || []);
    } catch (error) {
      console.error('Error fetching images:', error);
      toast.error('Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate all files first
    const validFiles: File[] = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB limit`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      e.target.value = '';
      return;
    }

    try {
      setUploading(true);
      
      // Initialize progress tracking
      const initialProgress = validFiles.map(file => ({
        fileName: file.name,
        progress: 0,
        status: 'uploading' as const,
      }));
      setUploadProgress(initialProgress);

      // Upload all files in parallel
      const uploadPromises = validFiles.map(async (file, index) => {
        try {
          // Update progress: Getting presigned URL
          setUploadProgress(prev => prev.map((p, i) => 
            i === index ? { ...p, progress: 10 } : p
          ));

          // Get presigned URL with correct parameter names
          const presignedResponse = await fetch('/api/upload/presigned-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              fileType: file.type,
              folder: 'about-images',
            }),
          });

          if (!presignedResponse.ok) {
            const errorData = await presignedResponse.json();
            throw new Error(errorData.error || 'Failed to get upload URL');
          }

          const { presignedUrl, publicUrl } = await presignedResponse.json();

          // Update progress: Uploading to R2
          setUploadProgress(prev => prev.map((p, i) => 
            i === index ? { ...p, progress: 30 } : p
          ));

          // Upload to R2
          const uploadResponse = await fetch(presignedUrl, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type,
            },
          });

          if (!uploadResponse.ok) {
            throw new Error('Failed to upload image to storage');
          }

          // Update progress: Saving to database
          setUploadProgress(prev => prev.map((p, i) => 
            i === index ? { ...p, progress: 70 } : p
          ));

          // Save to database
          const saveResponse = await fetch('/api/about/images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: publicUrl,
              alt: file.name.replace(/\.[^/.]+$/, ''), // Use filename without extension as default alt
            }),
          });

          if (!saveResponse.ok) {
            throw new Error('Failed to save image to database');
          }

          // Update progress: Complete
          setUploadProgress(prev => prev.map((p, i) => 
            i === index ? { ...p, progress: 100, status: 'success' } : p
          ));

          return { success: true, fileName: file.name };
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          setUploadProgress(prev => prev.map((p, i) => 
            i === index ? { ...p, status: 'error' } : p
          ));
          return { 
            success: false, 
            fileName: file.name, 
            error: error instanceof Error ? error.message : 'Upload failed' 
          };
        }
      });

      const results = await Promise.all(uploadPromises);
      
      // Show results
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        toast.success(`${successCount} image${successCount > 1 ? 's' : ''} uploaded successfully`);
      }
      if (failCount > 0) {
        toast.error(`${failCount} image${failCount > 1 ? 's' : ''} failed to upload`);
      }

      // Refresh image list
      await fetchImages();
      
      // Reset file input and progress
      e.target.value = '';
      setTimeout(() => setUploadProgress([]), 2000);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const response = await fetch(`/api/about/images/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      toast.success('Image deleted successfully');
      fetchImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    }
  };

  const handleUpdateAlt = async (id: string) => {
    try {
      const response = await fetch(`/api/about/images/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alt: editAlt }),
      });

      if (!response.ok) {
        throw new Error('Failed to update alt text');
      }

      toast.success('Alt text updated');
      setEditingId(null);
      fetchImages();
    } catch (error) {
      console.error('Error updating alt text:', error);
      toast.error('Failed to update alt text');
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedItem = newImages[draggedIndex];
    
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedItem);
    
    setImages(newImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;

    try {
      // Update order in backend
      const newOrder = images.map((img, idx) => ({
        id: img.id,
        order_index: idx + 1,
      }));

      const response = await fetch('/api/about/images/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: newOrder }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update order');
      }

      toast.success('Order updated successfully');
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update order');
      fetchImages(); // Revert to original order
    } finally {
      setDraggedIndex(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading images...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-800 dark:bg-gray-800/50">
        <h4 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
          Upload About Images
        </h4>
        
        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Images (Multiple)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              disabled={uploading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-400 dark:hover:file:bg-blue-900/30 disabled:opacity-50"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Supported formats: JPG, PNG, GIF, WebP. Max size: 5MB per image. You can select multiple images.
            </p>
          </div>

          {/* Upload Progress */}
          {uploadProgress.length > 0 && (
            <div className="space-y-2">
              {uploadProgress.map((progress, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400 truncate flex-1">
                      {progress.fileName}
                    </span>
                    <span className={`ml-2 font-medium ${
                      progress.status === 'success' ? 'text-green-600 dark:text-green-400' :
                      progress.status === 'error' ? 'text-red-600 dark:text-red-400' :
                      'text-blue-600 dark:text-blue-400'
                    }`}>
                      {progress.status === 'success' ? '✓ Done' :
                       progress.status === 'error' ? '✗ Failed' :
                       `${progress.progress}%`}
                    </span>
                  </div>
                  {progress.status === 'uploading' && (
                    <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${progress.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Images Grid */}
      <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-800 dark:bg-gray-800/50">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-base font-semibold text-gray-900 dark:text-white">
            Manage Images ({images.length})
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Drag to reorder
          </p>
        </div>

        {images.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-2">No images uploaded yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div
                key={image.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`group relative rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden cursor-move transition-all ${
                  draggedIndex === index ? 'opacity-50 scale-95' : 'hover:shadow-lg'
                }`}
              >
                {/* Image */}
                <div className="aspect-video bg-gray-100 dark:bg-gray-900">
                  <img
                    src={image.url}
                    alt={image.alt || 'About image'}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info & Actions */}
                <div className="p-3 bg-white dark:bg-gray-800">
                  {editingId === image.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editAlt}
                        onChange={(e) => setEditAlt(e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="Alt text"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateAlt(image.id)}
                          className="flex-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex-1 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate mb-2">
                        {image.alt || 'No alt text'}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingId(image.id);
                            setEditAlt(image.alt || '');
                          }}
                          className="flex-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        >
                          Edit Alt
                        </button>
                        <button
                          onClick={() => handleDelete(image.id)}
                          className="flex-1 px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Order Badge */}
                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-900/20">
        <div className="flex gap-3">
          <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-medium mb-1">About Images Tips:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Select multiple images at once for bulk upload</li>
              <li>Images are displayed on the About page in the order shown</li>
              <li>Drag and drop to reorder images</li>
              <li>Add descriptive alt text for accessibility</li>
              <li>Recommended aspect ratio: 16:9 for best display</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
