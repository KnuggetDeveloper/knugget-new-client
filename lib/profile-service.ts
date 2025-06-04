// lib/profile-service.ts
import { getApiBaseUrl } from '@/lib/utils'
import { authService } from '@/lib/auth-service'
import { UserProfile, UserStats, UpdateProfileRequest, UpgradePlanRequest } from '@/hooks/profile-hooks'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

class ProfileService {
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
      console.error('Profile API request failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      }
    }
  }

  /**
   * Get user profile
   */
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    return this.makeRequest<UserProfile>('/user/profile')
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<UserProfile>> {
    return this.makeRequest<UserProfile>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<ApiResponse<UserStats>> {
    return this.makeRequest<UserStats>('/user/stats')
  }

  /**
   * Upgrade user plan
   */
  async upgradePlan(data: UpgradePlanRequest): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return this.makeRequest<{ success: boolean; message: string }>('/user/plan/upgrade', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Delete user account
   */
  async deleteAccount(data: { confirmationEmail: string }): Promise<ApiResponse<void>> {
    return this.makeRequest<void>('/user/account', {
      method: 'DELETE',
      body: JSON.stringify(data),
    })
  }

  /**
   * Export user data
   */
  async exportUserData(): Promise<ApiResponse<{ downloadUrl: string }>> {
    return this.makeRequest<{ downloadUrl: string }>('/user/export')
  }

  /**
   * Get privacy settings
   */
  async getPrivacySettings(): Promise<ApiResponse<{ 
    dataSharing: boolean
    marketingEmails: boolean
    analyticsTracking: boolean 
  }>> {
    return this.makeRequest<{ 
      dataSharing: boolean
      marketingEmails: boolean
      analyticsTracking: boolean 
    }>('/user/privacy')
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(settings: {
    dataSharing?: boolean
    marketingEmails?: boolean
    analyticsTracking?: boolean
  }): Promise<ApiResponse<void>> {
    return this.makeRequest<void>('/user/privacy', {
      method: 'PUT',
      body: JSON.stringify(settings),
    })
  }
}

// Export singleton instance
export const profileService = new ProfileService()