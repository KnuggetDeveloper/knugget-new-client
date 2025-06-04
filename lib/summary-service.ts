/* eslint-disable @typescript-eslint/no-explicit-any */

// Type for Chrome extension API
interface ChromeAPI {
    storage: {
        sync: {
            set: (items: Record<string, any>) => Promise<void>
            remove: (keys: string | string[]) => Promise<void>
        }
        local: {
            set: (items: Record<string, any>) => Promise<void>
            remove: (keys: string | string[]) => Promise<void>
        }
        onChanged: {
            addListener: (callback: (changes: Record<string, any>, namespace: string) => void) => void
        }
    }
    runtime: {
        sendMessage: (extensionId: string, message: any) => Promise<any>
        onMessage: {
            addListener: (callback: (message: any, sender: any, sendResponse: any) => void) => void
            removeListener: (callback: (message: any, sender: any, sendResponse: any) => void) => void
        }
    }
}

// Type guard for Chrome API
function getChromeAPI(): ChromeAPI | null {
    if (typeof chrome !== 'undefined' && chrome?.storage) {
        return chrome as unknown as ChromeAPI
    }
    return null
}

import {
    Summary,
    SummaryStats,
    PaginatedSummaries,
    GenerateSummaryRequest,
    SaveSummaryRequest,
    UpdateSummaryRequest,
    SummaryQueryParams,
    ApiResponse,
    SUMMARY_ENDPOINTS,
} from '@/types/summary'
import { getApiBaseUrl } from '@/lib/utils'
import { authService } from '@/lib/auth-service'

