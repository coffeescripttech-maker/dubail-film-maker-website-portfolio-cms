"use client";
import React, { useState } from "react";

interface ProjectFiltersProps {
  filters: {
    category: string;
    featured: string;
    published: string;
    search: string;
  };
  onFiltersChange: (filters: any) => void;
}

export default function ProjectFilters({ filters, onFiltersChange }: ProjectFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      category: '',
      featured: '',
      published: '',
      search: ''
    });
  };

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'government', label: 'Government' },
    { value: 'corporate', label: 'Corporate' },
    { value: 'tourism', label: 'Tourism' },
    { value: 'business', label: 'Business' }
  ];

  const featuredOptions = [
    { value: '', label: 'All Projects' },
    { value: 'true', label: 'Featured Only' },
    { value: 'false', label: 'Not Featured' }
  ];

  const publishedOptions = [
    { value: '', label: 'All Status' },
    { value: 'true', label: 'Published' },
    { value: 'false', label: 'Draft' }
  ];

  // Check if any filters are active
  const hasActiveFilters = filters.category || filters.featured || filters.published || filters.search;
  const activeFilterCount = [filters.category, filters.featured, filters.published, filters.search].filter(Boolean).length;

  return (
    <div className="space-y-3">
      {/* Compact Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search - Always Visible */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search projects..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-blue-600"
            />
          </div>
        </div>

        {/* Quick Filters - Compact Dropdowns */}
        <select
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="h-10 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-blue-600"
        >
          {categoryOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        <select
          value={filters.featured}
          onChange={(e) => handleFilterChange('featured', e.target.value)}
          className="h-10 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-blue-600"
        >
          {featuredOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        <select
          value={filters.published}
          onChange={(e) => handleFilterChange('published', e.target.value)}
          className="h-10 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-blue-600"
        >
          {publishedOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        {/* Clear Filters Button - Only show when filters are active */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 h-10 px-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            title="Clear all filters"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear {activeFilterCount > 1 && `(${activeFilterCount})`}
          </button>
        )}

        {/* Expand/Collapse Toggle - Optional for future advanced filters */}
        {/* <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1.5 h-10 px-3 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          {isExpanded ? 'Less' : 'More'} Filters
        </button> */}
      </div>

      {/* Active Filters Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Active filters:</span>
          
          {filters.search && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-md dark:bg-blue-900/30 dark:text-blue-300">
              Search: "{filters.search}"
              <button
                onClick={() => handleFilterChange('search', '')}
                className="hover:text-blue-900 dark:hover:text-blue-200"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}

          {filters.category && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-md dark:bg-purple-900/30 dark:text-purple-300">
              Category: {categoryOptions.find(o => o.value === filters.category)?.label}
              <button
                onClick={() => handleFilterChange('category', '')}
                className="hover:text-purple-900 dark:hover:text-purple-200"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}

          {filters.featured && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-md dark:bg-yellow-900/30 dark:text-yellow-300">
              {featuredOptions.find(o => o.value === filters.featured)?.label}
              <button
                onClick={() => handleFilterChange('featured', '')}
                className="hover:text-yellow-900 dark:hover:text-yellow-200"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}

          {filters.published && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-md dark:bg-green-900/30 dark:text-green-300">
              {publishedOptions.find(o => o.value === filters.published)?.label}
              <button
                onClick={() => handleFilterChange('published', '')}
                className="hover:text-green-900 dark:hover:text-green-200"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
        </div>
      )}

      {/* Expanded Filters Section - For future advanced filters */}
      {isExpanded && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {/* Add more advanced filters here in the future */}
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Advanced filters coming soon...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}