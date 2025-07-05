/* eslint-disable react-hooks/exhaustive-deps */
// hooks/use-summaries.ts - OPTIMIZED VERSION
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
 * OPTIMIZED VERSION - Reduced re-renders, better performance
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

  // Use refs to prevent infinite re-renders
  const paramsRef = useRef(params)
  const fetchingRef = useRef(false)
  
  useEffect(() => {
    paramsRef.current = params
  }, [params])

  // OPTIMIZED: Batched fetch with duplicate call prevention
  const fetchSummaries = useCallback(async (queryParams?: SummaryQueryParams, force = false) => {
    if (!isAuthenticated) return

    // Prevent duplicate calls
    if (fetchingRef.current && !force) {
      console.log('🔄 Summary fetch already in progress, skipping...')
      return
    }

    try {
      fetchingRef.current = true
      setIsLoading(true)
      setError(null)

      const currentParams = queryParams || paramsRef.current
      console.log('🔄 Fetching summaries with params:', currentParams)
      
      const response = await summaryService.getSummaries(currentParams)
      console.log('📡 Summaries response:', response)

      if (response.success && response.data) {
        // Batch state updates to prevent multiple re-renders
        const newSummaries = response.data.data
        const newPagination = response.data.pagination
        
        // Only update if data actually changed
        setSummaries(prevSummaries => {
          const hasChanged = JSON.stringify(prevSummaries) !== JSON.stringify(newSummaries)
          return hasChanged ? newSummaries : prevSummaries
        })
        
        setPagination(prevPagination => {
          const hasChanged = JSON.stringify(prevPagination) !== JSON.stringify(newPagination)
          return hasChanged ? newPagination : prevPagination
        })
        
        console.log('✅ Summaries loaded:', newSummaries.length)
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
      console.error('❌ Error fetching summaries:', errorMessage)
      setError(errorMessage)
      setSummaries([])
    } finally {
      setIsLoading(false)
      fetchingRef.current = false
    }
  }, [isAuthenticated])

  // OPTIMIZED: Throttled parameter updates
  const updateParams = useCallback((newParams: Partial<SummaryQueryParams>) => {
    const updatedParams = { ...paramsRef.current, ...newParams }
    
    // Only update if params actually changed
    const hasChanged = JSON.stringify(updatedParams) !== JSON.stringify(paramsRef.current)
    if (!hasChanged) return
    
    setParams(updatedParams)
    
    // Debounce the fetch call
    const timeoutId = setTimeout(() => {
      fetchSummaries(updatedParams, true)
    }, 100)
    
    return () => clearTimeout(timeoutId)
  }, [fetchSummaries])

  // Search summaries with debouncing
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
    console.log('🔄 Refreshing summaries...')
    fetchSummaries(paramsRef.current, true)
  }, [fetchSummaries])

  // Clear filters
  const clearFilters = useCallback(() => {
    const clearedParams = {
      page: 1,
      limit: paramsRef.current.limit,
      sortBy: 'createdAt' as const,
      sortOrder: 'desc' as const,
    }
    setParams(clearedParams)
    fetchSummaries(clearedParams, true)
  }, [fetchSummaries])

  // OPTIMIZED: Initial fetch with dependency array to prevent loops
  useEffect(() => {
    let mounted = true
    
    if (isAuthenticated && mounted) {
      console.log('🔄 Initial summaries fetch...')
      fetchSummaries(undefined, true)
    }
    
    return () => {
      mounted = false
    }
  }, [isAuthenticated]) // Only depend on authentication status

  // Listen for extension sync events
  useEffect(() => {
    const handleSummarySync = () => {
      console.log('🔄 Summary sync event received')
      if (!fetchingRef.current) {
        refresh()
      }
    }

    window.addEventListener('summarySync', handleSummarySync)
    return () => window.removeEventListener('summarySync', handleSummarySync)
  }, [refresh])

  return {
    summaries,
    pagination,
    isLoading,
    error,
    params: paramsRef.current,
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
 * OPTIMIZED VERSION
 */
export function useSummary(id?: string) {
  const { isAuthenticated } = useAuth()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchingRef = useRef(false)

  const fetchSummary = useCallback(async (summaryId: string) => {
    if (!isAuthenticated || fetchingRef.current) return

    try {
      fetchingRef.current = true
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
      fetchingRef.current = false
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (id && isAuthenticated && !fetchingRef.current) {
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
 * OPTIMIZED VERSION
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
 * OPTIMIZED VERSION
 */
export function useSummaryStats() {
  const { isAuthenticated } = useAuth()
  const [stats, setStats] = useState<SummaryStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchingRef = useRef(false)

  const fetchStats = useCallback(async () => {
    if (!isAuthenticated || fetchingRef.current) return

    try {
      fetchingRef.current = true
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
      fetchingRef.current = false
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
 * OPTIMIZED VERSION
 */
export function usePopularTags(limit: number = 20) {
  const { isAuthenticated } = useAuth()
  const [tags, setTags] = useState<Array<{ tag: string; count: number }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchingRef = useRef(false)

  const fetchTags = useCallback(async () => {
    if (!isAuthenticated || fetchingRef.current) return

    try {
      fetchingRef.current = true
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
      fetchingRef.current = false
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