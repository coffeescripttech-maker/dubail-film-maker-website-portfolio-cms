"use client";
import React, { useState, useEffect } from "react";
import { Project, Credit, VideoChapter } from "@/lib/db";
import Label from "@/components/form/Label";
import Checkbox from "@/components/form/input/Checkbox";
import FileUpload from "@/components/upload/FileUpload";
import ThumbnailManager from "@/components/projects/ThumbnailManager";
import VideoChapterMarker from "@/components/projects/VideoChapterMarker";
import { PlusIcon, TrashBinIcon } from "@/icons";
import { toast } from "sonner";

interface ProjectFormProps {
  project?: Project | null;
  onSubmit: (data: Partial<Project>) => void;
  onCancel: () => void;
  existingProjects?: Project[];
}

export default function ProjectForm({ project, onSubmit, onCancel, existingProjects = [] }: ProjectFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    client: '',
    client_short: '',
    category: '',
    data_cat: '',
    languages: '',
    classification: '',
    vimeo_id: '',
    video_url: '',
    video_thumbnail_url: '',
    poster_image: '',
    poster_image_srcset: '',
    thumbnail_url: '',
    order_index: 0,
    is_featured: false,
    is_published: true
  });

  const [credits, setCredits] = useState<Credit[]>([
    { role: '', name: '' }
  ]);

  const [chapters, setChapters] = useState<VideoChapter[]>([]);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [orderIndexWarning, setOrderIndexWarning] = useState<string>('');
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'basic' | 'media' | 'credits' | 'chapters'>('basic');

  // Get next available order index
  const getNextAvailableOrderIndex = (): number => {
    if (existingProjects.length === 0) return 0;
    
    const usedIndices = existingProjects
      .filter(p => p.id !== project?.id) // Exclude current project when editing
      .map(p => p.order_index)
      .sort((a, b) => a - b);
    
    // Find the first gap or return max + 1
    for (let i = 0; i < usedIndices.length; i++) {
      if (usedIndices[i] !== i) {
        return i;
      }
    }
    return usedIndices.length;
  };

  // Check if order index is already used
  const isOrderIndexDuplicate = (index: number): boolean => {
    return existingProjects.some(p => 
      p.order_index === index && p.id !== project?.id
    );
  };

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || '',
        client: project.client || '',
        client_short: project.client_short || '',
        category: project.category || '',
        data_cat: project.data_cat || '',
        languages: project.languages || '',
        classification: project.classification || '',
        vimeo_id: project.vimeo_id || '',
        video_url: project.video_url || '',
        video_thumbnail_url: project.video_thumbnail_url || '',
        poster_image: project.poster_image || '',
        poster_image_srcset: project.poster_image_srcset || '',
        thumbnail_url: project.thumbnail_url || '',
        order_index: project.order_index || 0,
        is_featured: project.is_featured || false,
        is_published: project.is_published !== undefined ? project.is_published : true
      });
      setCredits(project.credits && project.credits.length > 0 ? project.credits : [{ role: '', name: '' }]);
      setChapters(project.chapters && project.chapters.length > 0 ? project.chapters : []);
    }
  }, [project]);

  // Classification to Category mapping - matches website filters
  const classificationMapping: Record<string, { category: string; data_cat: string }> = {
    'TVC': { 
      category: 'Television Commercial', 
      data_cat: 'TVC' 
    },
    'narrative': { 
      category: 'Narrative Films', 
      data_cat: 'narrative' 
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClassificationChange = (classification: string) => {
    const mapping = classificationMapping[classification];
    
    if (mapping) {
      setFormData(prev => ({
        ...prev,
        classification,
        category: mapping.category,
        data_cat: mapping.data_cat
      }));
      
      toast.success('Auto-filled', {
        description: `Category set to: ${mapping.category}`
      });
    } else {
      handleInputChange('classification', classification);
    }
  };

  const handleCreditChange = (index: number, field: 'role' | 'name', value: string) => {
    const newCredits = [...credits];
    newCredits[index][field] = value;
    setCredits(newCredits);
  };

  const addCredit = () => {
    setCredits([...credits, { role: '', name: '' }]);
  };

  const removeCredit = (index: number) => {
    if (credits.length > 1) {
      setCredits(credits.filter((_, i) => i !== index));
    }
  };

  // Chapter/Moments handlers
  const handleChapterChange = (index: number, field: 'timestamp' | 'label' | 'endTime', value: string) => {
    const newChapters = [...chapters];
    if (field === 'endTime') {
      newChapters[index].endTime = value;
      newChapters[index].type = value ? 'range' : 'moment';
    } else {
      newChapters[index][field] = value;
    }
    setChapters(newChapters);
  };

  const addChapter = () => {
    setChapters([...chapters, { timestamp: '', label: '', type: 'moment' }]);
  };

  const removeChapter = (index: number) => {
    setChapters(chapters.filter((_, i) => i !== index));
  };

  const validateTimestamp = (timestamp: string): boolean => {
    // Validates formats: 0:15, 1:02, 1:02:30
    const timeRegex = /^(\d+:)?[0-5]?\d:[0-5]\d$/;
    return timeRegex.test(timestamp);
  };

  const generateVideoUrl = (vimeoId: string) => {
    if (vimeoId) {
      return `https://player.vimeo.com/video/${vimeoId}`;
    }
    return '';
  };

  const handleVimeoIdChange = (vimeoId: string) => {
    handleInputChange('vimeo_id', vimeoId);
    handleInputChange('video_url', generateVideoUrl(vimeoId));
  };

  // Individual field validators for inline validation
  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'title':
        if (!value || !value.trim()) return 'Project title is required';
        if (value.length < 3) return 'Title must be at least 3 characters';
        if (value.length > 200) return 'Title must be less than 200 characters';
        return '';
      
      case 'client':
        if (!value || !value.trim()) return 'Client name is required';
        if (value.length < 2) return 'Client name must be at least 2 characters';
        return '';
      
      case 'classification':
        if (!value) return 'Project type is required';
        return '';
      
      case 'languages':
        if (!value) return 'Language selection is required';
        return '';
      
      case 'order_index':
        if (value < 0) return 'Order index cannot be negative';
        if (value > 9999) return 'Order index must be less than 10000';
        if (isOrderIndexDuplicate(value)) {
          const nextAvailable = getNextAvailableOrderIndex();
          return `Index ${value} is already used. Try ${nextAvailable}`;
        }
        return '';
      
      case 'poster_image':
        if (!value || !value.trim()) return 'Poster image is required';
        return '';
      
      case 'video':
        if (!formData.vimeo_id && !formData.video_url) {
          return 'Please upload a video or provide a Vimeo ID';
        }
        return '';
      
      case 'vimeo_id':
        if (value && !/^\d+$/.test(value)) {
          return 'Vimeo ID must contain only numbers';
        }
        return '';
      
      default:
        return '';
    }
  };

  const handleFieldBlur = (field: string, value: any) => {
    const error = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate all required fields
    const fieldsToValidate = [
      'title',
      'client',
      'classification',
      'languages',
      'order_index',
      'poster_image',
      'video'
    ];

    fieldsToValidate.forEach(field => {
      const value = field === 'video' ? null : formData[field as keyof typeof formData];
      const error = validateField(field, value);
      if (error) {
        newErrors[field] = error;
      }
    });

    // Credits are optional - no validation needed

    setErrors(newErrors);

    // Show toast for first error
    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      toast.error('Validation Error', {
        description: firstError
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Filter out empty credits
      const validCredits = credits.filter(credit => credit.role.trim() && credit.name.trim());

      // Filter out empty chapters and validate timestamps
      const validChapters = chapters.filter(chapter => {
        if (!chapter.timestamp.trim() || !chapter.label.trim()) return false;
        if (!validateTimestamp(chapter.timestamp)) {
          toast.error('Invalid Timestamp', {
            description: `"${chapter.timestamp}" is not a valid timestamp. Use format: 0:15 or 1:02:30`
          });
          return false;
        }
        return true;
      });

      const submitData = {
        ...formData,
        credits: validCredits,
        chapters: validChapters.length > 0 ? validChapters : null,
        order_index: Number(formData.order_index),
        thumbnail_url: formData.thumbnail_url || null
      };

      console.log('📤 Submitting project data:', submitData);
      console.log('🎬 video_thumbnail_url in submitData:', submitData.video_thumbnail_url);

      await onSubmit(submitData);
      
      toast.success(project ? 'Project Updated!' : 'Project Created!', {
        description: `${formData.title} has been ${project ? 'updated' : 'created'} successfully.`
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to save project'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              activeTab === 'basic'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            📝 Basic Info
            {(errors.title || errors.client || errors.classification) && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">!</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              activeTab === 'media'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            🎬 Media & Thumbnails
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('credits')}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              activeTab === 'credits'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            👥 Credits
            <span className="ml-2 text-xs text-gray-400">({credits.filter(c => c.role && c.name).length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chapters')}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              activeTab === 'chapters'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            ✂️ Video Moments
            <span className="ml-2 text-xs text-gray-400">({chapters.length})</span>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'basic' && (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Title */}
        <div className="md:col-span-2">
          <Label>
            Project Title <span className="text-red-500">*</span>
          </Label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => {
              const value = e.target.value;
              handleInputChange('title', value);
              setTouched({ ...touched, title: true });
              const error = validateField('title', value);
              setErrors(prev => ({ ...prev, title: error }));
            }}
            onBlur={() => setTouched({ ...touched, title: true })}
            placeholder="Enter project title"
          
            className={`h-11 w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${
              touched.title && errors.title 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' 
                : touched.title && !errors.title && formData.title
                ? 'border-green-500 focus:border-green-500 focus:ring-green-500/10'
                : 'border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800'
            }`}
          />
          {touched.title && errors.title && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.title}</p>
          )}
          {touched.title && !errors.title && formData.title && (
            <p className="mt-1 text-xs text-green-500 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Looks good!
            </p>
          )}
        </div>

        {/* Client */}
        <div>
          <Label>
            Client <span className="text-red-500">*</span>
          </Label>
          <input
            type="text"
            value={formData.client}
            onChange={(e) => {
              const value = e.target.value;
              handleInputChange('client', value);
              setTouched({ ...touched, client: true });
              const error = validateField('client', value);
              setErrors(prev => ({ ...prev, client: error }));
            }}
            onBlur={() => setTouched({ ...touched, client: true })}
            placeholder="Enter client name"
            
            className={`h-11 w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${
              touched.client && errors.client 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' 
                : touched.client && !errors.client && formData.client
                ? 'border-green-500 focus:border-green-500 focus:ring-green-500/10'
                : 'border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800'
            }`}
          />
          {touched.client && errors.client && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.client}</p>
          )}
          {touched.client && !errors.client && formData.client && (
            <p className="mt-1 text-xs text-green-500 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Looks good!
            </p>
          )}
        </div>

        {/* Client Short Name (Optional) */}
        <div>
          <Label>
            Client Name (Short) <span className="text-gray-400 text-xs">(Optional)</span>
          </Label>
          <input
            type="text"
            value={formData.client_short}
            onChange={(e) => handleInputChange('client_short', e.target.value)}
            placeholder="e.g., SHUROOQ (leave empty to use full name)"
            className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:border-gray-700 dark:focus:border-brand-800"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Abbreviated client name for display. If empty, full client name will be used.
          </p>
          {formData.client_short && (
            <p className="mt-1 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Will display as: "{formData.client_short}"
            </p>
          )}
        </div>

        {/* Classification - Main field that auto-populates others */}
        <div>
          <Label>
            Project Type <span className="text-red-500">*</span>
          </Label>
          <select
            value={formData.classification}
            onChange={(e) => {
              const value = e.target.value;
              handleClassificationChange(value);
              setTouched({ ...touched, classification: true });
              const error = validateField('classification', value);
              setErrors(prev => ({ ...prev, classification: error }));
            }}
            onBlur={() => setTouched({ ...touched, classification: true })}
            
            className={`h-11 w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 ${
              touched.classification && errors.classification 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' 
                : touched.classification && !errors.classification && formData.classification
                ? 'border-green-500 focus:border-green-500 focus:ring-green-500/10'
                : 'border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800'
            }`}
          >
            <option value="">Select Project Type</option>
            <option value="TVC">TVC / Brand Films</option>
            <option value="narrative">Narrative Films</option>

          </select>
          {touched.classification && errors.classification && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.classification}</p>
          )}
          {touched.classification && !errors.classification && formData.classification && (
            <p className="mt-1 text-xs text-green-500 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Looks good! Category: {formData.category}
            </p>
          )}
        </div>

        {/* Languages */}
        <div>
          <Label>
            Languages <span className="text-red-500">*</span>
          </Label>
          <select
            value={formData.languages}
            onChange={(e) => {
              const value = e.target.value;
              handleInputChange('languages', value);
              setTouched({ ...touched, languages: true });
              const error = validateField('languages', value);
              setErrors(prev => ({ ...prev, languages: error }));
            }}
            onBlur={() => setTouched({ ...touched, languages: true })}
            
            className={`h-11 w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 ${
              touched.languages && errors.languages 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' 
                : touched.languages && !errors.languages && formData.languages
                ? 'border-green-500 focus:border-green-500 focus:ring-green-500/10'
                : 'border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800'
            }`}
          >
            <option value="">Select Languages</option>
            <option value="Arabic & English">Arabic & English</option>
            <option value="Arabic only">Arabic only</option>
            <option value="English only">English only</option>
            <option value="—">Not specified</option>
          </select>
          {touched.languages && errors.languages && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.languages}</p>
          )}
          {touched.languages && !errors.languages && formData.languages && (
            <p className="mt-1 text-xs text-green-500 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Looks good!
            </p>
          )}
        </div>

        {/* Order Index */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Order Index</Label>
            <button
              type="button"
              onClick={() => {
                const nextIndex = getNextAvailableOrderIndex();
                handleInputChange('order_index', nextIndex);
                setOrderIndexWarning('');
                if (errors.order_index) setErrors(prev => ({ ...prev, order_index: '' }));
                toast.success('Auto-filled', {
                  description: `Set to next available index: ${nextIndex}`
                });
              }}
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Use next available
            </button>
          </div>
          <input
            type="number"
            value={formData.order_index}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 0;
              const clampedValue = Math.max(0, Math.min(9999, value));
              handleInputChange('order_index', clampedValue);
              setTouched({ ...touched, order_index: true });
              
              // Check for duplicates
              if (isOrderIndexDuplicate(clampedValue)) {
                const nextAvailable = getNextAvailableOrderIndex();
                setOrderIndexWarning(`This index is already used. Next available: ${nextAvailable}`);
              } else {
                setOrderIndexWarning('');
              }
              
              const error = validateField('order_index', clampedValue);
              setErrors(prev => ({ ...prev, order_index: error }));
            }}
            onBlur={() => {
              setTouched({ ...touched, order_index: true });
              // Show toast warning on blur if duplicate
              if (isOrderIndexDuplicate(formData.order_index)) {
                const nextAvailable = getNextAvailableOrderIndex();
                toast.warning('Duplicate Order Index', {
                  description: `Index ${formData.order_index} is already used. Consider using ${nextAvailable}.`,
                  action: {
                    label: 'Use ' + nextAvailable,
                    onClick: () => {
                      handleInputChange('order_index', nextAvailable);
                      setOrderIndexWarning('');
                    }
                  }
                });
              }
            }}
            placeholder="0"
            min="0"
            max="9999"
            className={`h-11 w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${
              touched.order_index && (errors.order_index || orderIndexWarning)
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' 
                : touched.order_index && !errors.order_index && !orderIndexWarning && formData.order_index !== undefined
                ? 'border-green-500 focus:border-green-500 focus:ring-green-500/10'
                : 'border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800'
            }`}
          />
          {touched.order_index && errors.order_index && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.order_index}</p>
          )}
          {touched.order_index && orderIndexWarning && !errors.order_index && (
            <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">
              ⚠️ {orderIndexWarning}
            </p>
          )}
          {touched.order_index && !errors.order_index && !orderIndexWarning && formData.order_index !== undefined && (
            <p className="mt-1 text-xs text-green-500 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Looks good!
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Lower numbers appear first (0-9999). {existingProjects.length > 0 && `${existingProjects.filter(p => p.id !== project?.id).length} projects exist.`}
          </p>
        </div>
      </div>
      )}

      {/* Media & Thumbnails Tab */}
      {activeTab === 'media' && (
      <div className="space-y-6">
        {/* Video Source Selection */}
        <div>
          <Label>Video Source</Label>
          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="videoSource"
                value="r2"
                checked={!formData.vimeo_id || formData.video_url.includes(process.env.NEXT_PUBLIC_R2_PUBLIC_URL || 'r2.dev')}
                onChange={() => {
                  handleInputChange('vimeo_id', '');
                }}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm font-medium">Upload Video to R2</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="videoSource"
                value="vimeo"
                checked={!!formData.vimeo_id}
                onChange={() => {
                  // Clear R2 video if switching to Vimeo
                  if (formData.video_url.includes('r2.dev') || formData.video_url.includes('r2.cloudflarestorage.com')) {
                    handleInputChange('video_url', '');
                  }
                }}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm font-medium">Use Vimeo</span>
            </label>
          </div>
        </div>

        {/* R2 Video Upload */}
        {(!formData.vimeo_id || formData.video_url.includes('r2.dev')) && (
          <div className="md:col-span-2">
            <Label>
              Upload Video File <span className="text-red-500">*</span>
            </Label>
            <div className={`${errors.video ? 'ring-1 ring-red-500 rounded-lg p-1' : ''}`}>
              <FileUpload
                type="video"
                folder="projects/videos"
                maxSizeMB={1500}
                currentFile={formData.video_url}
                onUploadComplete={(result) => {
                  handleInputChange('video_url', result.publicUrl);
                  handleInputChange('vimeo_id', ''); // Clear Vimeo ID when using R2
                  setTouched({ ...touched, video: true });
                  if (errors.video) setErrors(prev => ({ ...prev, video: '' }));
                }}
                onUploadError={(error) => {
                  setTouched({ ...touched, video: true });
                  setErrors(prev => ({ ...prev, video: error }));
                }}
                onRemove={() => {
                  handleInputChange('video_url', '');
                  setTouched({ ...touched, video: true });
                  setErrors(prev => ({ ...prev, video: 'Video is required' }));
                }}
              />
            </div>
            {errors.video && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                ❌ {errors.video}
              </p>
            )}
            {!errors.video && formData.video_url && (
              <p className="mt-2 text-xs text-green-500 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Video uploaded successfully
              </p>
            )}
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Supported formats: MP4, WebM, MOV. Max size: 800MB. Videos will be stored in R2.
            </p>
          </div>
        )}

        {/* Vimeo Fields */}
        {formData.vimeo_id && (
          <>
            <div>
              <Label>Vimeo ID</Label>
              <input
                type="text"
                value={formData.vimeo_id}
                onChange={(e) => {
                  const value = e.target.value;
                  handleVimeoIdChange(value);
                  setTouched({ ...touched, vimeo_id: true });
                  const error = validateField('vimeo_id', value);
                  setErrors(prev => ({ ...prev, vimeo_id: error }));
                }}
                onBlur={() => setTouched({ ...touched, vimeo_id: true })}
                placeholder="e.g., 414307456"
                className={`h-11 w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${
                  touched.vimeo_id && errors.vimeo_id 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' 
                    : touched.vimeo_id && !errors.vimeo_id && formData.vimeo_id
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500/10'
                    : 'border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800'
                }`}
              />
              {touched.vimeo_id && errors.vimeo_id && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.vimeo_id}</p>
              )}
              {touched.vimeo_id && !errors.vimeo_id && formData.vimeo_id && (
                <p className="mt-1 text-xs text-green-500 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Valid Vimeo ID
                </p>
              )}
            </div>

            <div>
              <Label>Video URL (Auto-generated)</Label>
              <input
                type="url"
                value={formData.video_url}
                onChange={(e) => handleInputChange('video_url', e.target.value)}
                placeholder="https://player.vimeo.com/video/..."
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>
          </>
        )}

        {/* Thumbnail Management Section */}
        {project?.id && formData.video_url && (
          <div className="md:col-span-2">
            <Label>Thumbnail Management</Label>
            <div className="mt-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <ThumbnailManager
                projectId={project.id}
                currentThumbnail={formData.thumbnail_url}
                videoUrl={formData.video_url}
                onThumbnailChange={(thumbnailUrl) => {
                  handleInputChange('thumbnail_url', thumbnailUrl);
                  handleInputChange('poster_image', thumbnailUrl); // Also update poster_image
                  toast.success('Thumbnail Updated', {
                    description: 'The thumbnail has been updated successfully.'
                  });
                }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Upload a custom thumbnail or generate one from your video. This will be used as the preview image on the portfolio.
            </p>
          </div>
        )}

        {/* Thumbnail Note for New Projects */}
        {!project?.id && formData.video_url && (
          <div className="md:col-span-2">
            <div className="p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                ℹ️ <strong>Thumbnail Management:</strong> After creating this project, you'll be able to upload custom thumbnails or generate them from your video.
              </p>
            </div>
          </div>
        )}

        {/* Poster Image Upload */}
        <div className="md:col-span-2">
          <Label>
            Poster Image <span className="text-red-500">*</span>
          </Label>
          <div className={`${errors.poster_image ? 'ring-1 ring-red-500 rounded-lg p-1' : ''}`}>
            <FileUpload
              type="image"
              folder="projects/posters"
              currentFile={formData.poster_image}
              onUploadComplete={(result) => {
                handleInputChange('poster_image', result.publicUrl);
                // Generate responsive srcset
                const srcset = `${result.publicUrl} 300w, ${result.publicUrl} 600w, ${result.publicUrl} 900w, ${result.publicUrl} 1200w`;
                handleInputChange('poster_image_srcset', srcset);
                setTouched({ ...touched, poster_image: true });
                if (errors.poster_image) setErrors(prev => ({ ...prev, poster_image: '' }));
              }}
              onUploadError={(error) => {
                setTouched({ ...touched, poster_image: true });
                setErrors(prev => ({ ...prev, poster_image: error }));
              }}
              onRemove={() => {
                handleInputChange('poster_image', '');
                handleInputChange('poster_image_srcset', '');
                setTouched({ ...touched, poster_image: true });
                setErrors(prev => ({ ...prev, poster_image: 'Poster image is required' }));
              }}
            />
          </div>
          {errors.poster_image && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
              ❌ {errors.poster_image}
            </p>
          )}
          {!errors.poster_image && formData.poster_image && (
            <p className="mt-2 text-xs text-green-500 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Poster image uploaded successfully
            </p>
          )}
        </div>

        {/* Manual URL Input (Alternative) */}
        <div className="md:col-span-2">
          <Label>Or enter image URL manually</Label>
          <input
            type="url"
            value={formData.poster_image}
            onChange={(e) => {
              const value = e.target.value;
              handleInputChange('poster_image', value);
              setTouched({ ...touched, poster_image: true });
              const error = validateField('poster_image', value);
              setErrors(prev => ({ ...prev, poster_image: error }));
            }}
            onBlur={() => setTouched({ ...touched, poster_image: true })}
            placeholder="https://example.com/image.jpg"
            className={`h-11 w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${
              touched.poster_image && errors.poster_image 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' 
                : touched.poster_image && !errors.poster_image && formData.poster_image
                ? 'border-green-500 focus:border-green-500 focus:ring-green-500/10'
                : 'border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800'
            }`}
          />
        </div>
      </div>
      )}

      {/* Credits Tab */}
      {activeTab === 'credits' && (
      <div className="space-y-6">
      {/* Credits Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Label>
            Credits <span className="text-gray-400 text-xs">(Optional)</span>
          </Label>
          <button
            type="button"
            onClick={addCredit}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <PlusIcon className="w-4 h-4" />
            Add Credit
          </button>
        </div>
        
        <div className="space-y-3">
          {credits.map((credit, index) => {
            const isComplete = credit.role.trim() && credit.name.trim();
            const isEmpty = !credit.role.trim() && !credit.name.trim();
            const isPartial = (credit.role.trim() && !credit.name.trim()) || (!credit.role.trim() && credit.name.trim());
            
            return (
              <div key={index} className="flex gap-3 items-end">
                <div className="flex-1">
                  <input
                    type="text"
                    value={credit.role}
                    onChange={(e) => {
                      handleCreditChange(index, 'role', e.target.value);
                    }}
                    placeholder="Role (e.g., Director, Producer)"
                    className={`h-11 w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${
                      isPartial && !credit.role.trim()
                        ? 'border-orange-500 focus:border-orange-500 focus:ring-orange-500/10'
                        : 'border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={credit.name}
                    onChange={(e) => {
                      handleCreditChange(index, 'name', e.target.value);
                    }}
                    placeholder="Name"
                    className={`h-11 w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${
                      isPartial && !credit.name.trim()
                        ? 'border-orange-500 focus:border-orange-500 focus:ring-orange-500/10'
                        : 'border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800'
                    }`}
                  />
                </div>
                <div className="flex items-center gap-2">
                  {isComplete && (
                    <span className="text-green-600 dark:text-green-400 text-sm">✓</span>
                  )}
                  {credits.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCredit(index)}
                      className="inline-flex items-center justify-center w-11 h-11 text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      <TrashBinIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {credits.some(c => c.role.trim() && c.name.trim()) && (
          <p className="mt-3 text-xs text-green-600 dark:text-green-400">
            ✓ {credits.filter(c => c.role.trim() && c.name.trim()).length} credit(s) added
          </p>
        )}
        
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          Add team members who worked on this project (optional).
        </p>
      </div>
      </div>
      )}

      {/* Video Chapters Tab */}
      {activeTab === 'chapters' && (
      <div className="space-y-6">
      {/* Video Chapters/Moments Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          {/* <div>
            <Label>
              Video Chapters <span className="text-gray-400 text-xs">(Optional)</span>
            </Label>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Mark important moments in your video (e.g., 0:15 → Intro, 1:02 → Key scene)
            </p>
          </div>
          <button
            type="button"
            onClick={addChapter}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            <PlusIcon className="w-4 h-4" />
            Add Chapter
          </button> */}
        </div>

        {/* Video Chapter Marker with FFmpeg Export */}
        {formData.video_url && (
          <VideoChapterMarker
            videoUrl={formData.video_url}
            currentThumbnailUrl={formData.video_thumbnail_url}
            chapters={chapters}
            onChaptersChange={setChapters}
            projectId={project?.id}
            onThumbnailClipUpdate={(url) => {
              console.log('🎬 Thumbnail clip URL received:', url);
              setFormData(prev => {
                const updated = { ...prev, video_thumbnail_url: url };
                console.log('📝 Form data updated:', updated);
                return updated;
              });
              toast.success('Thumbnail clip saved!', {
                description: 'Video thumbnail URL updated. Click "Update Project" to save.'
              });
            }}
          />
        )}
        
        {chapters.length > 0 && (
          <div className="space-y-3">
            {chapters.map((chapter, index) => {
              const isComplete = chapter.timestamp.trim() && chapter.label.trim();
              const isEmpty = !chapter.timestamp.trim() && !chapter.label.trim();
              const isPartial = (chapter.timestamp.trim() && !chapter.label.trim()) || (!chapter.timestamp.trim() && chapter.label.trim());
              const isValidTimestamp = chapter.timestamp.trim() ? validateTimestamp(chapter.timestamp) : true;
              const isValidEndTime = chapter.endTime ? validateTimestamp(chapter.endTime) : true;
              const isRange = chapter.type === 'range' || !!chapter.endTime;
              
              return (
                <div key={index} className="flex gap-3 items-end">
                  <div className={isRange ? "w-28" : "w-32"}>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                      {isRange ? 'Start' : 'Time'}
                    </label>
                    <input
                      type="text"
                      value={chapter.timestamp}
                      onChange={(e) => {
                        handleChapterChange(index, 'timestamp', e.target.value);
                      }}
                      placeholder="1:30"
                      className={`h-11 w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${
                        !isValidTimestamp
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
                          : isPartial && !chapter.timestamp.trim()
                          ? 'border-orange-500 focus:border-orange-500 focus:ring-orange-500/10'
                          : 'border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800'
                      }`}
                    />
                    {!isValidTimestamp && chapter.timestamp.trim() && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">Invalid</p>
                    )}
                  </div>
                  
                  {isRange && (
                    <div className="w-28">
                      <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">End</label>
                      <input
                        type="text"
                        value={chapter.endTime || ''}
                        onChange={(e) => {
                          handleChapterChange(index, 'endTime', e.target.value);
                        }}
                        placeholder="2:00"
                        className={`h-11 w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${
                          !isValidEndTime
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
                            : 'border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800'
                        }`}
                      />
                      {!isValidEndTime && chapter.endTime && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">Invalid</p>
                      )}
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <input
                      type="text"
                      value={chapter.label}
                      onChange={(e) => {
                        handleChapterChange(index, 'label', e.target.value);
                      }}
                      placeholder={isRange ? "Clip label (e.g., Action sequence)" : "Moment label (e.g., Intro)"}
                      className={`h-11 w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${
                        isPartial && !chapter.label.trim()
                          ? 'border-orange-500 focus:border-orange-500 focus:ring-orange-500/10'
                          : 'border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800'
                      }`}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    {isComplete && isValidTimestamp && (
                      <button
                        type="button"
                        onClick={() => {
                          const video = document.getElementById('chapter-video-preview') as HTMLVideoElement;
                          if (video && chapter.timestamp) {
                            const parts = chapter.timestamp.split(':').map(Number);
                            let seconds = 0;
                            if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
                            if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
                            video.currentTime = seconds;
                            video.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            toast.success('Jumped to ' + (isRange ? 'range start' : 'moment'), {
                              description: `Playing from ${chapter.timestamp}`
                            });
                          }
                        }}
                        className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                        title="Jump to this moment in video"
                      >
                        ▶️
                      </button>
                    )}
                    {isComplete && isValidTimestamp && (
                      <span className="text-green-600 dark:text-green-400 text-sm" title={isRange ? "Range/Clip" : "Moment"}>
                        {isRange ? '📍' : '⭐'}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeChapter(index)}
                      className="inline-flex items-center justify-center w-11 h-11 text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      <TrashBinIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {chapters.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              No chapters added yet
            </p>
            <button
              type="button"
              onClick={addChapter}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
            >
              <PlusIcon className="w-4 h-4" />
              Add your first chapter
            </button>
          </div>
        )}
        
        {chapters.filter(c => c.timestamp.trim() && c.label.trim() && validateTimestamp(c.timestamp)).length > 0 && (
          <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-xs font-medium text-purple-900 dark:text-purple-100 mb-2">
              ⭐ Preview Chapters ({chapters.filter(c => c.timestamp.trim() && c.label.trim() && validateTimestamp(c.timestamp)).length})
            </p>
            <div className="space-y-1">
              {chapters
                .filter(c => c.timestamp.trim() && c.label.trim() && validateTimestamp(c.timestamp))
                .sort((a, b) => {
                  // Sort by timestamp
                  const timeToSeconds = (time: string) => {
                    const parts = time.split(':').map(Number);
                    if (parts.length === 2) return parts[0] * 60 + parts[1];
                    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
                    return 0;
                  };
                  return timeToSeconds(a.timestamp) - timeToSeconds(b.timestamp);
                })
                .map((chapter, idx) => (
                  <p key={idx} className="text-xs text-purple-700 dark:text-purple-300">
                    {chapter.timestamp} → {chapter.label}
                  </p>
                ))}
            </div>
          </div>
        )}
        
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          Format: 0:15 (15 seconds), 1:02 (1 minute 2 seconds), or 1:02:30 (1 hour 2 minutes 30 seconds)
        </p>
      </div>
      </div>
      )}

      {/* Checkboxes - Always visible */}
      <div className="flex gap-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={formData.is_featured}
            onChange={(checked) => handleInputChange('is_featured', checked)}
          />
          <Label>Featured Project</Label>
        </div>
        
        <div className="flex items-center gap-3">
          <Checkbox
            checked={formData.is_published}
            onChange={(checked) => handleInputChange('is_published', checked)}
          />
          <Label>Published</Label>
        </div>
      </div>

      {/* Form Actions - Always visible */}
      <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 sm:flex-none px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : project ? 'Update Project' : 'Create Project'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 sm:flex-none px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}