"use client";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import RichTextEditor from "../common/RichTextEditor";

interface AboutContent {
  id: number;
  founder_name: string;
  founder_title: string;
  founder_bio: string;
  company_description: string;
  video_button_text: string;
  video_url: string;
  updated_at: string;
}

interface ValidationErrors {
  founder_name?: string;
  founder_title?: string;
  founder_bio?: string;
  company_description?: string;
  video_button_text?: string;
  video_url?: string;
}

export default function AboutSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoSource, setVideoSource] = useState<'url' | 'upload'>('url');
  const [formData, setFormData] = useState<AboutContent>({
    id: 1,
    founder_name: '',
    founder_title: '',
    founder_bio: '',
    company_description: '',
    video_button_text: '',
    video_url: '',
    updated_at: '',
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchAboutContent();
  }, []);

  const fetchAboutContent = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/about');
      
      if (!response.ok) {
        throw new Error('Failed to fetch about content');
      }

      const data = await response.json();
      setFormData(data);
      
      // Set video source based on whether there's a URL
      if (data.video_url) {
        // Check if it's an uploaded file (contains our R2 domain) or external URL
        setVideoSource(data.video_url.includes(process.env.NEXT_PUBLIC_R2_PUBLIC_URL || 'r2.dev') ? 'upload' : 'url');
      }
    } catch (error) {
      console.error('Error fetching about content:', error);
      toast.error('Failed to load about content');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }

    // Validate file size (500MB limit)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      toast.error('Video size must be less than 500MB');
      return;
    }

    try {
      setUploadingVideo(true);
      setUploadProgress(10);

      // Get presigned URL
      const presignedResponse = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          folder: 'about-videos',
        }),
      });

      if (!presignedResponse.ok) {
        const errorData = await presignedResponse.json();
        throw new Error(errorData.error || 'Failed to get upload URL');
      }

      const { presignedUrl, publicUrl } = await presignedResponse.json();
      setUploadProgress(30);

      // Upload to R2 with progress tracking
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = 30 + Math.round((e.loaded / e.total) * 60);
          setUploadProgress(percentComplete);
        }
      });

      await new Promise((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            resolve(xhr.response);
          } else {
            reject(new Error('Upload failed'));
          }
        });
        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        xhr.open('PUT', presignedUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      setUploadProgress(100);

      // Update form data with the new video URL
      setFormData({ ...formData, video_url: publicUrl });
      toast.success('Video uploaded successfully');
      
      // Reset file input
      e.target.value = '';
    } catch (error) {
      console.error('Error uploading video:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload video');
    } finally {
      setUploadingVideo(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  // Validation functions
  const validateFounderName = (value: string): string | undefined => {
    if (!value.trim()) return 'Founder name is required';
    if (value.trim().length < 2) return 'Founder name must be at least 2 characters';
    return undefined;
  };

  const validateURL = (value: string): string | undefined => {
    if (!value.trim()) return undefined; // Optional field
    try {
      new URL(value);
      return undefined;
    } catch {
      return 'Please enter a valid URL';
    }
  };

  const handleFieldChange = (field: keyof AboutContent, value: string) => {
    setFormData({ ...formData, [field]: value });
    setTouched({ ...touched, [field]: true });

    // Validate on change
    let error: string | undefined;
    if (field === 'founder_name') error = validateFounderName(value);
    if (field === 'video_url') error = validateURL(value);

    setErrors({ ...errors, [field]: error });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const founderNameError = validateFounderName(formData.founder_name);
    const videoUrlError = validateURL(formData.video_url);

    if (founderNameError || videoUrlError) {
      setErrors({
        founder_name: founderNameError,
        video_url: videoUrlError,
      });
      setTouched({
        founder_name: true,
        video_url: true,
      });
      toast.error('Please fix validation errors');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/settings/about', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save about content');
      }

      const updated = await response.json();
      setFormData(updated);
      toast.success('About content saved successfully');
    } catch (error) {
      console.error('Error saving about content:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save about content');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Founder Information */}
      <div className="rounded-lg border border-gray-200  p-6 dark:border-gray-800 dark:bg-gray-800/50">
        <h4 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
          Founder Information
        </h4>
        
        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Founder Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.founder_name}
              onChange={(e) => handleFieldChange('founder_name', e.target.value)}
              onBlur={() => setTouched({ ...touched, founder_name: true })}
              className={`w-full px-4 py-3 text-sm border rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 ${
                touched.founder_name && errors.founder_name
                  ? 'border-red-500 focus:ring-red-500'
                  : touched.founder_name && !errors.founder_name && formData.founder_name
                  ? 'border-green-500 focus:ring-green-500'
                  : 'border-gray-300 dark:border-gray-700 focus:ring-blue-500'
              }`}
              placeholder="Enter founder name"
            />
            {touched.founder_name && errors.founder_name && (
              <p className="mt-1 text-xs text-red-500">{errors.founder_name}</p>
            )}
            {touched.founder_name && !errors.founder_name && formData.founder_name && (
              <p className="mt-1 text-xs text-green-500 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Looks good!
              </p>
            )}
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Founder Title
            </label>
            <input
              type="text"
              value={formData.founder_title}
              onChange={(e) => setFormData({ ...formData, founder_title: e.target.value })}
              className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., FILM DIRECTOR / EXECUTIVE PRODUCER"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Founder Bio
            </label>
            <RichTextEditor
              value={formData.founder_bio}
              onChange={(value) => setFormData({ ...formData, founder_bio: value })}
              placeholder="Enter founder biography..."
              rows={10}
            />
          </div>
        </div>
      </div>

      {/* Company Information */}
      <div className="rounded-lg border border-gray-200  p-6 dark:border-gray-800 dark:bg-gray-800/50">
        <h4 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
          Company Information
        </h4>
        
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Company Description
          </label>
          <RichTextEditor
            value={formData.company_description}
            onChange={(value) => setFormData({ ...formData, company_description: value })}
            placeholder="Enter company description..."
            rows={8}
          />
        </div>
      </div>

      {/* Video Section */}
      <div className="rounded-lg border border-gray-200  p-6 dark:border-gray-800 dark:bg-gray-800/50">
        <h4 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
          Video Section
        </h4>
        
        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Video Button Text
            </label>
            <input
              type="text"
              value={formData.video_button_text}
              onChange={(e) => setFormData({ ...formData, video_button_text: e.target.value })}
              className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., view DubaiFilmMaker reel 2025"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Video Source
            </label>
            <div className="flex gap-4 mb-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="videoSource"
                  value="url"
                  checked={videoSource === 'url'}
                  onChange={() => setVideoSource('url')}
                  className="mr-2"
                />
                <span className="text-sm">External URL</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="videoSource"
                  value="upload"
                  checked={videoSource === 'upload'}
                  onChange={() => setVideoSource('upload')}
                  className="mr-2"
                />
                <span className="text-sm">Upload Video</span>
              </label>
            </div>

            {videoSource === 'url' ? (
              <>
                <input
                  type="url"
                  value={formData.video_url}
                  onChange={(e) => handleFieldChange('video_url', e.target.value)}
                  onBlur={() => setTouched({ ...touched, video_url: true })}
                  className={`w-full px-4 py-3 text-sm border rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 ${
                    touched.video_url && errors.video_url
                      ? 'border-red-500 focus:ring-red-500'
                      : touched.video_url && !errors.video_url && formData.video_url
                      ? 'border-green-500 focus:ring-green-500'
                      : 'border-gray-300 dark:border-gray-700 focus:ring-blue-500'
                  }`}
                  placeholder="https://example.com/video.mp4"
                />
                {touched.video_url && errors.video_url && (
                  <p className="mt-1 text-xs text-red-500">{errors.video_url}</p>
                )}
                {touched.video_url && !errors.video_url && formData.video_url && (
                  <p className="mt-1 text-xs text-green-500 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Valid URL
                  </p>
                )}
              </>
            ) : (
              <>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  disabled={uploadingVideo}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-400 dark:hover:file:bg-blue-900/30 disabled:opacity-50"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Supported formats: MP4, WebM, MOV. Max size: 500MB
                </p>
                
                {uploadingVideo && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Uploading video...</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {formData.video_url && !uploadingVideo && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-xs text-green-700 dark:text-green-400 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Video uploaded successfully
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                      {formData.video_url}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Last Updated */}
      {formData.updated_at && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Last updated: {new Date(formData.updated_at).toLocaleString()}
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-800">
        <button
          type="submit"
          disabled={saving || !!(errors.founder_name || errors.video_url)}
          className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
