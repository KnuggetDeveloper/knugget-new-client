/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Tag,
  FileCheck,
  RotateCcw,
  Grid3X3,
  List,
  Download,
  Plus,
} from 'lucide-react'
import { SummaryQueryParams } from '@/types/summary'
import {
  Button,
} from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SummaryFiltersProps {
  params: SummaryQueryParams
  onSearch: (query: string) => void
  onFilterByStatus: (status: string) => void
  onSort: (sortBy: SummaryQueryParams['sortBy'], sortOrder: SummaryQueryParams['sortOrder']) => void
  onClearFilters: () => void
  onViewChange?: (view: 'grid' | 'list') => void
  onExport?: () => void
  onCreateNew?: () => void
  view?: 'grid' | 'list'
  isLoading?: boolean
  popularTags?: Array<{ tag: string; count: number }>
}

export function SummaryFilters({
  params,
  onSearch,
  onFilterByStatus,
  onSort,
  onClearFilters,
  onViewChange,
  onExport,
  onCreateNew,
  view = 'grid',
  isLoading = false,
  popularTags = [],
}: SummaryFiltersProps) {
  const [searchQuery, setSearchQuery] = useState(params.search || '')
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  // Update search query when params change
  useEffect(() => {
    setSearchQuery(params.search || '')
  }, [params.search])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchQuery)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    // Debounced search - trigger search after user stops typing
    clearTimeout((window as any).searchTimeout)
    ;(window as any).searchTimeout = setTimeout(() => {
      onSearch(e.target.value)
    }, 500)
  }

  const handleStatusFilter = (status: string) => {
    onFilterByStatus(status)
  }

  const handleSortChange = (field: SummaryQueryParams['sortBy']) => {
    const newOrder = params.sortBy === field && params.sortOrder === 'desc' ? 'asc' : 'desc'
    onSort(field, newOrder)
  }

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag)
    onSearch(tag)
  }

  const getSortIcon = (field: SummaryQueryParams['sortBy']) => {
    if (params.sortBy !== field) return null
    return params.sortOrder === 'desc' ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />
  }

  const activeFiltersCount = [
    params.search,
    params.status && params.status !== 'all',
    params.startDate,
    params.endDate,
  ].filter(Boolean).length

  return (
    <div className="space-y-4">
      {/* Main Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Left Side: Search and Filters */}
        <div className="flex flex-1 items-center space-x-4 w-full sm:w-auto">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search summaries..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </form>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="relative"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-knugget-500 text-white text-xs flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center space-x-2">
          {/* View Toggle */}
          {onViewChange && (
            <div className="flex items-center border rounded-md">
              <Button
                variant={view === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewChange('grid')}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={view === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewChange('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Export */}
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}

          {/* Create New */}
          {onCreateNew && (
            <Button  size="sm" onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              New Summary
            </Button>
          )}
        </div>
      </div>

      {/* Expanded Filters */}
      {isFiltersOpen && (
        <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center">
                <FileCheck className="h-4 w-4 mr-2" />
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'COMPLETED', label: 'Completed' },
                  { value: 'PROCESSING', label: 'Processing' },
                  { value: 'FAILED', label: 'Failed' },
                  { value: 'PENDING', label: 'Pending' },
                ].map((status) => (
                  <Button
                    key={status.value}
                    variant={
                      (params.status || 'all') === status.value ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() => handleStatusFilter(status.value)}
                    className="text-xs"
                  >
                    {status.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'createdAt', label: 'Date' },
                  { value: 'title', label: 'Title' },
                  { value: 'videoTitle', label: 'Video' },
                ].map((sort) => (
                  <Button
                    key={sort.value}
                    variant={params.sortBy === sort.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSortChange(sort.value as SummaryQueryParams['sortBy'])}
                    className="text-xs flex items-center"
                  >
                    {sort.label}
                    {getSortIcon(sort.value as SummaryQueryParams['sortBy'])}
                  </Button>
                ))}
              </div>
            </div>

            {/* Popular Tags */}
            {popularTags.length > 0 && (
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium flex items-center">
                  <Tag className="h-4 w-4 mr-2" />
                  Popular Tags
                </label>
                <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                  {popularTags.slice(0, 10).map((tagData, index) => (
                    <button
                      key={index}
                      onClick={() => handleTagClick(tagData.tag)}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                    >
                      {tagData.tag}
                      <span className="ml-1 text-xs text-muted-foreground">
                        {tagData.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Filter Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {activeFiltersCount > 0 && (
                <span>{activeFiltersCount} filter{activeFiltersCount === 1 ? '' : 's'} applied</span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                disabled={activeFiltersCount === 0}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFiltersOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && !isFiltersOpen && (
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-muted-foreground">Active filters:</span>
          {params.search && (
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-knugget-100 text-knugget-800 dark:bg-knugget-900 dark:text-knugget-200">
              Search: &quot;{params.search}&quot;
            </span>
          )}
          {params.status && (
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              Status: {params.status}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Clear
          </Button>
        </div>
      )}
    </div>
  )
}