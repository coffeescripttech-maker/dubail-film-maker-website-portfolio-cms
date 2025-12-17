"use client";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";

interface HeaderConfig {
  id: number;
  active_preset: string;
  config_json: string;
  updated_at: string;
}

export default function HeaderSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<HeaderConfig>({
    id: 1,
    active_preset: 'default',
    config_json: '{}',
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
      {/* Preset Selection */}
      <div className="rounded-lg border border-gray-200  p-6 dark:border-gray-800 dark:bg-gray-800/50">
        <h4 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
          Header Preset
        </h4>
        
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Active Preset
          </label>
          <select
            value={formData.active_preset}
            onChange={(e) => setFormData({ ...formData, active_preset: e.target.value })}
            className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="default">Default</option>
            <option value="minimal">Minimal</option>
            <option value="full">Full Width</option>
            <option value="custom">Custom</option>
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Select the header layout preset for your website
          </p>
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
