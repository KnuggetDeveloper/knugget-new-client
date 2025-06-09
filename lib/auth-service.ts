/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  User,
  LoginRequest,
  RegisterRequest,
  ApiResponse,
  LoginResponse,
  AUTH_STORAGE_KEYS,
} from '@/types/auth'
import { isBrowser } from '@/lib/utils'
import { authSyncService } from '@/lib/auth-sync'

class AuthService {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      let data: any
      try {
        data = await response.json()
      } catch {
        data = null
      }

      if (!response.ok) {
        const message = data?.message || data?.error || `HTTP ${response.status}`
        return {
          success: false,
          error: message,
        }
      }

      return {
        success: true,
        data: data || undefined,
      }
    } catch (error) {
      console.error('API request failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      }
    }
  }

  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await this.makeRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })

    if (response.success && response.data) {
      await this.setAuthData(response.data)
      // Sync to extension using unified sync service
      await authSyncService.syncAuthToExtension(response.data)
    }

    return response
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await this.makeRequest<LoginResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })

    if (response.success && response.data) {
      await this.setAuthData(response.data)
      // Sync to extension using unified sync service
      await authSyncService.syncAuthToExtension(response.data)
    }

    return response
  }

  async logout(): Promise<ApiResponse<void>> {
    const token = this.getAccessToken()

    // Call logout API if we have a token
    let response: ApiResponse<void> = { success: true }
    if (token) {
      response = await this.makeRequest<void>('/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
    }

    // Always clear auth data locally and sync to extension
    await this.clearAuthData()
    await authSyncService.syncLogoutToExtension('Client logout')

    return response
  }

  async refreshToken(): Promise<ApiResponse<LoginResponse>> {
    const refreshToken = this.getRefreshToken()

    if (!refreshToken) {
      return {
        success: false,
        error: 'No refresh token available',
      }
    }

    const response = await this.makeRequest<LoginResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })

    if (response.success && response.data) {
      await this.setAuthData(response.data)
      // Sync refreshed auth to extension
      await authSyncService.syncAuthToExtension(response.data)
    } else {
      // If refresh fails, clear auth data
      await this.clearAuthData()
      await authSyncService.syncLogoutToExtension('Token refresh failed')
    }

    return response
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const token = this.getAccessToken()

    if (!token) {
      return {
        success: false,
        error: 'No access token available',
      }
    }

    return this.makeRequest<User>('/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })
  }

  async forgotPassword(email: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  async resetPassword(token: string, password: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    })
  }

  private async setAuthData(authData: LoginResponse): Promise<void> {
    if (!isBrowser()) return

    try {
      localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, authData.accessToken)
      localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, authData.refreshToken)
      localStorage.setItem(AUTH_STORAGE_KEYS.USER_DATA, JSON.stringify(authData.user))
      localStorage.setItem(AUTH_STORAGE_KEYS.EXPIRES_AT, authData.expiresAt.toString())

      console.log('✅ Auth data stored successfully')
    } catch (error) {
      console.error('❌ Failed to set auth data:', error)
    }
  }

  private async clearAuthData(): Promise<void> {
    if (!isBrowser()) return

    try {
      // Clear localStorage
      Object.values(AUTH_STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key)
      })

      console.log('✅ Local auth data cleared')
    } catch (error) {
      console.error('❌ Failed to clear auth data:', error)
    }
  }

  getAccessToken(): string | null {
    if (!isBrowser()) return null
    return localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN)
  }

  getRefreshToken(): string | null {
    if (!isBrowser()) return null
    return localStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN)
  }

  getUser(): User | null {
    if (!isBrowser()) return null

    const userData = localStorage.getItem(AUTH_STORAGE_KEYS.USER_DATA)
    if (!userData) return null

    try {
      return JSON.parse(userData)
    } catch {
      return null
    }
  }

  getExpiresAt(): number | null {
    if (!isBrowser()) return null

    const expiresAt = localStorage.getItem(AUTH_STORAGE_KEYS.EXPIRES_AT)
    return expiresAt ? parseInt(expiresAt) : null
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken()
    const expiresAt = this.getExpiresAt()

    if (!token || !expiresAt) return false

    const isExpired = Date.now() > (expiresAt - 5 * 60 * 1000)
    return !isExpired
  }

  needsRefresh(): boolean {
    const expiresAt = this.getExpiresAt()
    if (!expiresAt) return false

    const refreshThreshold = 15 * 60 * 1000 // 15 minutes
    return Date.now() > (expiresAt - refreshThreshold)
  }

  async autoRefreshToken(): Promise<boolean> {
    if (!this.needsRefresh()) return true

    const response = await this.refreshToken()
    return response.success
  }

  initializeFromStorage(): { user: User | null; isAuthenticated: boolean } {
    const user = this.getUser()
    const isAuthenticated = this.isAuthenticated()

    return { user, isAuthenticated }
  }
}

// Export the class as default
export default AuthService

// Also export an instance for convenience
export const authService = new AuthService()