'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Summary,
  SummaryStats,
  SummaryQueryParams,
  SaveSummaryRequest,
  UpdateSummaryRequest,
} from '@/types/summary'
import { summaryService } from '@/lib/summary-service'
import { formatError } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'

/**
 * Hook for managing summaries list with pagination, filtering, and search
 */
export function useSummaries(initialParams: SummaryQueryParams = {}) {
  const { isAuthenticated } = useAuth()
  const [summaries, setSummaries] = useState<Summary[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [params, setParams] = useState<SummaryQueryParams>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...initialParams,
  })

  // Fetch summaries
  const fetchSummaries = useCallback(async (queryParams?: SummaryQueryParams) => {
    if (!isAuthenticated) return

    try {
      setIsLoading(true)
      setError(null)

      const currentParams = queryParams || params
      const response = await summaryService.getSummaries(currentParams)

      if (response.success && response.data) {
        setSummaries(response.data.data)
        setPagination(response.data.pagination)
      } else {
        setError(response.error || 'Failed to fetch summaries')
        setSummaries([])
        setPagination({
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        })
      }
    } catch (err) {
      const errorMessage = formatError(err)
      setError(errorMessage)
      setSummaries([])
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, params])

  // Update query parameters
  const updateParams = useCallback((newParams: Partial<SummaryQueryParams>) => {
    const updatedParams = { ...params, ...newParams }
    setParams(updatedParams)
    fetchSummaries(updatedParams)
  }, [params, fetchSummaries])

  // Search summaries
  const search = useCallback((query: string) => {
    updateParams({ search: query, page: 1 })
  }, [updateParams])

  // Filter by status
  const filterByStatus = useCallback((status: string) => {
    updateParams({ 
      status: status === 'all' ? undefined : status as SummaryQueryParams['status'], 
      page: 1 
    })
  }, [updateParams])

  // Sort summaries
  const sort = useCallback((sortBy: SummaryQueryParams['sortBy'], sortOrder: SummaryQueryParams['sortOrder']) => {
    updateParams({ sortBy, sortOrder, page: 1 })
  }, [updateParams])

  // Change page
  const changePage = useCallback((page: number) => {
    updateParams({ page })
  }, [updateParams])

  // Change page size
  const changePageSize = useCallback((limit: number) => {
    updateParams({ limit, page: 1 })
  }, [updateParams])

  // Refresh summaries
  const refresh = useCallback(() => {
    fetchSummaries()
  }, [fetchSummaries])

  // Clear filters
  const clearFilters = useCallback(() => {
    const clearedParams = {
      page: 1,
      limit: params.limit,
      sortBy: 'createdAt' as const,
      sortOrder: 'desc' as const,
    }
    setParams(clearedParams)
    fetchSummaries(clearedParams)
  }, [params.limit, fetchSummaries])

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchSummaries()
    }
  }, [fetchSummaries, isAuthenticated])

  // Listen for extension sync events
  useEffect(() => {
    const handleSummarySync = () => {
      refresh()
    }

    window.addEventListener('summarySync', handleSummarySync)
    return () => window.removeEventListener('summarySync', handleSummarySync)
  }, [refresh])

  return {
    summaries,
    pagination,
    isLoading,
    error,
    params,
    search,
    filterByStatus,
    sort,
    changePage,
    changePageSize,
    refresh,
    clearFilters,
  }
}

/**
 * Hook for managing a single summary
 */
export function useSummary(id?: string) {
  const { isAuthenticated } = useAuth()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSummary = useCallback(async (summaryId: string) => {
    if (!isAuthenticated) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await summaryService.getSummaryById(summaryId)

      if (response.success && response.data) {
        setSummary(response.data)
      } else {
        setError(response.error || 'Failed to fetch summary')
        setSummary(null)
      }
    } catch (err) {
      const errorMessage = formatError(err)
      setError(errorMessage)
      setSummary(null)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (id && isAuthenticated) {
      fetchSummary(id)
    }
  }, [id, isAuthenticated, fetchSummary])

  return {
    summary,
    isLoading,
    error,
    refresh: () => id && fetchSummary(id),
  }
}

