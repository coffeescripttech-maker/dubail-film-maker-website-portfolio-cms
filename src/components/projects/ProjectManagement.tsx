"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import DraggableProjectTable from "@/components/projects/DraggableProjectTable";
import ProjectForm from "@/components/projects/ProjectForm";
import ProjectFilters from "@/components/projects/ProjectFilters";
import BulkImport from "@/components/projects/BulkImport";
import PresetManager from "@/components/projects/PresetManager";
import PortfolioPreview from "@/components/projects/PortfolioPreview";
import { Project } from "@/lib/db";
import { PlusIcon, ArrowUpIcon, TrashBinIcon } from "@/icons";
import { toast } from "sonner";

export default function ProjectManagement() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [reorderMode, setReorderMode] = useState(false);
  const [showBulkReorderModal, setShowBulkReorderModal] = useState(false);
  const [bulkReorderData, setBulkReorderData] = useState<Record<string, number>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    featured: '',
    published: '',
    search: ''
  });

  // Fetch projects
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.featured) params.append('featured', filters.featured);
      if (filters.published) params.append('published', filters.published);

      const response = await fetch(`/api/projects?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        let filteredProjects = data.projects;

        // Apply search filter on client side
        if (filters.search) {
          filteredProjects = filteredProjects.filter((project: Project) =>
            project.title.toLowerCase().includes(filters.search.toLowerCase()) ||
            project.client?.toLowerCase().includes(filters.search.toLowerCase()) ||
            project.category?.toLowerCase().includes(filters.search.toLowerCase())
          );
        }

        setProjects(filteredProjects);
      } else {
        console.error('Failed to fetch projects');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [filters]);

  const handleCreateProject = () => {
    setEditingProject(null);
    setShowForm(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowForm(true);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) {
      return;
    }

    const loadingToast = toast.loading('Deleting project...');

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Project Deleted!', {
          description: 'The project has been deleted successfully.',
          id: loadingToast
        });
        await fetchProjects(); // Refresh the list
      } else {
        const error = await response.json();
        toast.error('Delete Failed', {
          description: error.error || 'Failed to delete project',
          id: loadingToast
        });
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Error', {
        description: 'An error occurred while deleting the project',
        id: loadingToast
      });
    }
  };

  const handleFormSubmit = async (projectData: Partial<Project>) => {
    try {
      const url = editingProject 
        ? `/api/projects/${editingProject.id}`
        : '/api/projects';
      
      const method = editingProject ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingProject(null);
        await fetchProjects(); // Refresh the list
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save project');
      }
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Error saving project');
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingProject(null);
  };

  const handleBulkImport = () => {
    setShowBulkImport(true);
    setShowForm(false);
  };

  const handleBulkImportComplete = async () => {
    setShowBulkImport(false);
    await fetchProjects();
  };

  const handleBulkImportCancel = () => {
    setShowBulkImport(false);
  };

  const handleReorderModeChange = async (enabled: boolean) => {
    setReorderMode(enabled);
    // If reorder mode is being disabled (after save), refresh the project list
    if (!enabled) {
      await fetchProjects();
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProjects.length === 0) {
      toast.error('No Projects Selected', {
        description: 'Please select projects to delete'
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedProjects.length} project(s)?`)) {
      return;
    }

    const loadingToast = toast.loading('Deleting Projects', {
      description: `Deleting ${selectedProjects.length} project(s)...`
    });

    let successCount = 0;
    let errorCount = 0;

    for (const projectId of selectedProjects) {
      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error('Error deleting project:', error);
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast.success('Projects Deleted!', {
        description: `Successfully deleted ${successCount} project(s)${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        id: loadingToast
      });
      setSelectedProjects([]);
      await fetchProjects();
    } else {
      toast.error('Delete Failed', {
        description: 'Failed to delete projects',
        id: loadingToast
      });
    }
  };

  const handleBulkReorder = () => {
    if (selectedProjects.length === 0) {
      toast.error('No Projects Selected', {
        description: 'Please select projects to reorder'
      });
      return;
    }

    // Initialize bulk reorder data with current order indices
    const initialData: Record<string, number> = {};
    selectedProjects.forEach(projectId => {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        initialData[projectId] = project.order_index || 0;
      }
    });
    setBulkReorderData(initialData);
    setShowBulkReorderModal(true);
  };

  const handleBulkReorderSubmit = async () => {
    const loadingToast = toast.loading('Reordering Projects', {
      description: `Updating order for ${selectedProjects.length} project(s)...`
    });

    try {
      // Prepare updates array
      const updates = Object.entries(bulkReorderData).map(([projectId, orderIndex]) => ({
        projectId,
        orderIndex
      }));

      const response = await fetch('/api/projects/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      });

      if (response.ok) {
        toast.success('Projects Reordered!', {
          description: `Successfully reordered ${selectedProjects.length} project(s)`,
          id: loadingToast
        });
        setShowBulkReorderModal(false);
        setBulkReorderData({});
        setSelectedProjects([]);
        await fetchProjects();
      } else {
        const error = await response.json();
        toast.error('Reorder Failed', {
          description: error.error || 'Failed to reorder projects',
          id: loadingToast
        });
      }
    } catch (error) {
      console.error('Error reordering projects:', error);
      toast.error('Error', {
        description: 'An error occurred while reordering projects',
        id: loadingToast
      });
    }
  };

  const handleBulkReorderCancel = () => {
    setShowBulkReorderModal(false);
    setBulkReorderData({});
  };

  const handleOrderIndexChange = (projectId: string, value: string) => {
    const orderIndex = parseInt(value, 10);
    if (!isNaN(orderIndex)) {
      setBulkReorderData(prev => ({
        ...prev,
        [projectId]: orderIndex
      }));
    }
  };

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="Project Management" />

      {!showForm && !showBulkImport ? (
        <>
          {/* Header with Create Button */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Projects
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage your film projects and portfolio content
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPreview(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview Portfolio
              </button>
              <button
                onClick={handleBulkImport}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                <ArrowUpIcon className="w-4 h-4" />
                Bulk Import
              </button>
              <button
                onClick={handleCreateProject}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <PlusIcon className="w-4 h-4" />
                Create Project
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <ProjectFilters 
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>

          {/* Bulk Actions Bar */}
          {selectedProjects.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between dark:bg-blue-900/20 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                  {selectedProjects.length} project(s) selected
                </span>
                <button
                  onClick={() => setSelectedProjects([])}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Clear selection
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkReorder}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  Reorder Selected
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  <TrashBinIcon className="w-4 h-4" />
                  Delete Selected
                </button>
              </div>
            </div>
          )}

          {/* Projects Table */}
          <ComponentCard title={`Projects (${projects.length})`}>
            <DraggableProjectTable
              projects={projects}
              loading={loading}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
              selectedProjects={selectedProjects}
              onSelectionChange={setSelectedProjects}
              reorderMode={reorderMode}
              onReorderModeChange={handleReorderModeChange}
            />
          </ComponentCard>

          {/* Preset Manager */}
          <ComponentCard title="Film Arrangement Presets">
            <PresetManager
              currentProjects={projects}
              onPresetApplied={fetchProjects}
            />
          </ComponentCard>
        </>
      ) : showBulkImport ? (
        /* Bulk Import */
        <ComponentCard title="Bulk Import Projects">
          <BulkImport
            onImportComplete={handleBulkImportComplete}
            onCancel={handleBulkImportCancel}
            existingProjects={projects.length}
          />
        </ComponentCard>
      ) : (
        /* Project Form */
        <ComponentCard 
          title={editingProject ? "Edit Project" : "Create Project"}
          onBack={handleFormCancel}
        >
          <ProjectForm
            project={editingProject}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            existingProjects={projects}
          />
        </ComponentCard>
      )}

      {/* Bulk Reorder Modal */}
      {showBulkReorderModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Bulk Reorder Projects
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Assign new order indices to {selectedProjects.length} selected project(s)
              </p>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 overflow-y-auto flex-1">
              <div className="space-y-4">
                {selectedProjects.map(projectId => {
                  const project = projects.find(p => p.id === projectId);
                  if (!project) return null;

                  return (
                    <div key={projectId} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {project.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {project.client && `${project.client} • `}
                          {project.category || 'Uncategorized'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <label htmlFor={`order-${projectId}`} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Order:
                        </label>
                        <input
                          id={`order-${projectId}`}
                          type="number"
                          min="0"
                          value={bulkReorderData[projectId] || 0}
                          onChange={(e) => handleOrderIndexChange(projectId, e.target.value)}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={handleBulkReorderCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkReorderSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Apply Reorder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Preview Modal */}
      {showPreview && (
        <PortfolioPreview
          projects={projects}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}