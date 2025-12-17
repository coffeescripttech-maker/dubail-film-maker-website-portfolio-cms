"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import ProjectTable from "@/components/projects/ProjectTable";
import ProjectForm from "@/components/projects/ProjectForm";
import ProjectFilters from "@/components/projects/ProjectFilters";
import { Project } from "@/lib/db";
import { PlusIcon } from "@/icons";
import { toast } from "sonner";

export default function ProjectManagement() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
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

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="Project Management" />

      {!showForm ? (
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
            <button
              onClick={handleCreateProject}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <PlusIcon className="w-4 h-4" />
              Create Project
            </button>
          </div>

          {/* Filters */}
          <ComponentCard title="Filters">
            <ProjectFilters 
              filters={filters}
              onFiltersChange={setFilters}
            />
          </ComponentCard>

          {/* Projects Table */}
          <ComponentCard title={`Projects (${projects.length})`}>
            <ProjectTable
              projects={projects}
              loading={loading}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
            />
          </ComponentCard>
        </>
      ) : (
        /* Project Form */
        <ComponentCard title={editingProject ? "Edit Project" : "Create Project"}>
          <ProjectForm
            project={editingProject}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            existingProjects={projects}
          />
        </ComponentCard>
      )}
    </div>
  );
}