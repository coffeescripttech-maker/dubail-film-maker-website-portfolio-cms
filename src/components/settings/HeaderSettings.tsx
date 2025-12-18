"use client";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";

interface HeaderConfig {
  id: number;
  active_preset: string;
  config_json: string;
  logo_default: string | null;
  logo_reversed: string | null;
  logo_stacked: string | null;
  updated_at: string;
}

const PRESETS = [
  {
    value: 'default',
    label: 'Default Layout',
    description: 'Logo left, menu right - optimized for horizontal logo',
    logoKey: 'logo_default' as const
  },
  {
    value: 'reversed',
    label: 'Reversed Layout',
    description: 'Logo right, menu left - comprehensive layout',
    logoKey: 'logo_reversed' as const
  },
  {
    value: 'stackedLogo',
    label: 'Stacked Logo',
    description: 'Optimized for tall stacked logo',
    logoKey: 'logo_stacked' as const
  }
];

export default function HeaderSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [formData, setFormData] = useState<HeaderConfig>({
    id: 1,
    active_preset: 'default',
    config_json: '{}',
    logo_default: null,
    logo_reversed: null,
    logo_stacked: null,
    updated_at: '',
  });
  const [configObject, setConfigObject] = useState<any>({});

  useEffect(() => {
    fetchHeaderConfig();
  }, []);

  const fetchHeaderConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/header');
      
      if (!response.ok) {
        throw new Error('Failed to fetch header config');
      }

      const data = await response.json();
      setFormData(data);
      
      // Parse JSON config
      try {
        const parsed = JSON.parse(data.config_json || '{}');
        setConfigObject(parsed);
      } catch (e) {
        setConfigObject({});
      }
    } catch (error) {
      console.error('Error fetching header config:', error);
      toast.error('Failed to load header config');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Validate JSON
      try {
        JSON.parse(formData.config_json);
      } catch (e) {
        throw new Error('Invalid JSON format in configuration');
      }

      const response = await fetch('/api/settings/header', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save header config');
      }

      const updated = await response.json();
      setFormData(updated);
      toast.success('Header config saved successfully');
    } catch (error) {
      console.error('Error saving header config:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save header config');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (presetKey: 'logo_default' | 'logo_reversed' | 'logo_stacked', file: File) => {
    try {
      setUploading(presetKey);
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file');
      }

      // Convert File to Buffer for upload
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to R2
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('folder', 'logos');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      // Update form data
      setFormData({ ...formData, [presetKey]: result.url });
      
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload logo');
    } finally {
      setUploading(null);
    }
  };

  const handleConfigChange = (value: string) => {
    setFormData({ ...formData, config_json: value });
    
    // Try to parse and update config object
    try {
      const parsed = JSON.parse(value);
      setConfigObject(parsed);
    } catch (e) {
      // Invalid JSON, don't update config object
    }
  };

  const formatJSON = () => {
    try {
      const parsed = JSON.parse(formData.config_json);
      const formatted = JSON.stringify(parsed, null, 2);
      setFormData({ ...formData, config_json: formatted });
      toast.success('JSON formatted');
    } catch (e) {
      toast.error('Invalid JSON format');
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
      {/* Active Preset Selection */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-800/50">
        <h4 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
          Active Header Preset
        </h4>
        
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Select Active Preset
          </label>
          <select
            value={formData.active_preset}
            onChange={(e) => setFormData({ ...formData, active_preset: e.target.value })}
            className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PRESETS.map(preset => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            This preset will be used on your portfolio website
          </p>
        </div>
      </div>

      {/* Logo Upload for Each Preset */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-800/50">
        <h4 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
          Logo for Each Preset
        </h4>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          Upload a logo for each header layout preset. The active preset's logo will be displayed on your website.
        </p>

        <div className="space-y-6">
          {PRESETS.map(preset => (
            <div key={preset.value} className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {preset.label}
                    {formData.active_preset === preset.value && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded dark:bg-green-900/30 dark:text-green-400">
                        Active
                      </span>
                    )}
                  </h5>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{preset.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Logo Preview */}
                {formData[preset.logoKey] && (
                  <div className="flex-shrink-0">
                    <img
                      src={formData[preset.logoKey]!}
                      alt={`${preset.label} logo`}
                      className="h-16 w-auto max-w-[200px] object-contain border border-gray-200 rounded p-2 dark:border-gray-700"
                    />
                  </div>
                )}

                {/* Upload Button */}
                <div className="flex-1">
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(preset.logoKey, file);
                      }}
                      disabled={uploading === preset.logoKey}
                      className="hidden"
                    />
                    <span className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                      {uploading === preset.logoKey ? (
                        <>
                          <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formData[preset.logoKey] ? 'Change Logo' : 'Upload Logo'}
                        </>
                      )}
                    </span>
                  </label>
                  {formData[preset.logoKey] && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">
                      {formData[preset.logoKey]}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* JSON Configuration */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-800/50">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-base font-semibold text-gray-900 dark:text-white">
            Custom Configuration (JSON)
          </h4>
          <button
            type="button"
            onClick={formatJSON}
            className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
          >
            Format JSON
          </button>
        </div>
        
        <div>
          <textarea
            value={formData.config_json}
            onChange={(e) => handleConfigChange(e.target.value)}
            rows={12}
            className="w-full px-4 py-3 text-sm font-mono border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder='{"key": "value"}'
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Enter custom header configuration in JSON format
          </p>
        </div>

        {/* JSON Preview */}
        {Object.keys(configObject).length > 0 && (
          <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-700">
            <p className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300">
              Parsed Configuration:
            </p>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <pre className="overflow-x-auto">
                {JSON.stringify(configObject, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Configuration Examples */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-900/30 dark:bg-blue-900/10">
        <h4 className="mb-3 text-sm font-semibold text-blue-900 dark:text-blue-300">
          💡 Configuration Examples
        </h4>
        <div className="space-y-2 text-xs text-blue-800 dark:text-blue-400">
          <p><strong>Logo Settings:</strong></p>
          <code className="block p-2 bg-white/50 rounded dark:bg-gray-900/50">
            {`{"logo": {"url": "/logo.png", "height": 40}}`}
          </code>
          
          <p className="mt-3"><strong>Navigation:</strong></p>
          <code className="block p-2 bg-white/50 rounded dark:bg-gray-900/50">
            {`{"nav": {"position": "center", "sticky": true}}`}
          </code>
          
          <p className="mt-3"><strong>Colors:</strong></p>
          <code className="block p-2 bg-white/50 rounded dark:bg-gray-900/50">
            {`{"colors": {"bg": "#ffffff", "text": "#000000"}}`}
          </code>
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
          disabled={saving}
          className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
