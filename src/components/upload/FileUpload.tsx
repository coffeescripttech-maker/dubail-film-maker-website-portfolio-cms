"use client";
import React, { useState, useRef } from "react";
import { PlusIcon, TrashBinIcon } from "@/icons";
import { toast } from "sonner";

interface FileUploadProps {
  type: 'image' | 'video';
  folder?: string;
  onUploadComplete: (result: UploadResult) => void;
  onUploadError?: (error: string) => void;
  currentFile?: string;
  onRemove?: () => void;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
  showPreview?: boolean;
}

interface UploadResult {
  key: string;
  url: string;
  publicUrl: string;
  size: number;
  contentType: string;
  originalName: string;
}

export default function FileUpload({
  type,
  folder,
  onUploadComplete,
  onUploadError,
  currentFile,
  onRemove,
  accept,
  maxSizeMB = type === 'image' ? 10 : 500,
  className = "",
  showPreview = true
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showRetry, setShowRetry] = useState(false);
  const [lastError, setLastError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastFileRef = useRef<File | null>(null);
  const MAX_RETRIES = 3;

  const defaultAccept = type === 'image' 
    ? 'image/jpeg,image/png,image/gif,image/webp'
    : 'video/mp4,video/webm,video/avi,video/mov';

  const handleFileSelect = (file: File) => {
    if (!file) return;

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const error = `File too large. Maximum size: ${maxSizeMB}MB`;
      onUploadError?.(error);
      toast.error('File Too Large', {
        description: error
      });
      return;
    }

    // Store file for potential retry
    lastFileRef.current = file;
    setRetryCount(0);
    setShowRetry(false);
    uploadFile(file);
  };

  const handleRetry = () => {
    if (lastFileRef.current && retryCount < MAX_RETRIES) {
      setRetryCount(prev => prev + 1);
      setShowRetry(false);
      uploadFile(lastFileRef.current);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    setUploadedBytes(0);
    setTotalBytes(file.size);
    setLastError('');
    
    try {
      // Step 1: Get presigned URL from our API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const presignedResponse = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          folder: folder
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!presignedResponse.ok) {
        const errorData = await presignedResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get upload URL');
      }

      const { presignedUrl, key, publicUrl } = await presignedResponse.json();

      // Step 2: Upload directly to R2 using presigned URL
      const xhr = new XMLHttpRequest();

      // Set timeout for upload
      xhr.timeout = 300000; // 5 minutes

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percentComplete);
          setUploadedBytes(e.loaded);
          setTotalBytes(e.total);
          
          if (percentComplete === 100) {
            setProcessing(true);
          }
        }
      });

      // Handle completion
      const uploadPromise = new Promise<void>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload. Please check your connection.'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload cancelled'));
        });

        xhr.addEventListener('timeout', () => {
          reject(new Error('Upload timed out. Please try again.'));
        });
      });

      // Upload directly to R2
      xhr.open('PUT', presignedUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);

      await uploadPromise;

      // Upload successful
      setProcessing(false);
      setShowRetry(false);
      setRetryCount(0);
      lastFileRef.current = null;
      
      const result: UploadResult = {
        key,
        url: publicUrl,
        publicUrl,
        size: file.size,
        contentType: file.type,
        originalName: file.name
      };

      onUploadComplete(result);
      toast.success('Upload Complete!', {
        description: `${file.name} uploaded successfully`
      });

    } catch (error) {
      console.error('Upload error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Upload failed';
      setLastError(errorMsg);
      
      // Show retry option if we haven't exceeded max retries
      if (retryCount < MAX_RETRIES) {
        setShowRetry(true);
        toast.error('Upload Failed', {
          description: `${errorMsg}. Click retry to try again.`,
          action: {
            label: 'Retry',
            onClick: handleRetry
          }
        });
      } else {
        toast.error('Upload Failed', {
          description: `${errorMsg}. Maximum retry attempts reached.`
        });
      }
      
      onUploadError?.(errorMsg);
    } finally {
      setUploading(false);
      setProcessing(false);
      setTimeout(() => {
        if (!showRetry) {
          setUploadProgress(0);
          setUploadedBytes(0);
          setTotalBytes(0);
        }
      }, 1000);
    }
  };

  // Helper function to format bytes
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current File Display */}
      {currentFile && (
        <div className="relative">
          {type === 'image' ? (
            <div className="relative">
              <img
                src={currentFile}
                alt="Current file"
                className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
              />
              {onRemove && (
                <button
                  type="button"
                  onClick={onRemove}
                  className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  <TrashBinIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {showPreview && (
                <video
                  src={currentFile}
                  controls
                  className="w-full h-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-black"
                >
                  Your browser does not support the video tag.
                </video>
              )}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center dark:bg-blue-900">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Video file uploaded</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <a href={currentFile} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View full video
                      </a>
                    </p>
                  </div>
                </div>
                {onRemove && (
                  <button
                    type="button"
                    onClick={onRemove}
                    className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <TrashBinIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragOver
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
            : showRetry
            ? 'border-red-300 dark:border-red-600'
            : 'border-gray-300 dark:border-gray-600'
        } ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-gray-400'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={!showRetry ? handleClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept || defaultAccept}
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="text-center">
          {showRetry ? (
            <div className="space-y-3">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto dark:bg-red-900/30">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-900 dark:text-red-300">
                  Upload Failed
                </p>
                <p className="text-xs text-red-700 dark:text-red-400">
                  {lastError}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Attempt {retryCount} of {MAX_RETRIES}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRetry();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retry Upload
              </button>
            </div>
          ) : uploading || processing ? (
            <div className="space-y-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto dark:bg-blue-900/30">
                {processing ? (
                  <div className="w-6 h-6 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin dark:border-blue-800 dark:border-t-blue-400"></div>
                ) : (
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {processing ? 'Processing...' : 'Uploading...'}
                  </p>
                  <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {uploadProgress}%
                  </p>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                    style={{ width: `${uploadProgress}%` }}
                  >
                    {/* Animated shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                  </div>
                </div>
                {totalBytes > 0 && !processing && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatBytes(uploadedBytes)} / {formatBytes(totalBytes)}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {processing 
                    ? 'Saving to storage...' 
                    : 'Please wait while your file is being uploaded'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto dark:bg-gray-800">
                <PlusIcon className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {currentFile ? `Replace ${type}` : `Upload ${type}`}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Drag and drop or click to select
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Max size: {maxSizeMB}MB
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}