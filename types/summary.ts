// Summary types matching backend API structure

export interface TranscriptSegment {
    timestamp: string
    text: string
    startSeconds?: number
    endSeconds?: number
  }
  
  export interface VideoMetadata {
    videoId: string
    title: string
    channelName: string
    duration?: string
    url: string
    thumbnailUrl?: string
    description?: string
    publishedAt?: string
    viewCount?: number
    likeCount?: number
  }
  
  export interface Summary {
    id: string
    title: string
    keyPoints: string[]
    fullSummary: string
    tags: string[]
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
    videoMetadata: VideoMetadata
    transcript?: TranscriptSegment[]
    transcriptText?: string
    createdAt: string
    updatedAt: string
    saved?: boolean
  }
  
  export interface SummaryStats {
    totalSummaries: number
    summariesThisMonth: number
    completedSummaries: number
    failedSummaries: number
    averageSummaryLength: number
  }
  
  export interface PaginatedSummaries {
    data: Summary[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
  }
  
  // Request/Response types for API calls
  export interface GenerateSummaryRequest {
    transcript: TranscriptSegment[]
    videoMetadata: VideoMetadata
  }
  
  export interface SaveSummaryRequest {
    title: string
    keyPoints: string[]
    fullSummary: string
    tags: string[]
    videoMetadata: VideoMetadata
    transcript?: TranscriptSegment[]
    transcriptText?: string
  }
  
  export interface UpdateSummaryRequest {
    title?: string
    keyPoints?: string[]
    fullSummary?: string
    tags?: string[]
  }
  
  export interface SummaryQueryParams {
    page?: number
    limit?: number
    search?: string
    status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'all'
    videoId?: string
    startDate?: string
    endDate?: string
    sortBy?: 'createdAt' | 'title' | 'videoTitle'
    sortOrder?: 'asc' | 'desc'
  }
  
  // Filter and sort options for UI
  export interface SummaryFilters {
    search: string
    tags: string[]
    status: string
    dateRange: {
      from?: Date
      to?: Date
    }
    sortBy: 'createdAt' | 'title' | 'videoTitle'
    sortOrder: 'asc' | 'desc'
  }
  
  // UI state types
  export interface SummaryViewState {
    view: 'grid' | 'list'
    selectedSummaries: string[]
    isLoading: boolean
    error: string | null
  }
  
  // Modal/Dialog types
  export interface SummaryModalState {
    isOpen: boolean
    mode: 'view' | 'edit' | 'create'
    summary: Summary | null
  }
  
  // Summary card display data
  export interface SummaryCardData {
    id: string
    title: string
    videoTitle: string
    channelName: string
    keyPoints: string[]
    tags: string[]
    duration?: string
    thumbnailUrl?: string
    videoUrl: string
    createdAt: string
    status: Summary['status']
  }
  
  // Dashboard stats
  export interface DashboardStats {
    totalSummaries: number
    completedSummaries: number
    pendingSummaries: number
    failedSummaries: number
    summariesThisWeek: number
    summariesThisMonth: number
    averageSummaryLength: number
    topTags: Array<{ tag: string; count: number }>
    recentActivity: Array<{
      id: string
      type: 'created' | 'updated' | 'deleted'
      summaryTitle: string
      timestamp: string
    }>
  }
  
  // Export/Import types
  export interface ExportSummaryData {
    summaries: Summary[]
    metadata: {
      exportedAt: string
      totalCount: number
      version: string
    }
  }
  
  // API response wrapper
  export interface ApiResponse<T> {
    success: boolean
    data?: T
    error?: string
    message?: string
  }
  
  // Summary service endpoints
  export const SUMMARY_ENDPOINTS = {
    LIST: '/summary',
    GET_BY_ID: (id: string) => `/summary/${id}`,
    CREATE: '/summary/save',
    UPDATE: (id: string) => `/summary/${id}`,
    DELETE: (id: string) => `/summary/${id}`,
    GET_BY_VIDEO_ID: (videoId: string) => `/summary/video/${videoId}`,
    GENERATE: '/summary/generate',
    STATS: '/summary/stats',
  } as const
  
  // Common utility types
  export type SummaryStatus = Summary['status']
  export type SortField = SummaryQueryParams['sortBy']
  export type SortOrder = SummaryQueryParams['sortOrder']
  
  // Validation schemas (for form validation)
  export interface CreateSummaryFormData {
    title: string
    keyPoints: string[]
    fullSummary: string
    tags: string[]
    videoUrl: string
  }
  
  export interface EditSummaryFormData {
    title: string
    keyPoints: string[]
    fullSummary: string
    tags: string[]
  }
  
  // Chrome extension sync types
  export interface ExtensionSummarySync {
    type: 'SUMMARY_CREATED' | 'SUMMARY_UPDATED' | 'SUMMARY_DELETED'
    summary: Summary
    timestamp: string
  }
  
  // Search and filter utilities
  export interface SearchResult {
    summaries: Summary[]
    total: number
    query: string
    filters: SummaryFilters
  }