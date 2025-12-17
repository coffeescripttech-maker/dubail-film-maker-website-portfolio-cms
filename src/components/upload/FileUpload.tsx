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
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    toast.loading('Uploading...', {
      description: `Uploading ${file.name}`,
      id: 'file-upload'
    });

    uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      if (folder) formData.append('folder', folder);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        onUploadComplete(result.file);
        toast.success('Upload Complete!', {
          description: `${file.name} has been uploaded successfully.`
        });
      } else {
        const errorMsg = result.error || 'Upload failed';
        onUploadError?.(errorMsg);
        toast.error('Upload Failed', {
          description: errorMsg
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMsg = 'Upload failed';
      onUploadError?.(errorMsg);
      toast.error('Upload Error', {
        description: errorMsg,
        id: 'file-upload'
      });
    } finally {
      setUploading(false);
      toast.dismiss('file-upload');
    }
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
            : 'border-gray-300 dark:border-gray-600'
        } ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-gray-400'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept || defaultAccept}
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="text-center">
          {uploading ? (
            <div className="space-y-2">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto dark:border-gray-700"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Uploading...</p>
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