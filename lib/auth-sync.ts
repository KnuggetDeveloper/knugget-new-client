/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/auth-sync.ts
import { User, ExtensionAuthData } from '@/types/auth'

interface ChromeAPI {
  storage: {
    sync: {
      set: (items: Record<string, any>) => Promise<void>
      get: (keys: string | string[] | null) => Promise<Record<string, any>>
      remove: (keys: string | string[]) => Promise<void>
    }
    local: {
      set: (items: Record<string, any>) => Promise<void>
      get: (keys: string | string[] | null) => Promise<Record<string, any>>
      remove: (keys: string | string[]) => Promise<void>
    }
    onChanged: {
      addListener: (callback: (changes: Record<string, any>, namespace: string) => void) => void
      removeListener: (callback: (changes: Record<string, any>, namespace: string) => void) => void
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
  if (typeof window === 'undefined') return null
  if (typeof chrome === 'undefined' || !chrome?.storage) return null
  return chrome as unknown as ChromeAPI
}

interface WebAuthData {
  user: User
  accessToken: string
  refreshToken: string
  expiresAt: number
}

class AuthSyncService {
  private chromeAPI: ChromeAPI | null = null
  private storageChangeListener: ((changes: Record<string, any>, namespace: string) => void) | null = null
  private messageListener: ((message: any, sender: any, sendResponse: any) => void) | null = null

  constructor() {
    this.chromeAPI = getChromeAPI()
    this.setupListeners()
  }

  /**
   * Check if Chrome extension API is available
   */
  async isExtensionAvailable(): Promise<boolean> {
    if (!this.chromeAPI) return false
    
    try {
      // Try to access storage to verify extension is available
      await this.chromeAPI.storage.sync.get(null)
      return true
    } catch {
      return false
    }
  }

  /**
   * Sync authentication data to Chrome extension
   */
  async syncToExtension(authData: WebAuthData): Promise<boolean> {
    if (!this.chromeAPI) return false

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

      // Store in Chrome sync storage
      await this.chromeAPI.storage.sync.set({
        knugget_auth: extensionAuthData,
      })

      // Also store in local storage for immediate access
      await this.chromeAPI.storage.local.set({
        knuggetUserInfo: extensionAuthData,
      })

      // Notify extension of auth success
      await this.notifyExtension('KNUGGET_AUTH_SUCCESS', {
        token: authData.accessToken,
        refreshToken: authData.refreshToken,
        user: authData.user,
        expiresAt: authData.expiresAt,
      })

      console.log('✅ Auth data synced to Chrome extension')
      return true
    } catch (error) {
      console.error('❌ Failed to sync auth data to extension:', error)
      return false
    }
  }

  /**
   * Get authentication data from Chrome extension
   */
  async getExtensionAuthData(): Promise<ExtensionAuthData | null> {
    if (!this.chromeAPI) return null

    try {
      // Try sync storage first
      const syncResult = await this.chromeAPI.storage.sync.get(['knugget_auth'])
      if (syncResult.knugget_auth) {
        return syncResult.knugget_auth as ExtensionAuthData
      }

      // Fallback to local storage
      const localResult = await this.chromeAPI.storage.local.get(['knuggetUserInfo'])
      if (localResult.knuggetUserInfo) {
        return localResult.knuggetUserInfo as ExtensionAuthData
      }

      return null
    } catch (error) {
      console.error('Failed to get extension auth data:', error)
      return null
    }
  }

  /**
   * Clear authentication data from Chrome extension
   */
  async clearExtensionAuth(): Promise<boolean> {
    if (!this.chromeAPI) return false

    try {
      // Clear storage
      await Promise.all([
        this.chromeAPI.storage.sync.remove(['knugget_auth']),
        this.chromeAPI.storage.local.remove(['knuggetUserInfo']),
      ])

      // Notify extension of logout
      await this.notifyExtension('KNUGGET_LOGOUT', {
        reason: 'Frontend logout',
        timestamp: new Date().toISOString()
      })

      console.log('✅ Extension auth data cleared via auth sync service')
      return true
    } catch (error) {
      console.error('❌ Failed to clear extension auth via sync service:', error)
      return false
    }
  }

  /**
   * Send message to Chrome extension
   */
  private async notifyExtension(type: string, payload: any): Promise<boolean> {
    if (!this.chromeAPI) return false

    try {
      const extensionId = process.env.NEXT_PUBLIC_CHROME_EXTENSION_ID
      if (!extensionId) {
        console.warn('Chrome extension ID not configured')
        return false
      }

      // Try to send message with timeout
      const message = {
        type,
        payload,
        timestamp: new Date().toISOString(),
      }

      // Send message with a promise that times out
      const messagePromise = this.chromeAPI.runtime.sendMessage(extensionId, message)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Extension notification timeout')), 5000)
      )

      await Promise.race([messagePromise, timeoutPromise])
      console.log(`✅ Extension notified: ${type}`)
      return true
    } catch (error) {
      // Extension might not be installed or active - this is ok for logout
      console.warn(`Could not notify extension of ${type}:`, error)
      return false
    }
  }

