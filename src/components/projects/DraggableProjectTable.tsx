"use client";
import React, { useState } from "react";
import { Project } from "@/lib/db";
import { PencilIcon, TrashBinIcon, EyeIcon } from "@/icons";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import GridReorderView from "./GridReorderView";

interface DraggableProjectTableProps {
  projects: Project[];
  loading: boolean;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
  selectedProjects?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  reorderMode: boolean;
  onReorderModeChange: (enabled: boolean) => void;
}

interface SortableRowProps {
  project: Project;
  isSelected: boolean;
  reorderMode: boolean;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
  onSelectOne: (projectId: string, checked: boolean) => void;
  showCheckbox: boolean;
}

function SortableRow({
  project,
  isSelected,
  reorderMode,
  onEdit,
  onDelete,
  onSelectOne,
  showCheckbox,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id, disabled: !reorderMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 ${
        isSelected ? "bg-blue-50 dark:bg-blue-900/20" : "bg-white dark:bg-gray-800"
      } ${reorderMode ? "cursor-move" : ""}`}
      {...(reorderMode ? { ...attributes, ...listeners } : {})}
    >
      {showCheckbox && (
        <td className="px-4 py-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelectOne(project.id, e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            disabled={reorderMode}
          />
        </td>
      )}
      <td className="px-6 py-4">
        <div className="flex items-center space-x-3">
          {project.poster_image && (
            <img
              src={project.poster_image}
              alt={project.title}
              className="w-12 h-8 object-cover rounded"
            />
          )}
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {project.title}
            </div>
            {project.languages && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {project.languages}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-gray-900 dark:text-white">
          {project.client || "-"}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-gray-900 dark:text-white">
          {project.category || "-"}
        </div>
        {project.data_cat && (
          <span
            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              project.data_cat === "government"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                : project.data_cat === "corporate"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                : project.data_cat === "tourism"
                ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
            }`}
          >
            {project.data_cat}
          </span>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="text-gray-900 dark:text-white">
          {project.classification || "-"}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col space-y-1">
          <span
            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              project.is_published
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
            }`}
          >
            {project.is_published ? "Published" : "Draft"}
          </span>
          {project.is_featured && (
            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
              Featured
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-gray-900 dark:text-white">{project.order_index}</div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          {project.video_url && (
            <a
              href={project.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              title="View Video"
            >
              <EyeIcon className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={() => onEdit(project)}
            className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
            title="Edit Project"
            disabled={reorderMode}
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(project.id)}
            className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            title="Delete Project"
            disabled={reorderMode}
          >
            <TrashBinIcon className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function DraggableProjectTable({
  projects,
  loading,
  onEdit,
  onDelete,
  selectedProjects = [],
  onSelectionChange,
  reorderMode,
  onReorderModeChange,
}: DraggableProjectTableProps) {
  const [localProjects, setLocalProjects] = useState<Project[]>(projects);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Update local projects when props change
  React.useEffect(() => {
    setLocalProjects(projects);
  }, [projects]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange?.(localProjects.map((p) => p.id));
    } else {
      onSelectionChange?.([]);
    }
  };

  const handleSelectOne = (projectId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange?.([...selectedProjects, projectId]);
    } else {
      onSelectionChange?.(selectedProjects.filter((id) => id !== projectId));
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = localProjects.findIndex((p) => p.id === active.id);
    const newIndex = localProjects.findIndex((p) => p.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Update local state immediately for smooth UX
    const reorderedProjects = arrayMove(localProjects, oldIndex, newIndex);
    setLocalProjects(reorderedProjects);
  };

  const handleSaveOrder = async () => {
    setIsSaving(true);
    const loadingToast = toast.loading("Saving new order...");

    try {
      // Calculate new order indices based on current position
      const updates = localProjects.map((project, index) => ({
        projectId: project.id,
        orderIndex: index + 1,
      }));

      const response = await fetch("/api/projects/reorder", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ updates }),
      });

      if (response.ok) {
        toast.success("Order Saved!", {
          description: "Film order has been updated successfully.",
          id: loadingToast,
        });
        onReorderModeChange(false);
        setViewMode("table"); // Reset to table view after save
      } else {
        const error = await response.json();
        toast.error("Save Failed", {
          description: error.error || "Failed to save order",
          id: loadingToast,
        });
        // Revert to original order
        setLocalProjects(projects);
      }
    } catch (error) {
      console.error("Error saving order:", error);
      toast.error("Error", {
        description: "An error occurred while saving the order",
        id: loadingToast,
      });
      // Revert to original order
      setLocalProjects(projects);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelReorder = () => {
    setLocalProjects(projects);
    onReorderModeChange(false);
    setViewMode("table"); // Reset to table view on cancel
  };

  const handleGridSave = async (reorderedProjects: Project[]) => {
    setLocalProjects(reorderedProjects);
    
    const loadingToast = toast.loading("Saving new order...");

    try {
      // Calculate new order indices based on current position
      const updates = reorderedProjects.map((project, index) => ({
        projectId: project.id,
        orderIndex: index + 1,
      }));

      const response = await fetch("/api/projects/reorder", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ updates }),
      });

      if (response.ok) {
        toast.success("Order Saved!", {
          description: "Film order has been updated successfully.",
          id: loadingToast,
        });
        onReorderModeChange(false);
        setViewMode("table");
      } else {
        const error = await response.json();
        toast.error("Save Failed", {
          description: error.error || "Failed to save order",
          id: loadingToast,
        });
        // Revert to original order
        setLocalProjects(projects);
      }
    } catch (error) {
      console.error("Error saving order:", error);
      toast.error("Error", {
        description: "An error occurred while saving the order",
        id: loadingToast,
      });
      // Revert to original order
      setLocalProjects(projects);
    }
  };

  const handleGridCancel = () => {
    setLocalProjects(projects);
    onReorderModeChange(false);
    setViewMode("table");
  };

  const isAllSelected =
    localProjects.length > 0 && selectedProjects.length === localProjects.length;
  const isSomeSelected =
    selectedProjects.length > 0 && selectedProjects.length < localProjects.length;

  const activeProject = activeId
    ? localProjects.find((p) => p.id === activeId)
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin dark:border-gray-700"></div>
      </div>
    );
  }

  if (localProjects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 dark:text-gray-400">
          <p className="text-lg font-medium">No projects found</p>
          <p className="text-sm">Create your first project to get started</p>
        </div>
      </div>
    );
  }

  // If in reorder mode and grid view is selected, show grid view
  if (reorderMode && viewMode === "grid") {
    return (
      <GridReorderView
        projects={localProjects}
        onSave={handleGridSave}
        onCancel={handleGridCancel}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Reorder Mode Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!reorderMode ? (
            <button
              onClick={() => {
                onReorderModeChange(true);
                setViewMode("grid"); // Default to grid view when enabling reorder mode
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              Enable Reorder Mode
            </button>
          ) : (
            <>
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg dark:bg-gray-800">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                    viewMode === "grid"
                      ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  }`}
                  title="Grid View (Recommended)"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Grid
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                    viewMode === "table"
                      ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  }`}
                  title="Table View"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Table
                </button>
              </div>

              <button
                onClick={handleSaveOrder}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Save Order
                  </>
                )}
              </button>
              <button
                onClick={handleCancelReorder}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </>
          )}
        </div>
        {reorderMode && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Reorder Mode Active:</span>{" "}
            {viewMode === "grid" ? "Drag cards to reorder" : "Drag rows to reorder"}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                {onSelectionChange && (
                  <th scope="col" className="px-4 py-3 w-12">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(input) => {
                        if (input) {
                          input.indeterminate = isSomeSelected;
                        }
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      disabled={reorderMode}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </th>
                )}
                <th scope="col" className="px-6 py-3">
                  Project
                </th>
                <th scope="col" className="px-6 py-3">
                  Client
                </th>
                <th scope="col" className="px-6 py-3">
                  Category
                </th>
                <th scope="col" className="px-6 py-3">
                  Classification
                </th>
                <th scope="col" className="px-6 py-3">
                  Status
                </th>
                <th scope="col" className="px-6 py-3">
                  Order
                </th>
                <th scope="col" className="px-6 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <SortableContext
                items={localProjects.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                {localProjects.map((project) => {
                  const isSelected = selectedProjects.includes(project.id);
                  return (
                    <SortableRow
                      key={project.id}
                      project={project}
                      isSelected={isSelected}
                      reorderMode={reorderMode}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onSelectOne={handleSelectOne}
                      showCheckbox={!!onSelectionChange}
                    />
                  );
                })}
              </SortableContext>
            </tbody>
          </table>
          <DragOverlay>
            {activeProject ? (
              <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 opacity-90 border-2 border-blue-500">
                <div className="flex items-center space-x-3">
                  {activeProject.poster_image && (
                    <img
                      src={activeProject.poster_image}
                      alt={activeProject.title}
                      className="w-12 h-8 object-cover rounded"
                    />
                  )}
                  <div className="font-medium text-gray-900 dark:text-white">
                    {activeProject.title}
                  </div>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
