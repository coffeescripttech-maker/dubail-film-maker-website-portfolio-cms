"use client";
import React, { useState } from "react";
import { Project } from "@/lib/db";
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
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";

interface GridReorderViewProps {
  projects: Project[];
  onSave: (reorderedProjects: Project[]) => Promise<void>;
  onCancel: () => void;
}

interface SortableCardProps {
  project: Project;
  index: number;
}

function SortableCard({ project, index }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const thumbnailUrl = project.thumbnail_url || project.poster_image || "";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-200 cursor-move border-2 border-transparent hover:border-blue-400 dark:hover:border-blue-500"
    >
      {/* Order Badge */}
      <div className="absolute top-3 left-3 z-10">
        <div className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white font-bold rounded-full shadow-lg text-sm">
          #{index + 1}
        </div>
      </div>

      {/* Status Badges */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
        {project.is_featured && (
          <span className="px-2 py-1 text-xs font-medium text-yellow-900 bg-yellow-400 rounded-full shadow-sm">
            Featured
          </span>
        )}
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full shadow-sm ${
            project.is_published
              ? "bg-green-500 text-white"
              : "bg-gray-400 text-white"
          }`}
        >
          {project.is_published ? "Published" : "Draft"}
        </span>
      </div>

      {/* Thumbnail */}
      <div className="relative w-full aspect-video overflow-hidden rounded-t-lg bg-gray-100 dark:bg-gray-700">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <svg
              className="w-16 h-16 text-gray-300 dark:text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Drag Handle Indicator */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
          <div className="flex items-center gap-2 text-white text-sm font-medium">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Drag to Reorder
          </div>
        </div>
      </div>

      {/* Project Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-base line-clamp-2 mb-2">
          {project.title}
        </h3>
        
        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
          {project.client && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="truncate">{project.client}</span>
            </div>
          )}
          
          {project.category && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span className="truncate">{project.category}</span>
            </div>
          )}

          {project.classification && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="truncate">{project.classification}</span>
            </div>
          )}
        </div>

        {/* Data Category Badge */}
        {project.data_cat && (
          <div className="mt-3">
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
          </div>
        )}
      </div>
    </div>
  );
}

export default function GridReorderView({
  projects,
  onSave,
  onCancel,
}: GridReorderViewProps) {
  const [localProjects, setLocalProjects] = useState<Project[]>(projects);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
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

    const reorderedProjects = arrayMove(localProjects, oldIndex, newIndex);
    setLocalProjects(reorderedProjects);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(localProjects);
    } catch (error) {
      console.error("Error saving order:", error);
      toast.error("Failed to save order");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setLocalProjects(projects);
    onCancel();
  };

  const activeProject = activeId
    ? localProjects.find((p) => p.id === activeId)
    : null;

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Grid Reorder Mode
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Drag and drop cards to reorder your films • {localProjects.length} films
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving Order...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Order
                </>
              )}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-900 dark:text-blue-300">
              <p className="font-medium">How to reorder:</p>
              <ul className="mt-1 space-y-1 list-disc list-inside">
                <li>Click and drag any card to a new position</li>
                <li>The order numbers update automatically as you drag</li>
                <li>Changes are not saved until you click "Save Order"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={localProjects.map((p) => p.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {localProjects.map((project, index) => (
              <SortableCard
                key={project.id}
                project={project}
                index={index}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeProject ? (
            <div className="opacity-90 scale-105 shadow-2xl">
              <SortableCard
                project={activeProject}
                index={localProjects.findIndex((p) => p.id === activeProject.id)}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Empty State */}
      {localProjects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg
            className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            No Projects to Reorder
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Create some projects first to use the reorder feature
          </p>
        </div>
      )}
    </div>
  );
}