  /**
   * Set up listeners for Chrome extension changes
   */
  private setupListeners(): void {
    if (!this.chromeAPI) return

    // Listen for storage changes from extension
    this.storageChangeListener = (changes: Record<string, any>, namespace: string) => {
      if (namespace === 'sync' && changes.knugget_auth) {
        const change = changes.knugget_auth

        if (change.newValue) {
          // Extension logged in
          const authData = change.newValue as ExtensionAuthData
          window.dispatchEvent(new CustomEvent('extensionAuthChange', {
            detail: { 
              isAuthenticated: true, 
              user: this.convertExtensionUser(authData.user),
              timestamp: new Date().toISOString() 
            }
          }))
        } else if (change.oldValue && !change.newValue) {
          // Extension logged out
          window.dispatchEvent(new CustomEvent('extensionAuthChange', {
            detail: { 
              isAuthenticated: false, 
              user: null,
              timestamp: new Date().toISOString() 
            }
          }))
        }
      }
    }

    this.chromeAPI.storage.onChanged.addListener(this.storageChangeListener)

    // Listen for messages from extension
    this.messageListener = (message: any, sender: any, sendResponse: any) => {
      if (message.type === 'KNUGGET_CHECK_AUTH') {
        // Extension is checking auth status
        const user = this.getCurrentUser()
        const isAuthenticated = !!user && this.isTokenValid()
        
        sendResponse({
          isAuthenticated,
          user,
          timestamp: new Date().toISOString(),
        })
      } else if (message.type === 'KNUGGET_SYNC_REQUEST') {
        // Extension is requesting auth sync
        this.handleSyncRequest()
        sendResponse({ success: true })
      }
    }

    this.chromeAPI.runtime.onMessage.addListener(this.messageListener)
  }

  /**
   * Handle sync request from extension
   */
  private async handleSyncRequest(): Promise<void> {
    const user = this.getCurrentUser()
    const accessToken = localStorage.getItem('knugget_access_token')
    const refreshToken = localStorage.getItem('knugget_refresh_token')
    const expiresAt = localStorage.getItem('knugget_expires_at')

    if (user && accessToken && refreshToken && expiresAt && this.isTokenValid()) {
      await this.syncToExtension({
        user,
        accessToken,
        refreshToken,
        expiresAt: parseInt(expiresAt),
      })
    }
  }

  /**
   * Get current user from localStorage
   */
  private getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null
    
    const userData = localStorage.getItem('knugget_user_data')
    if (!userData) return null

    try {
      return JSON.parse(userData) as User
    } catch {
      return null
    }
  }

  /**
   * Check if current token is valid
   */
  private isTokenValid(): boolean {
    const expiresAt = localStorage.getItem('knugget_expires_at')
    if (!expiresAt) return false

    const expiry = parseInt(expiresAt)
    const now = Date.now()
    
    // Token is valid if it expires more than 5 minutes from now
    return expiry > (now + 5 * 60 * 1000)
  }

  /**
   * Convert extension user format to web user format
   */
  private convertExtensionUser(extUser: ExtensionAuthData['user']): User {
    return {
      id: extUser.id,
      email: extUser.email,
      name: extUser.name,
      avatar: null,
      plan: extUser.plan.toUpperCase() as 'FREE' | 'PREMIUM',
      credits: extUser.credits,
      emailVerified: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    }
  }

  /**
   * Initialize auth from extension on page load
   */
  async initializeFromExtension(): Promise<{ user: User | null; isAuthenticated: boolean }> {
    // First check localStorage
    const localUser = this.getCurrentUser()
    const isLocalValid = localUser && this.isTokenValid()

    if (isLocalValid) {
      return { user: localUser, isAuthenticated: true }
    }

    // If local auth is invalid, try extension
    const extensionAuth = await this.getExtensionAuthData()
    
    if (extensionAuth && extensionAuth.user && extensionAuth.token) {
      // Check if extension token is valid
      const isExtensionValid = extensionAuth.expiresAt > Date.now()
      
      if (isExtensionValid) {
        // Sync extension auth to localStorage
        localStorage.setItem('knugget_access_token', extensionAuth.token)
        localStorage.setItem('knugget_refresh_token', extensionAuth.refreshToken)
        localStorage.setItem('knugget_expires_at', extensionAuth.expiresAt.toString())
        localStorage.setItem('knugget_user_data', JSON.stringify(this.convertExtensionUser(extensionAuth.user)))

        return { 
          user: this.convertExtensionUser(extensionAuth.user), 
          isAuthenticated: true 
        }
      }
    }

    return { user: null, isAuthenticated: false }
  }

  /**
   * Clean up listeners
   */
  cleanup(): void {
    if (!this.chromeAPI) return

    if (this.storageChangeListener) {
      this.chromeAPI.storage.onChanged.removeListener(this.storageChangeListener)
    }

    if (this.messageListener) {
      this.chromeAPI.runtime.onMessage.removeListener(this.messageListener)
    }
  }
}

// Export singleton instance
export const authSyncService = new AuthSyncService()