class SummaryService {
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
            console.error('Summary API request failed:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Network error',
            }
        }
    }

    /**
     * Get paginated list of summaries with optional filters
     */
    async getSummaries(params: SummaryQueryParams = {}): Promise<ApiResponse<PaginatedSummaries>> {
        const queryString = new URLSearchParams()

        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                queryString.append(key, String(value))
            }
        })

        const endpoint = `${SUMMARY_ENDPOINTS.LIST}?${queryString.toString()}`
        return this.makeRequest<PaginatedSummaries>(endpoint)
    }

    /**
     * Get single summary by ID
     */
    async getSummaryById(id: string): Promise<ApiResponse<Summary>> {
        return this.makeRequest<Summary>(SUMMARY_ENDPOINTS.GET_BY_ID(id))
    }

    /**
     * Generate new summary from transcript
     */
    async generateSummary(data: GenerateSummaryRequest): Promise<ApiResponse<Summary>> {
        return this.makeRequest<Summary>(SUMMARY_ENDPOINTS.GENERATE, {
            method: 'POST',
            body: JSON.stringify(data),
        })
    }

    /**
     * Save/create a new summary
     */
    async saveSummary(data: SaveSummaryRequest): Promise<ApiResponse<Summary>> {
        return this.makeRequest<Summary>(SUMMARY_ENDPOINTS.CREATE, {
            method: 'POST',
            body: JSON.stringify(data),
        })
    }

    /**
     * Update existing summary
     */
    async updateSummary(id: string, data: UpdateSummaryRequest): Promise<ApiResponse<Summary>> {
        return this.makeRequest<Summary>(SUMMARY_ENDPOINTS.UPDATE(id), {
            method: 'PUT',
            body: JSON.stringify(data),
        })
    }

    /**
     * Delete summary
     */
    async deleteSummary(id: string): Promise<ApiResponse<void>> {
        return this.makeRequest<void>(SUMMARY_ENDPOINTS.DELETE(id), {
            method: 'DELETE',
        })
    }

    /**
     * Get summary by video ID
     */
    async getSummaryByVideoId(videoId: string): Promise<ApiResponse<Summary | null>> {
        return this.makeRequest<Summary | null>(SUMMARY_ENDPOINTS.GET_BY_VIDEO_ID(videoId))
    }

    /**
     * Get summary statistics
     */
    async getSummaryStats(): Promise<ApiResponse<SummaryStats>> {
        return this.makeRequest<SummaryStats>(SUMMARY_ENDPOINTS.STATS)
    }

    /**
     * Search summaries by text
     */
    async searchSummaries(
        query: string,
        params: Omit<SummaryQueryParams, 'search'> = {}
    ): Promise<ApiResponse<PaginatedSummaries>> {
        return this.getSummaries({
            ...params,
            search: query,
        })
    }

    /**
     * Get summaries by tag
     */
    async getSummariesByTag(
        tag: string,
        params: Omit<SummaryQueryParams, 'search'> = {}
    ): Promise<ApiResponse<PaginatedSummaries>> {
        return this.searchSummaries(tag, params)
    }

    /**
     * Get recent summaries
     */
    async getRecentSummaries(limit: number = 10): Promise<ApiResponse<PaginatedSummaries>> {
        return this.getSummaries({
            limit,
            sortBy: 'createdAt',
            sortOrder: 'desc',
        })
    }

    /**
     * Get summaries by date range
     */
    async getSummariesByDateRange(
        startDate: string,
        endDate: string,
        params: Omit<SummaryQueryParams, 'startDate' | 'endDate'> = {}
    ): Promise<ApiResponse<PaginatedSummaries>> {
        return this.getSummaries({
            ...params,
            startDate,
            endDate,
        })
    }

    /**
     * Bulk delete summaries
     */
    async bulkDeleteSummaries(ids: string[]): Promise<ApiResponse<void>> {
        const results = await Promise.allSettled(
            ids.map(id => this.deleteSummary(id))
        )

        const failures = results.filter(result => result.status === 'rejected')

        if (failures.length > 0) {
            return {
                success: false,
                error: `Failed to delete ${failures.length} summaries`,
            }
        }

        return { success: true }
    }

    /**
     * Export summaries to JSON
     */
    async exportSummaries(ids?: string[]): Promise<ApiResponse<Summary[]>> {
        if (ids && ids.length > 0) {
            // Export specific summaries
            const results = await Promise.allSettled(
                ids.map(id => this.getSummaryById(id))
            )

            const summaries = results
                .filter((result): result is PromiseFulfilledResult<ApiResponse<Summary>> =>
                    result.status === 'fulfilled' && result.value.success
                )
                .map(result => result.value.data!)

            return { success: true, data: summaries }
        } else {
            // Export all summaries
            const response = await this.getSummaries({ limit: 1000 })
            if (response.success && response.data) {
                return { success: true, data: response.data.data }
            }
            return response as unknown as ApiResponse<Summary[]>
        }
    }

    /**
     * Get popular tags
     */
    async getPopularTags(limit: number = 20): Promise<ApiResponse<Array<{ tag: string; count: number }>>> {
        // Since backend doesn't have a specific endpoint for this, we'll fetch recent summaries
        // and extract tags. In a real implementation, this should be a backend endpoint.
        const response = await this.getSummaries({ limit: 100 })

        if (!response.success || !response.data) {
            return { success: false, error: 'Failed to fetch summaries for tag analysis' }
        }

        const tagCounts = new Map<string, number>()

        response.data.data.forEach(summary => {
            summary.tags.forEach(tag => {
                tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
            })
        })

        const popularTags = Array.from(tagCounts.entries())
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit)

        return { success: true, data: popularTags }
    }

    /**
     * Sync with Chrome extension
     */
    async syncWithExtension(): Promise<void> {
        const chromeAPI = getChromeAPI()
        if (!chromeAPI) return

        try {
            const extensionId = process.env.NEXT_PUBLIC_CHROME_EXTENSION_ID
            if (extensionId) {
                await chromeAPI.runtime.sendMessage(extensionId, {
                    type: 'SUMMARY_SYNC_REQUEST',
                    timestamp: new Date().toISOString(),
                })
            }
        } catch (error) {
            console.warn('Failed to sync with Chrome extension:', error)
        }
    }

    /**
     * Handle extension summary sync
     */
    handleExtensionSync(summaryData: Summary): void {
        // Emit custom event for React components to listen to
        window.dispatchEvent(new CustomEvent('summarySync', {
            detail: { summary: summaryData, timestamp: new Date().toISOString() }
        }))
    }

    /**
     * Set up extension sync listeners
     */
    setupExtensionSyncListener(): void {
        const chromeAPI = getChromeAPI()
        if (!chromeAPI) return

        chromeAPI.runtime.onMessage.addListener((message: any, sender: any, sendResponse: any) => {
            if (message.type === 'SUMMARY_CREATED' ||
                message.type === 'SUMMARY_UPDATED' ||
                message.type === 'SUMMARY_DELETED') {
                this.handleExtensionSync(message.summary)
                sendResponse({ success: true })
            }
        })
    }
}

// Export singleton instance
export const summaryService = new SummaryService()