/**
 * Hook for summary CRUD operations
 */
export function useSummaryActions() {
  const { isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const saveSummary = useCallback(async (data: SaveSummaryRequest): Promise<Summary | null> => {
    if (!isAuthenticated) return null

    try {
      setIsLoading(true)
      setError(null)

      const response = await summaryService.saveSummary(data)

      if (response.success && response.data) {
        // Sync with extension
        summaryService.syncWithExtension()
        return response.data
      } else {
        setError(response.error || 'Failed to save summary')
        return null
      }
    } catch (err) {
      const errorMessage = formatError(err)
      setError(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  const updateSummary = useCallback(async (id: string, data: UpdateSummaryRequest): Promise<Summary | null> => {
    if (!isAuthenticated) return null

    try {
      setIsLoading(true)
      setError(null)

      const response = await summaryService.updateSummary(id, data)

      if (response.success && response.data) {
        // Sync with extension
        summaryService.syncWithExtension()
        return response.data
      } else {
        setError(response.error || 'Failed to update summary')
        return null
      }
    } catch (err) {
      const errorMessage = formatError(err)
      setError(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  const deleteSummary = useCallback(async (id: string): Promise<boolean> => {
    if (!isAuthenticated) return false

    try {
      setIsLoading(true)
      setError(null)

      const response = await summaryService.deleteSummary(id)

      if (response.success) {
        // Sync with extension
        summaryService.syncWithExtension()
        return true
      } else {
        setError(response.error || 'Failed to delete summary')
        return false
      }
    } catch (err) {
      const errorMessage = formatError(err)
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  const bulkDeleteSummaries = useCallback(async (ids: string[]): Promise<boolean> => {
    if (!isAuthenticated || ids.length === 0) return false

    try {
      setIsLoading(true)
      setError(null)

      const response = await summaryService.bulkDeleteSummaries(ids)

      if (response.success) {
        // Sync with extension
        summaryService.syncWithExtension()
        return true
      } else {
        setError(response.error || 'Failed to delete summaries')
        return false
      }
    } catch (err) {
      const errorMessage = formatError(err)
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    saveSummary,
    updateSummary,
    deleteSummary,
    bulkDeleteSummaries,
    isLoading,
    error,
    clearError,
  }
}

/**
 * Hook for summary statistics
 */
export function useSummaryStats() {
  const { isAuthenticated } = useAuth()
  const [stats, setStats] = useState<SummaryStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await summaryService.getSummaryStats()

      if (response.success && response.data) {
        setStats(response.data)
      } else {
        setError(response.error || 'Failed to fetch statistics')
        setStats(null)
      }
    } catch (err) {
      const errorMessage = formatError(err)
      setError(errorMessage)
      setStats(null)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats()
    }
  }, [isAuthenticated, fetchStats])

  return {
    stats,
    isLoading,
    error,
    refresh: fetchStats,
  }
}

/**
 * Hook for popular tags
 */
export function usePopularTags(limit: number = 20) {
  const { isAuthenticated } = useAuth()
  const [tags, setTags] = useState<Array<{ tag: string; count: number }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTags = useCallback(async () => {
    if (!isAuthenticated) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await summaryService.getPopularTags(limit)

      if (response.success && response.data) {
        setTags(response.data)
      } else {
        setError(response.error || 'Failed to fetch tags')
        setTags([])
      }
    } catch (err) {
      const errorMessage = formatError(err)
      setError(errorMessage)
      setTags([])
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, limit])

  useEffect(() => {
    if (isAuthenticated) {
      fetchTags()
    }
  }, [isAuthenticated, fetchTags])

  return {
    tags,
    isLoading,
    error,
    refresh: fetchTags,
  }
}