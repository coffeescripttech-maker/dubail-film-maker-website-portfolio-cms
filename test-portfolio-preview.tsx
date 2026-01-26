/**
 * Test file for PortfolioPreview Component
 * 
 * This file demonstrates the PortfolioPreview component with sample data.
 * To test:
 * 1. Copy this component into a page or component in your Next.js app
 * 2. Click the "Open Preview" button to see the modal
 * 3. Test the view mode toggles (Desktop/Tablet/Mobile)
 * 4. Verify that projects are displayed with correct thumbnails and order
 * 5. Test closing the modal with the X button, Close button, or Escape key
 */

"use client";
import React, { useState } from "react";
import PortfolioPreview from "./src/components/projects/PortfolioPreview";
import { Project } from "./src/lib/db";

export default function TestPortfolioPreview() {
  const [showPreview, setShowPreview] = useState(false);

  // Sample project data for testing
  const sampleProjects: Project[] = [
    {
      id: "1",
      title: "Moving Forward",
      client: "Nike",
      category: "Commercial",
      data_cat: "corporate",
      languages: "English",
      classification: "TVC",
      vimeo_id: null,
      video_url: "https://example.com/video1.mp4",
      poster_image: "https://picsum.photos/seed/1/1920/1080",
      poster_image_srcset: null,
      thumbnail_url: "https://picsum.photos/seed/1/1920/1080",
      thumbnail_type: "custom",
      thumbnail_timestamp: null,
      thumbnail_metadata: null,
      credits: [
        { role: "Director", name: "John Doe" },
        { role: "Producer", name: "Jane Smith" },
      ],
      order_index: 1,
      is_featured: true,
      is_published: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "2",
      title: "Urban Dreams",
      client: "Adidas",
      category: "Music Video",
      data_cat: "tourism",
      languages: "English, Arabic",
      classification: "Music Video",
      vimeo_id: null,
      video_url: "https://example.com/video2.mp4",
      poster_image: "https://picsum.photos/seed/2/1920/1080",
      poster_image_srcset: null,
      thumbnail_url: "https://picsum.photos/seed/2/1920/1080",
      thumbnail_type: "video_frame",
      thumbnail_timestamp: 5.5,
      thumbnail_metadata: null,
      credits: [{ role: "Director", name: "Alice Johnson" }],
      order_index: 2,
      is_featured: false,
      is_published: true,
      created_at: "2024-01-02T00:00:00Z",
      updated_at: "2024-01-02T00:00:00Z",
    },
    {
      id: "3",
      title: "Desert Nights",
      client: "Emirates",
      category: "Documentary",
      data_cat: "government",
      languages: "Arabic",
      classification: "Documentary",
      vimeo_id: null,
      video_url: "https://example.com/video3.mp4",
      poster_image: "https://picsum.photos/seed/3/1920/1080",
      poster_image_srcset: null,
      thumbnail_url: "https://picsum.photos/seed/3/1920/1080",
      thumbnail_type: "custom",
      thumbnail_timestamp: null,
      thumbnail_metadata: null,
      credits: [],
      order_index: 3,
      is_featured: true,
      is_published: true,
      created_at: "2024-01-03T00:00:00Z",
      updated_at: "2024-01-03T00:00:00Z",
    },
    {
      id: "4",
      title: "City Lights",
      client: "Dubai Tourism",
      category: "Commercial",
      data_cat: "tourism",
      languages: "English",
      classification: "TVC",
      vimeo_id: null,
      video_url: "https://example.com/video4.mp4",
      poster_image: "https://picsum.photos/seed/4/1920/1080",
      poster_image_srcset: null,
      thumbnail_url: null, // No custom thumbnail - will use poster_image
      thumbnail_type: null,
      thumbnail_timestamp: null,
      thumbnail_metadata: null,
      credits: [{ role: "Director", name: "Bob Wilson" }],
      order_index: 4,
      is_featured: false,
      is_published: true,
      created_at: "2024-01-04T00:00:00Z",
      updated_at: "2024-01-04T00:00:00Z",
    },
    {
      id: "5",
      title: "Ocean Waves",
      client: "Luxury Hotels",
      category: "Brand Film",
      data_cat: "corporate",
      languages: "English, French",
      classification: "Brand Film",
      vimeo_id: null,
      video_url: "https://example.com/video5.mp4",
      poster_image: null,
      poster_image_srcset: null,
      thumbnail_url: null, // No thumbnail at all - will show placeholder
      thumbnail_type: null,
      thumbnail_timestamp: null,
      thumbnail_metadata: null,
      credits: [],
      order_index: 5,
      is_featured: false,
      is_published: true,
      created_at: "2024-01-05T00:00:00Z",
      updated_at: "2024-01-05T00:00:00Z",
    },
    {
      id: "6",
      title: "Draft Project",
      client: "Test Client",
      category: "Test",
      data_cat: null,
      languages: "English",
      classification: "Test",
      vimeo_id: null,
      video_url: null,
      poster_image: "https://picsum.photos/seed/6/1920/1080",
      poster_image_srcset: null,
      thumbnail_url: "https://picsum.photos/seed/6/1920/1080",
      thumbnail_type: "custom",
      thumbnail_timestamp: null,
      thumbnail_metadata: null,
      credits: [],
      order_index: 6,
      is_featured: false,
      is_published: false, // This should NOT appear in preview
      created_at: "2024-01-06T00:00:00Z",
      updated_at: "2024-01-06T00:00:00Z",
    },
  ];

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="p-8 bg-white rounded-lg shadow-lg dark:bg-gray-800">
          <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
            PortfolioPreview Component Test
          </h1>

          <div className="mb-6 space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
              <h2 className="mb-2 text-lg font-semibold text-blue-900 dark:text-blue-300">
                Test Instructions
              </h2>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li>✓ Click "Open Preview" to launch the modal</li>
                <li>✓ Test Desktop/Tablet/Mobile view modes</li>
                <li>✓ Verify projects are sorted by order_index</li>
                <li>✓ Verify only published projects appear (5 out of 6)</li>
                <li>✓ Check thumbnail display (custom, video_frame, poster_image, placeholder)</li>
                <li>✓ Test closing with X button, Close button, or Escape key</li>
                <li>✓ Verify modal prevents body scroll</li>
                <li>✓ Check responsive grid layout changes per view mode</li>
              </ul>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
              <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                Sample Data Summary
              </h2>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li>• Total Projects: {sampleProjects.length}</li>
                <li>
                  • Published Projects:{" "}
                  {sampleProjects.filter((p) => p.is_published).length}
                </li>
                <li>
                  • Featured Projects:{" "}
                  {sampleProjects.filter((p) => p.is_featured).length}
                </li>
                <li>
                  • With Custom Thumbnails:{" "}
                  {
                    sampleProjects.filter((p) => p.thumbnail_type === "custom")
                      .length
                  }
                </li>
                <li>
                  • With Video Frame Thumbnails:{" "}
                  {
                    sampleProjects.filter(
                      (p) => p.thumbnail_type === "video_frame"
                    ).length
                  }
                </li>
                <li>
                  • Without Thumbnails:{" "}
                  {
                    sampleProjects.filter(
                      (p) => !p.thumbnail_url && !p.poster_image
                    ).length
                  }
                </li>
              </ul>
            </div>
          </div>

          <button
            onClick={() => setShowPreview(true)}
            className="w-full px-6 py-3 text-lg font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Open Preview
          </button>

          <div className="mt-6">
            <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              Expected Behavior
            </h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>
                <strong>Requirements Validation:</strong>
              </p>
              <ul className="ml-4 space-y-1 list-disc">
                <li>
                  <strong>8.1:</strong> Preview button opens modal ✓
                </li>
                <li>
                  <strong>8.2:</strong> Modal shows portfolio website layout ✓
                </li>
                <li>
                  <strong>8.3:</strong> Films displayed with current thumbnails
                  and order ✓
                </li>
                <li>
                  <strong>8.4:</strong> View mode toggle (desktop/tablet/mobile)
                  ✓
                </li>
                <li>
                  <strong>8.5:</strong> Closing preserves edit state (no data
                  modification) ✓
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* PortfolioPreview Modal */}
      {showPreview && (
        <PortfolioPreview
          projects={sampleProjects}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
