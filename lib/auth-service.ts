/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  User,
  LoginRequest,
  RegisterRequest,
  ApiResponse,
  LoginResponse,
  AUTH_STORAGE_KEYS,
  EXTENSION_STORAGE_KEYS,
  AUTH_ENDPOINTS,
  ExtensionAuthData,
} from '@/types/auth'
import { isBrowser } from '@/lib/utils'

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
  }
}

function getChromeAPI(): ChromeAPI | null {
  if (typeof chrome !== 'undefined' && chrome?.storage) {
    return chrome as unknown as ChromeAPI
  }
  return null
}


class AuthService {
  private baseUrl: string

  constructor() {
    // FIXED: Use correct backend API URL
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://knugget-new-backend.onrender.com/api'
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`
      const token = this.getAccessToken()

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': window.location.origin,
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
        credentials: 'include',
        mode: 'cors',
        ...options,
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        }
      }

      const data = await response.json()
      return {
        success: true,
        data: data.data || data,
        message: data.message,
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
    const response = await this.makeRequest<LoginResponse>(AUTH_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    })

    if (response.success && response.data) {
      await this.setAuthData(response.data)
    }

    return response
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await this.makeRequest<LoginResponse>(AUTH_ENDPOINTS.REGISTER, {
      method: 'POST',
      body: JSON.stringify(userData),
    })

    if (response.success && response.data) {
      await this.setAuthData(response.data)
    }

    return response
  }

  async logout(): Promise<ApiResponse<void>> {
    const refreshToken = this.getRefreshToken()

    // Call backend logout API
    const response = await this.makeRequest<void>(AUTH_ENDPOINTS.LOGOUT, {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })

    // Clear local auth data
    await this.clearAuthData()
    
    // FIXED: Notify extension of logout
    await this.notifyExtensionLogout()
    
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

    const response = await this.makeRequest<LoginResponse>(AUTH_ENDPOINTS.REFRESH, {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })

    if (response.success && response.data) {
      await this.setAuthData(response.data)
    } else {
      await this.clearAuthData()
    }

    return response
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.makeRequest<User>(AUTH_ENDPOINTS.ME)
  }

  async forgotPassword(email: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(AUTH_ENDPOINTS.FORGOT_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  async resetPassword(token: string, password: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(AUTH_ENDPOINTS.RESET_PASSWORD, {
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

      await this.syncWithExtension(authData)
    } catch (error) {
      console.error('Failed to set auth data:', error)
    }
  }

  private async clearAuthData(): Promise<void> {
    if (!isBrowser()) return

    try {
      // Clear localStorage
      Object.values(AUTH_STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key)
      })

      // Clear extension auth
      await this.clearExtensionAuth()
      
      console.log('✅ All auth data cleared')
    } catch (error) {
      console.error('❌ Failed to clear auth data:', error)
    }
  }

  private async syncWithExtension(authData: LoginResponse): Promise<void> {
    const chromeAPI = getChromeAPI()
    if (!chromeAPI) return

    try {
      const extensionAuthData: ExtensionAuthData = {
        token: authData.accessToken,
        refreshToken: authData.refreshToken,
        user: {
          id: authData.user.id,
          name: authData.user.name,
          email: authData.user.email,
          credits: authData.user.credits,
          plan: authData.user.plan.toLowerCase(),
        },
        expiresAt: authData.expiresAt,
        loginTime: new Date().toISOString(),
      }

      await chromeAPI.storage.sync.set({
        [EXTENSION_STORAGE_KEYS.AUTH_DATA]: extensionAuthData,
      })

      await chromeAPI.storage.local.set({
        knuggetUserInfo: extensionAuthData,
      })

      console.log('Auth data synced with Chrome extension')
    } catch (error) {
      console.error('Failed to sync with Chrome extension:', error)
    }
  }

  private async clearExtensionAuth(): Promise<void> {
    const chromeAPI = getChromeAPI()
    if (!chromeAPI) return

    try {
      // Clear both sync and local storage
      await Promise.all([
        chromeAPI.storage.sync.remove(EXTENSION_STORAGE_KEYS.AUTH_DATA),
        chromeAPI.storage.local.remove('knuggetUserInfo')
      ])
      
      console.log('✅ Extension auth data cleared from frontend')
    } catch (error) {
      console.error('❌ Failed to clear extension auth from frontend:', error)
    }
  }

  // FIXED: Notification methods for extension sync
  async notifyExtensionAuthSuccess(authData: LoginResponse): Promise<void> {
    const chromeAPI = getChromeAPI()
    if (!chromeAPI) return

    try {
      const extensionId = process.env.NEXT_PUBLIC_CHROME_EXTENSION_ID
      if (!extensionId) return

      await chromeAPI.runtime.sendMessage(extensionId, {
        type: 'KNUGGET_AUTH_SUCCESS',
        payload: {
          token: authData.accessToken,
          refreshToken: authData.refreshToken,
          user: authData.user,
          expiresAt: authData.expiresAt,
        },
      })
    } catch (error) {
      console.error('Failed to notify extension of auth success:', error)
    }
  }

  async notifyExtensionLogout(): Promise<void> {
    const chromeAPI = getChromeAPI()
    if (!chromeAPI) return

    try {
      const extensionId = process.env.NEXT_PUBLIC_CHROME_EXTENSION_ID
      if (!extensionId) {
        console.warn('Chrome extension ID not configured for logout notification')
        return
      }

      // Send logout message to extension
      await chromeAPI.runtime.sendMessage(extensionId, {
        type: 'KNUGGET_LOGOUT',
        payload: {
          reason: 'Frontend logout',
          timestamp: new Date().toISOString(),
        }
      })
      
      console.log('✅ Extension notified of logout via runtime message')
    } catch (error) {
      console.error('❌ Failed to notify extension of logout:', error)
      // Don't throw - continue with local logout
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