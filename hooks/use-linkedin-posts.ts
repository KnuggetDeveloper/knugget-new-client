// hooks/use-linkedin-posts.ts - FIXED
'use client'

import { useState, useEffect, useCallback } from 'react'
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

  // Fetch LinkedIn posts - FIXED: Removed userId parameter
  const fetchPosts = useCallback(async (queryParams?: LinkedinPostQueryParams) => {
    if (!isAuthenticated) return

    try {
      setIsLoading(true)
      setError(null)

      const currentParams = queryParams || params
      console.log('🔄 Fetching LinkedIn posts with params:', currentParams)
      
      const response = await linkedinService.getPosts(currentParams)
      console.log('📡 LinkedIn posts response:', response)

      if (response.success && response.data) {
        setPosts(response.data.data)
        setPagination(response.data.pagination)
        console.log('✅ LinkedIn posts loaded:', response.data.data.length)
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
    }
  }, [isAuthenticated, params])

  // Update query parameters
  const updateParams = useCallback((newParams: Partial<LinkedinPostQueryParams>) => {
    const updatedParams = { ...params, ...newParams }
    setParams(updatedParams)
    fetchPosts(updatedParams)
  }, [params, fetchPosts])

  // Search posts
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
    fetchPosts()
  }, [fetchPosts])

  // Clear filters
  const clearFilters = useCallback(() => {
    const clearedParams = {
      page: 1,
      limit: params.limit,
      sortBy: 'savedAt' as const,
      sortOrder: 'desc' as const,
    }
    setParams(clearedParams)
    fetchPosts(clearedParams)
  }, [params.limit, fetchPosts])

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔄 Initial LinkedIn posts fetch...')
      fetchPosts()
    }
  }, [fetchPosts, isAuthenticated])

  // Listen for extension sync events
  useEffect(() => {
    const handlePostSync = () => {
      console.log('🔄 LinkedIn post sync event received')
      refresh()
    }

    window.addEventListener('linkedinPostSync', handlePostSync)
    return () => window.removeEventListener('linkedinPostSync', handlePostSync)
  }, [refresh])

  return {
    posts,
    pagination,
    isLoading,
    error,
    params,
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
 */
export function useLinkedinPost(id?: string) {
  const { isAuthenticated } = useAuth()
  const [post, setPost] = useState<LinkedinPost | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPost = useCallback(async (postId: string) => {
    if (!isAuthenticated) return

    try {
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
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (id && isAuthenticated) {
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
 */
export function useLinkedinPostStats() {
  const { isAuthenticated } = useAuth()
  const [stats, setStats] = useState<LinkedinPostStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return

    try {
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