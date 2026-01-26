"use client";
import React, { useState, useEffect } from "react";
import { Project } from "@/lib/db";

interface PortfolioPreviewProps {
  projects: Project[];
  onClose: () => void;
}

type ViewMode = "desktop" | "tablet" | "mobile";

export default function PortfolioPreview({
  projects,
  onClose,
}: PortfolioPreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");
  const [isClosing, setIsClosing] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200); // Match animation duration
  };

  // Get viewport dimensions based on view mode
  const getViewportDimensions = () => {
    switch (viewMode) {
      case "mobile":
        return { width: "375px", height: "667px" };
      case "tablet":
        return { width: "768px", height: "1024px" };
      case "desktop":
      default:
        return { width: "100%", height: "100%" };
    }
  };

  const dimensions = getViewportDimensions();

  // Sort projects by order_index
  const sortedProjects = [...projects].sort(
    (a, b) => a.order_index - b.order_index
  );

  // Filter only published projects for preview
  const publishedProjects = sortedProjects.filter((p) => p.is_published);

  return (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-200 ${
        isClosing ? "opacity-0" : "opacity-100"
      }`}
      onClick={handleClose}
    >
      {/* Modal Container */}
      <div
        className={`relative w-full h-full max-w-[95vw] max-h-[95vh] bg-white dark:bg-gray-900 rounded-lg shadow-2xl flex flex-col transition-transform duration-200 ${
          isClosing ? "scale-95" : "scale-100"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Portfolio Preview
            </h2>
            <span className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-300">
              {publishedProjects.length} Published Films
            </span>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg dark:bg-gray-800">
              <button
                onClick={() => setViewMode("desktop")}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  viewMode === "desktop"
                    ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
                title="Desktop View"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("tablet")}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  viewMode === "tablet"
                    ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
                title="Tablet View"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("mobile")}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  viewMode === "mobile"
                    ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
                title="Mobile View"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="p-2 text-gray-500 transition-colors rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              title="Close Preview"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
          <div className="flex items-start justify-center min-h-full p-4">
            {/* Viewport Container */}
            <div
              className={`bg-white dark:bg-gray-900 shadow-xl transition-all duration-300 ${
                viewMode === "desktop"
                  ? "w-full h-full"
                  : "border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden"
              }`}
              style={{
                width: dimensions.width,
                height: viewMode === "desktop" ? "auto" : dimensions.height,
                minHeight: viewMode === "desktop" ? "100%" : "auto",
              }}
            >
              {/* Portfolio Grid */}
              <div className="p-4 sm:p-6 lg:p-8">
                {publishedProjects.length === 0 ? (
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
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      No Published Films
                    </h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Publish some films to see them in the preview
                    </p>
                  </div>
                ) : (
                  <div
                    className={`grid gap-4 ${
                      viewMode === "mobile"
                        ? "grid-cols-1"
                        : viewMode === "tablet"
                        ? "grid-cols-2"
                        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    }`}
                  >
                    {publishedProjects.map((project) => {
                      // Determine which thumbnail to display
                      const thumbnailUrl =
                        project.thumbnail_url || project.poster_image || "";

                      return (
                        <div
                          key={project.id}
                          className="relative overflow-hidden transition-transform bg-gray-100 rounded-lg group hover:scale-105 dark:bg-gray-800"
                          style={{ aspectRatio: "16/9" }}
                        >
                          {/* Thumbnail Image */}
                          {thumbnailUrl ? (
                            <img
                              src={thumbnailUrl}
                              alt={project.title}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="flex items-center justify-center w-full h-full bg-gray-200 dark:bg-gray-700">
                              <svg
                                className="w-12 h-12 text-gray-400 dark:text-gray-500"
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

                          {/* Overlay with Project Info */}
                          <div className="absolute inset-0 flex flex-col justify-end p-4 transition-opacity bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100">
                            <h3 className="text-sm font-semibold text-white sm:text-base">
                              {project.title}
                            </h3>
                            {project.client && (
                              <p className="mt-1 text-xs text-gray-200 sm:text-sm">
                                {project.client}
                              </p>
                            )}
                            {project.category && (
                              <p className="mt-1 text-xs text-gray-300">
                                {project.category}
                              </p>
                            )}
                          </div>

                          {/* Featured Badge */}
                          {project.is_featured && (
                            <div className="absolute top-2 right-2">
                              <span className="px-2 py-1 text-xs font-medium text-yellow-900 bg-yellow-400 rounded-full">
                                Featured
                              </span>
                            </div>
                          )}

                          {/* Order Index Badge (for debugging) */}
                          <div className="absolute top-2 left-2">
                            <span className="px-2 py-1 text-xs font-medium text-white bg-black/60 rounded-full">
                              #{project.order_index}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium">View Mode:</span>{" "}
            <span className="capitalize">{viewMode}</span>
            {viewMode !== "desktop" && (
              <span className="ml-2">
                ({dimensions.width} × {dimensions.height})
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
