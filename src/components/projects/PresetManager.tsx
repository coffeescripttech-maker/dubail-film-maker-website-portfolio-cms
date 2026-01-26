"use client";
import React, { useState, useEffect } from "react";
import { Project } from "@/lib/db";
import { FilmPreset } from "@/lib/d1-client";
import { TrashBinIcon } from "@/icons";
import { toast } from "sonner";

interface PresetManagerProps {
  currentProjects: Project[];
  onPresetApplied: () => void;
}

export default function PresetManager({
  currentProjects,
  onPresetApplied,
}: PresetManagerProps) {
  const [presets, setPresets] = useState<FilmPreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presetDescription, setPresetDescription] = useState("");
  const [savingPreset, setSavingPreset] = useState(false);

  // Load presets on mount
  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/projects/presets");
      
      if (response.ok) {
        const data = await response.json();
        setPresets(data.presets || []);
      } else {
        console.error("Failed to load presets");
      }
    } catch (error) {
      console.error("Error loading presets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      toast.error("Preset Name Required", {
        description: "Please enter a name for the preset",
      });
      return;
    }

    if (currentProjects.length === 0) {
      toast.error("No Projects", {
        description: "Cannot save preset with no projects",
      });
      return;
    }

    setSavingPreset(true);
    const loadingToast = toast.loading("Saving preset...");

    try {
      // Build order config from current projects
      const orderConfig = currentProjects.map((project, index) => ({
        projectId: project.id,
        orderIndex: project.order_index || index + 1,
      }));

      const response = await fetch("/api/projects/presets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: presetName.trim(),
          description: presetDescription.trim() || undefined,
          orderConfig,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Preset Saved!", {
          description: `"${presetName}" has been saved successfully.`,
          id: loadingToast,
        });

        // Reset form and close modal
        setPresetName("");
        setPresetDescription("");
        setShowSaveModal(false);

        // Reload presets
        await loadPresets();
      } else {
        const error = await response.json();
        toast.error("Save Failed", {
          description: error.error || "Failed to save preset",
          id: loadingToast,
        });
      }
    } catch (error) {
      console.error("Error saving preset:", error);
      toast.error("Error", {
        description: "An error occurred while saving the preset",
        id: loadingToast,
      });
    } finally {
      setSavingPreset(false);
    }
  };

  const handleApplyPreset = async (presetId: string, presetName: string) => {
    if (!confirm(`Apply preset "${presetName}"? This will reorder all films.`)) {
      return;
    }

    const loadingToast = toast.loading("Applying preset...");

    try {
      const response = await fetch(`/api/projects/presets/${presetId}/apply`, {
        method: "PUT",
      });

      if (response.ok) {
        toast.success("Preset Applied!", {
          description: `"${presetName}" has been applied successfully.`,
          id: loadingToast,
        });

        // Notify parent to refresh projects
        onPresetApplied();
      } else {
        const error = await response.json();
        toast.error("Apply Failed", {
          description: error.error || "Failed to apply preset",
          id: loadingToast,
        });
      }
    } catch (error) {
      console.error("Error applying preset:", error);
      toast.error("Error", {
        description: "An error occurred while applying the preset",
        id: loadingToast,
      });
    }
  };

  const handleDeletePreset = async (presetId: string, presetName: string) => {
    if (!confirm(`Are you sure you want to delete preset "${presetName}"?`)) {
      return;
    }

    const loadingToast = toast.loading("Deleting preset...");

    try {
      const response = await fetch(`/api/projects/presets/${presetId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Preset Deleted!", {
          description: `"${presetName}" has been deleted.`,
          id: loadingToast,
        });

        // Reload presets
        await loadPresets();
      } else {
        const error = await response.json();
        toast.error("Delete Failed", {
          description: error.error || "Failed to delete preset",
          id: loadingToast,
        });
      }
    } catch (error) {
      console.error("Error deleting preset:", error);
      toast.error("Error", {
        description: "An error occurred while deleting the preset",
        id: loadingToast,
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Save Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Film Arrangement Presets
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Save and apply different film arrangements
          </p>
        </div>
        <button
          onClick={() => setShowSaveModal(true)}
          disabled={currentProjects.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
            />
          </svg>
          Save as Preset
        </button>
      </div>

      {/* Presets List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin dark:border-gray-700"></div>
        </div>
      ) : presets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No presets saved
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Save your current film arrangement to quickly apply it later
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                    {preset.name}
                  </h4>
                  {preset.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {preset.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDeletePreset(preset.id, preset.name)}
                  className="ml-2 p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete Preset"
                >
                  <TrashBinIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                    />
                  </svg>
                  {preset.order_config.length} film{preset.order_config.length !== 1 ? "s" : ""}
                </div>
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {formatDate(preset.created_at)}
                </div>
              </div>

              <button
                onClick={() => handleApplyPreset(preset.id, preset.name)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Apply Preset
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Save Preset Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[99999] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
              onClick={() => setShowSaveModal(false)}
            ></div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 sm:mx-0 sm:h-10 sm:w-10">
                    <svg
                      className="h-6 w-6 text-blue-600 dark:text-blue-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                      />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Save Film Arrangement Preset
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label
                          htmlFor="preset-name"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                          Preset Name *
                        </label>
                        <input
                          type="text"
                          id="preset-name"
                          value={presetName}
                          onChange={(e) => setPresetName(e.target.value)}
                          placeholder="e.g., Featured Films First"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          disabled={savingPreset}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="preset-description"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                          Description (Optional)
                        </label>
                        <textarea
                          id="preset-description"
                          value={presetDescription}
                          onChange={(e) => setPresetDescription(e.target.value)}
                          placeholder="Add a description for this preset..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
                          disabled={savingPreset}
                        />
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        This will save the current order of {currentProjects.length} film
                        {currentProjects.length !== 1 ? "s" : ""}.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                <button
                  type="button"
                  onClick={handleSavePreset}
                  disabled={savingPreset || !presetName.trim()}
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingPreset ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    "Save Preset"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSaveModal(false);
                    setPresetName("");
                    setPresetDescription("");
                  }}
                  disabled={savingPreset}
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
