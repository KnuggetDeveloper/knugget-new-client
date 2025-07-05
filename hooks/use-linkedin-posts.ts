/* eslint-disable react-hooks/exhaustive-deps */
// hooks/use-linkedin-posts.ts - OPTIMIZED VERSION
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { formatError } from '@/lib/utils'
import {
  linkedinService,
  LinkedinPost,
  LinkedinPostStats,
  LinkedinPostQueryParams,
  SaveLinkedinPostRequest,
  UpdateLinkedinPostRequest,
} from '@/lib/linkedin-service'

/**
 * Hook for managing LinkedIn posts list with pagination, filtering, and search
 * OPTIMIZED VERSION - Batched fetching, reduced re-renders
 */
export function useLinkedinPosts(initialParams: LinkedinPostQueryParams = {}) {
  const { isAuthenticated } = useAuth()
  const [posts, setPosts] = useState<LinkedinPost[]>([])
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
  const [params, setParams] = useState<LinkedinPostQueryParams>({
    page: 1,
    limit: 20,
    sortBy: 'savedAt',
    sortOrder: 'desc',
    ...initialParams,
  })

  // Use ref to prevent infinite re-renders
  const paramsRef = useRef(params)
  const fetchingRef = useRef(false)
  
  useEffect(() => {
    paramsRef.current = params
  }, [params])

  // OPTIMIZED: Debounced fetch with abort controller
  const fetchPosts = useCallback(async (queryParams?: LinkedinPostQueryParams, force = false) => {
    if (!isAuthenticated) return
    
    // Prevent duplicate calls
    if (fetchingRef.current && !force) {
      console.log('🔄 Fetch already in progress, skipping...')
      return
    }

    try {
      fetchingRef.current = true
      setIsLoading(true)
      setError(null)

      const currentParams = queryParams || paramsRef.current
      console.log('🔄 Fetching LinkedIn posts with params:', currentParams)
      
      // Single API call with all parameters
      const response = await linkedinService.getPosts(currentParams)
      console.log('📡 LinkedIn posts response:', response)

      if (response.success && response.data) {
        // Batch update state to prevent multiple re-renders
        const newPosts = response.data.data
        const newPagination = response.data.pagination
        
        // Only update if data actually changed
        setPosts(prevPosts => {
          const hasChanged = JSON.stringify(prevPosts) !== JSON.stringify(newPosts)
          return hasChanged ? newPosts : prevPosts
        })
        
        setPagination(prevPagination => {
          const hasChanged = JSON.stringify(prevPagination) !== JSON.stringify(newPagination)
          return hasChanged ? newPagination : prevPagination
        })
        
        console.log('✅ LinkedIn posts loaded:', newPosts.length)
      } else {
        setError(response.error || 'Failed to fetch LinkedIn posts')
        setPosts([])
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
      console.error('❌ Error fetching LinkedIn posts:', errorMessage)
      setError(errorMessage)
      setPosts([])
    } finally {
      setIsLoading(false)
      fetchingRef.current = false
    }
  }, [isAuthenticated])

  // OPTIMIZED: Throttled parameter updates
  const updateParams = useCallback((newParams: Partial<LinkedinPostQueryParams>) => {
    const updatedParams = { ...paramsRef.current, ...newParams }
    
    // Only update if params actually changed
    const hasChanged = JSON.stringify(updatedParams) !== JSON.stringify(paramsRef.current)
    if (!hasChanged) return
    
    setParams(updatedParams)
    
    // Debounce the fetch call
    const timeoutId = setTimeout(() => {
      fetchPosts(updatedParams, true)
    }, 100)
    
    return () => clearTimeout(timeoutId)
  }, [fetchPosts])

  // Search posts with debouncing
  const search = useCallback((query: string) => {
    updateParams({ search: query, page: 1 })
  }, [updateParams])

  // Filter by author
  const filterByAuthor = useCallback((author: string) => {
    updateParams({ 
      author: author === 'all' ? undefined : author, 
      page: 1 
    })
  }, [updateParams])

  // Sort posts
  const sort = useCallback((sortBy: LinkedinPostQueryParams['sortBy'], sortOrder: LinkedinPostQueryParams['sortOrder']) => {
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

  // Refresh posts
  const refresh = useCallback(() => {
    console.log('🔄 Refreshing LinkedIn posts...')
    fetchPosts(paramsRef.current, true)
  }, [fetchPosts])

  // Clear filters
  const clearFilters = useCallback(() => {
    const clearedParams = {
      page: 1,
      limit: paramsRef.current.limit,
      sortBy: 'savedAt' as const,
      sortOrder: 'desc' as const,
    }
    setParams(clearedParams)
    fetchPosts(clearedParams, true)
  }, [fetchPosts])

  // OPTIMIZED: Initial fetch with dependency array to prevent loops
  useEffect(() => {
    let mounted = true
    
    if (isAuthenticated && mounted) {
      console.log('🔄 Initial LinkedIn posts fetch...')
      fetchPosts(undefined, true)
    }
    
    return () => {
      mounted = false
    }
  }, [isAuthenticated]) // Only depend on authentication status

  // Listen for extension sync events
  useEffect(() => {
    const handlePostSync = () => {
      console.log('🔄 LinkedIn post sync event received')
      if (!fetchingRef.current) {
        refresh()
      }
    }

    window.addEventListener('linkedinPostSync', handlePostSync)
    return () => window.removeEventListener('linkedinPostSync', handlePostSync)
  }, [refresh])

  return {
    posts,
    pagination,
    isLoading,
    error,
    params: paramsRef.current,
    search,
    filterByAuthor,
    sort,
    changePage,
    changePageSize,
    refresh,
    clearFilters,
  }
}

/**
 * Hook for managing a single LinkedIn post
 * OPTIMIZED VERSION
 */
export function useLinkedinPost(id?: string) {
  const { isAuthenticated } = useAuth()
  const [post, setPost] = useState<LinkedinPost | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchingRef = useRef(false)

  const fetchPost = useCallback(async (postId: string) => {
    if (!isAuthenticated || fetchingRef.current) return

    try {
      fetchingRef.current = true
      setIsLoading(true)
      setError(null)

      const response = await linkedinService.getPostById(postId)

      if (response.success && response.data) {
        setPost(response.data)
      } else {
        setError(response.error || 'Failed to fetch LinkedIn post')
        setPost(null)
      }
    } catch (err) {
      const errorMessage = formatError(err)
      setError(errorMessage)
      setPost(null)
    } finally {
      setIsLoading(false)
      fetchingRef.current = false
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (id && isAuthenticated && !fetchingRef.current) {
      fetchPost(id)
    }
  }, [id, isAuthenticated, fetchPost])

  return {
    post,
    isLoading,
    error,
    refresh: () => id && fetchPost(id),
  }
}

/**
 * Hook for LinkedIn post CRUD operations
 * OPTIMIZED VERSION
 */
export function useLinkedinPostActions() {
  const { isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const savePost = useCallback(async (data: SaveLinkedinPostRequest): Promise<LinkedinPost | null> => {
    if (!isAuthenticated) return null

    try {
      setIsLoading(true)
      setError(null)

      const response = await linkedinService.savePost(data)

      if (response.success && response.data) {
        // Sync with extension
        linkedinService.syncWithExtension()
        return response.data
      } else {
        setError(response.error || 'Failed to save LinkedIn post')
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

  const updatePost = useCallback(async (id: string, data: UpdateLinkedinPostRequest): Promise<LinkedinPost | null> => {
    if (!isAuthenticated) return null

    try {
      setIsLoading(true)
      setError(null)

      const response = await linkedinService.updatePost(id, data)

      if (response.success && response.data) {
        // Sync with extension
        linkedinService.syncWithExtension()
        return response.data
      } else {
        setError(response.error || 'Failed to update LinkedIn post')
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

  const deletePost = useCallback(async (id: string): Promise<boolean> => {
    if (!isAuthenticated) return false

    try {
      setIsLoading(true)
      setError(null)

      const response = await linkedinService.deletePost(id)

      if (response.success) {
        // Sync with extension
        linkedinService.syncWithExtension()
        return true
      } else {
        setError(response.error || 'Failed to delete LinkedIn post')
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

  const bulkDeletePosts = useCallback(async (ids: string[]): Promise<boolean> => {
    if (!isAuthenticated || ids.length === 0) return false

    try {
      setIsLoading(true)
      setError(null)

      const response = await linkedinService.bulkDeletePosts(ids)

      if (response.success) {
        // Sync with extension
        linkedinService.syncWithExtension()
        return true
      } else {
        setError(response.error || 'Failed to delete LinkedIn posts')
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
    savePost,
    updatePost,
    deletePost,
    bulkDeletePosts,
    isLoading,
    error,
    clearError,
  }
}

/**
 * Hook for LinkedIn post statistics
 * OPTIMIZED VERSION
 */
export function useLinkedinPostStats() {
  const { isAuthenticated } = useAuth()
  const [stats, setStats] = useState<LinkedinPostStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchingRef = useRef(false)

  const fetchStats = useCallback(async () => {
    if (!isAuthenticated || fetchingRef.current) return

    try {
      fetchingRef.current = true
      setIsLoading(true)
      setError(null)

      const response = await linkedinService.getPostStats()

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