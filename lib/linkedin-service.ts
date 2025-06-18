// lib/linkedin-service.ts - FIXED for frontend use
import { getApiBaseUrl } from '@/lib/utils'
import { authService } from '@/lib/auth-service'

export interface LinkedinPost {
  id: string
  title?: string | null
  content: string
  author: string
  postUrl: string
  linkedinPostId?: string | null
  platform: string
  engagement?: {
    likes?: number
    comments?: number
    shares?: number
  } | null
  metadata?: {
    timestamp?: string
    source?: string
    [key: string]: unknown
  } | null
  savedAt: string
  createdAt: string
  updatedAt: string
}

export interface LinkedinPostStats {
  totalPosts: number
  postsThisMonth: number
  postsThisWeek: number
  topAuthors: Array<{
    author: string
    count: number
  }>
  recentActivity: Array<{
    id: string
    title: string
    author: string
    savedAt: string
  }>
}

export interface LinkedinPostQueryParams {
  page?: number
  limit?: number
  search?: string
  author?: string
  startDate?: string
  endDate?: string
  sortBy?: 'savedAt' | 'createdAt' | 'author' | 'title'
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedLinkedinPosts {
  data: LinkedinPost[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface SaveLinkedinPostRequest {
  title?: string
  content: string
  author: string
  postUrl: string
  linkedinPostId?: string
  platform?: string
  engagement?: {
    likes?: number
    comments?: number
    shares?: number
  }
  metadata?: {
    timestamp?: string
    source?: string
    [key: string]: unknown
  }
}

export interface UpdateLinkedinPostRequest {
  title?: string
  content?: string
  author?: string
  engagement?: {
    likes?: number
    comments?: number
    shares?: number
  }
  metadata?: {
    timestamp?: string
    source?: string
    [key: string]: unknown
  }
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

class LinkedinService {
  private baseUrl: string

  constructor() {
    this.baseUrl = getApiBaseUrl()
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`
      const token = authService.getAccessToken()

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
        credentials: 'include',
        ...options,
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle token expiration
        if (response.status === 401) {
          const refreshed = await authService.autoRefreshToken()
          if (refreshed) {
            // Retry the request with new token
            return this.makeRequest(endpoint, options)
          }
        }

        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        }
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      }
    } catch (error) {
      console.error('LinkedIn API request failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      }
    }
  }

  /**
   * Save LinkedIn post
   */
  async savePost(data: SaveLinkedinPostRequest): Promise<ApiResponse<LinkedinPost>> {
    return this.makeRequest<LinkedinPost>('/linkedin/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Get paginated list of LinkedIn posts with optional filters
   * FIXED: Removed userId parameter since it's handled by auth middleware
   */
  async getPosts(params: LinkedinPostQueryParams = {}): Promise<ApiResponse<PaginatedLinkedinPosts>> {
    const queryString = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryString.append(key, String(value))
      }
    })

    const endpoint = `/linkedin/posts?${queryString.toString()}`
    return this.makeRequest<PaginatedLinkedinPosts>(endpoint)
  }

  /**
   * Get single LinkedIn post by ID
   * FIXED: Removed userId parameter
   */
  async getPostById(id: string): Promise<ApiResponse<LinkedinPost>> {
    return this.makeRequest<LinkedinPost>(`/linkedin/posts/${id}`)
  }

  /**
   * Update LinkedIn post
   * FIXED: Removed userId parameter
   */
  async updatePost(id: string, data: UpdateLinkedinPostRequest): Promise<ApiResponse<LinkedinPost>> {
    return this.makeRequest<LinkedinPost>(`/linkedin/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  /**
   * Delete LinkedIn post
   * FIXED: Removed userId parameter
   */
  async deletePost(id: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(`/linkedin/posts/${id}`, {
      method: 'DELETE',
    })
  }

  /**
   * Get LinkedIn post statistics
   * FIXED: Removed userId parameter
   */
  async getPostStats(): Promise<ApiResponse<LinkedinPostStats>> {
    return this.makeRequest<LinkedinPostStats>('/linkedin/posts/stats')
  }

  /**
   * Search LinkedIn posts by text
   */
  async searchPosts(
    query: string,
    params: Omit<LinkedinPostQueryParams, 'search'> = {}
  ): Promise<ApiResponse<PaginatedLinkedinPosts>> {
    return this.getPosts({
      ...params,
      search: query,
    })
  }

  /**
   * Get posts by author
   */
  async getPostsByAuthor(
    author: string,
    params: Omit<LinkedinPostQueryParams, 'author'> = {}
  ): Promise<ApiResponse<PaginatedLinkedinPosts>> {
    return this.getPosts({
      ...params,
      author,
    })
  }

  /**
   * Get recent LinkedIn posts
   */
  async getRecentPosts(limit: number = 10): Promise<ApiResponse<PaginatedLinkedinPosts>> {
    return this.getPosts({
      limit,
      sortBy: 'savedAt',
      sortOrder: 'desc',
    })
  }

  /**
   * Bulk delete LinkedIn posts
   */
  async bulkDeletePosts(ids: string[]): Promise<ApiResponse<{ deletedCount: number }>> {
    return this.makeRequest<{ deletedCount: number }>('/linkedin/posts/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ postIds: ids }),
    })
  }

  /**
   * Export LinkedIn posts to JSON
   */
  async exportPosts(ids?: string[]): Promise<ApiResponse<LinkedinPost[]>> {
    if (ids && ids.length > 0) {
      // Export specific posts
      const results = await Promise.allSettled(
        ids.map(id => this.getPostById(id))
      )

      const posts = results
        .filter((result): result is PromiseFulfilledResult<ApiResponse<LinkedinPost>> =>
          result.status === 'fulfilled' && result.value.success
        )
        .map(result => result.value.data!)

      return { success: true, data: posts }
    } else {
      // Export all posts
      const response = await this.getPosts({ limit: 1000 })
      if (response.success && response.data) {
        return { success: true, data: response.data.data }
      }
      return response as unknown as ApiResponse<LinkedinPost[]>
    }
  }

  /**
   * Sync with Chrome extension
   */
  async syncWithExtension(): Promise<void> {
    // Implementation would depend on extension communication
    console.log('LinkedIn posts synced with extension')
  }
}

// Export singleton instance
export const linkedinService = new LinkedinService()