/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/auth-sync.ts
import { User, LoginResponse, ExtensionAuthData } from '@/types/auth'

// Chrome API interface
interface ChromeAPI {
  storage: {
    sync: {
      set: (items: Record<string, any>) => Promise<void>
      get: (keys: string | string[]) => Promise<Record<string, any>>
      remove: (keys: string | string[]) => Promise<void>
    }
    local: {
      set: (items: Record<string, any>) => Promise<void>
      get: (keys: string | string[]) => Promise<Record<string, any>>
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

// Auth message types
export enum AuthSyncMessageType {
  AUTH_SUCCESS = 'KNUGGET_AUTH_SUCCESS',
  LOGOUT = 'KNUGGET_LOGOUT',
  CHECK_AUTH = 'KNUGGET_CHECK_AUTH',
  SYNC_REQUEST = 'KNUGGET_SYNC_REQUEST',
  TOKEN_REFRESH = 'KNUGGET_TOKEN_REFRESH',
}

// Storage keys
const STORAGE_KEYS = {
  AUTH_DATA: 'knugget_auth',
  USER_INFO: 'knuggetUserInfo',
  LAST_SYNC: 'knugget_last_sync',
} as const

/**
 * Unified Authentication Sync Service
 * Handles bidirectional authentication synchronization between web client and Chrome extension
 */
class AuthSyncService {
  private chromeAPI: ChromeAPI | null = null
  private storageChangeListener: ((changes: Record<string, any>, namespace: string) => void) | null = null
  private messageListener: ((message: any, sender: any, sendResponse: any) => void) | null = null
  private extensionId: string | null = null
  private isInitialized = false

  constructor() {
    this.initialize()
  }

  /**
   * Initialize the auth sync service
   */
  private initialize(): void {
    // Get Chrome API if available
    this.chromeAPI = this.getChromeAPI()

    // Get extension ID from environment
    this.extensionId = process.env.NEXT_PUBLIC_CHROME_EXTENSION_ID || null

    if (this.chromeAPI) {
      this.setupListeners()
      this.isInitialized = true
      console.log('✅ Auth sync service initialized')
    } else {
      console.log('ℹ️ Chrome extension not available')
    }
  }

  /**
   * Get Chrome API if available
   */
  private getChromeAPI(): ChromeAPI | null {
    if (typeof window === 'undefined') return null

    try {
      // Check if Chrome extension APIs are available
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.storage) {
        return chrome as unknown as ChromeAPI
      }
    } catch (error) {
      console.warn('Chrome API not available:', error)
    }

    return null
  }

  /**
   * Check if extension is available and responsive
   */
  async isExtensionAvailable(): Promise<boolean> {
    if (!this.chromeAPI || !this.extensionId) return false

    try {
      const response = await this.sendMessageToExtension(AuthSyncMessageType.CHECK_AUTH, {}, 2000)
      return response && typeof response === 'object'
    } catch (error) {
      console.warn('Extension availability check failed:', error)
      return false
    }
  }

  /**
   * Sync authentication success to extension
   */
  async syncAuthToExtension(authData: LoginResponse): Promise<boolean> {
    if (!this.isInitialized) return false

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

      // Store in Chrome storage
      await Promise.all([
        this.chromeAPI!.storage.sync.set({ [STORAGE_KEYS.AUTH_DATA]: extensionAuthData }),
        this.chromeAPI!.storage.local.set({ [STORAGE_KEYS.USER_INFO]: extensionAuthData }),
      ])

      // Notify extension
      const success = await this.sendMessageToExtension(
        AuthSyncMessageType.AUTH_SUCCESS,
        {
          accessToken: authData.accessToken,
          refreshToken: authData.refreshToken,
          user: authData.user,
          expiresAt: authData.expiresAt,
        }
      )

      if (success) {
        await this.updateLastSyncTime('login')
        console.log('✅ Auth synced to extension successfully')
        return true
      }

      return false
    } catch (error) {
      console.error('❌ Failed to sync auth to extension:', error)
      return false
    }
  }

  /**
   * Sync logout to extension
   */
  async syncLogoutToExtension(reason = 'Client logout'): Promise<boolean> {
    if (!this.isInitialized) return false

    try {
      // Clear Chrome storage
      await Promise.all([
        this.chromeAPI!.storage.sync.remove([STORAGE_KEYS.AUTH_DATA]),
        this.chromeAPI!.storage.local.remove([STORAGE_KEYS.USER_INFO]),
      ])

      // Notify extension
      const success = await this.sendMessageToExtension(
        AuthSyncMessageType.LOGOUT,
        {
          reason,
          timestamp: new Date().toISOString(),
        }
      )

      if (success) {
        await this.updateLastSyncTime('logout')
        console.log('✅ Logout synced to extension successfully')
        return true
      }

      return false
    } catch (error) {
      console.error('❌ Failed to sync logout to extension:', error)
      return false
    }
  }

  /**
   * Get authentication data from extension
   */
  async getExtensionAuthData(): Promise<ExtensionAuthData | null> {
    if (!this.chromeAPI) return null

    try {
      // Try sync storage first
      const syncResult = await this.chromeAPI.storage.sync.get([STORAGE_KEYS.AUTH_DATA])
      if (syncResult[STORAGE_KEYS.AUTH_DATA]) {
        return syncResult[STORAGE_KEYS.AUTH_DATA] as ExtensionAuthData
      }

      // Fallback to local storage
      const localResult = await this.chromeAPI.storage.local.get([STORAGE_KEYS.USER_INFO])
      if (localResult[STORAGE_KEYS.USER_INFO]) {
        return localResult[STORAGE_KEYS.USER_INFO] as ExtensionAuthData
      }

      return null
    } catch (error) {
      console.error('❌ Failed to get extension auth data:', error)
      return null
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
        this.syncExtensionAuthToLocal(extensionAuth)

        return {
          user: this.convertExtensionUser(extensionAuth.user),
          isAuthenticated: true
        }
      }
    }

    return { user: null, isAuthenticated: false }
  }

  /**
   * Send message to extension with timeout
   */
  private async sendMessageToExtension(
    type: AuthSyncMessageType,
    payload: any,
    timeout = 5000
  ): Promise<any> {
    if (!this.chromeAPI || !this.extensionId) {
      throw new Error('Chrome API or extension ID not available')
    }

    const message = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    }

    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Extension message timeout')), timeout)
    )

    // Send message with timeout
    const messagePromise = this.chromeAPI.runtime.sendMessage(this.extensionId, message)

    return Promise.race([messagePromise, timeoutPromise])
  }

  /**
   * Set up listeners for Chrome extension changes
   */
  private setupListeners(): void {
    if (!this.chromeAPI) return

    // Listen for storage changes from extension
    this.storageChangeListener = (changes: Record<string, any>, namespace: string) => {
      if (namespace === 'sync' && changes[STORAGE_KEYS.AUTH_DATA]) {
        const change = changes[STORAGE_KEYS.AUTH_DATA]

        if (change.newValue) {
          // Extension logged in
          const authData = change.newValue as ExtensionAuthData
          this.handleExtensionLogin(authData)
        } else if (change.oldValue && !change.newValue) {
          // Extension logged out
          this.handleExtensionLogout()
        }
      }
    }

    this.chromeAPI.storage.onChanged.addListener(this.storageChangeListener)

    // Listen for messages from extension
    this.messageListener = (message: any, sender: any, sendResponse: any) => {
      this.handleExtensionMessage(message, sender, sendResponse)
    }

    if (this.chromeAPI.runtime.onMessage) {
      this.chromeAPI.runtime.onMessage.addListener(this.messageListener)
    }
  }

  /**
   * Handle extension login event
   */
  private handleExtensionLogin(authData: ExtensionAuthData): void {
    try {
      // Sync to localStorage
      this.syncExtensionAuthToLocal(authData)

      // Dispatch custom event for components to listen
      window.dispatchEvent(new CustomEvent('extensionAuthChange', {
        detail: {
          isAuthenticated: true,
          user: this.convertExtensionUser(authData.user),
          timestamp: new Date().toISOString()
        }
      }))

      console.log('✅ Extension login synced to client')
    } catch (error) {
      console.error('❌ Failed to handle extension login:', error)
    }
  }

  /**
   * Handle extension logout event
   */
  private handleExtensionLogout(): void {
    try {
      // Clear localStorage
      this.clearLocalAuth()

      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('extensionAuthChange', {
        detail: {
          isAuthenticated: false,
          user: null,
          timestamp: new Date().toISOString()
        }
      }))

      console.log('✅ Extension logout synced to client')
    } catch (error) {
      console.error('❌ Failed to handle extension logout:', error)
    }
  }

  /**
   * Handle messages from extension
   */
  private handleExtensionMessage(message: any, sender: any, sendResponse: any): void {
    try {
      switch (message.type) {
        case AuthSyncMessageType.CHECK_AUTH:
          const user = this.getCurrentUser()
          const isAuthenticated = !!user && this.isTokenValid()

          sendResponse({
            isAuthenticated,
            user,
            timestamp: new Date().toISOString(),
          })
          break

        case AuthSyncMessageType.SYNC_REQUEST:
          this.handleSyncRequest()
          sendResponse({ success: true })
          break

        default:
          console.log('Unknown message from extension:', message.type)
          sendResponse({ success: false, error: 'Unknown message type' })
      }
    } catch (error) {
      console.error('❌ Error handling extension message:', error)
      sendResponse({ success: false, error: 'Message handling failed' })
    }
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
      await this.syncAuthToExtension({
        user,
        accessToken,
        refreshToken,
        expiresAt: parseInt(expiresAt),
      } as LoginResponse)
    }
  }

  /**
   * Sync extension auth to localStorage
   */
  private syncExtensionAuthToLocal(authData: ExtensionAuthData): void {
    try {
      localStorage.setItem('knugget_access_token', authData.token)
      localStorage.setItem('knugget_refresh_token', authData.refreshToken)
      localStorage.setItem('knugget_expires_at', authData.expiresAt.toString())
      localStorage.setItem('knugget_user_data', JSON.stringify(this.convertExtensionUser(authData.user)))
    } catch (error) {
      console.error('❌ Failed to sync extension auth to local storage:', error)
    }
  }

  /**
   * Clear local authentication data
   */
  private clearLocalAuth(): void {
    const authKeys = [
      'knugget_access_token',
      'knugget_refresh_token',
      'knugget_user_data',
      'knugget_expires_at'
    ]

    authKeys.forEach(key => {
      try {
        localStorage.removeItem(key)
      } catch (error) {
        console.warn(`Failed to remove ${key}:`, error)
      }
    })
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
   * Get current user from localStorage
   */
  private getCurrentUser(): User | null {
    try {
      const userData = localStorage.getItem('knugget_user_data')
      return userData ? JSON.parse(userData) : null
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

    const expirationTime = parseInt(expiresAt)
    const now = Date.now()
    const buffer = 5 * 60 * 1000 // 5 minute buffer

    return now < (expirationTime - buffer)
  }

  /**
   * Update last sync time
   */
  private async updateLastSyncTime(action: 'login' | 'logout'): Promise<void> {
    if (!this.chromeAPI) return

    try {
      await this.chromeAPI.storage.local.set({
        [STORAGE_KEYS.LAST_SYNC]: {
          action,
          timestamp: new Date().toISOString(),
        }
      })
    } catch (error) {
      console.warn('Failed to update last sync time:', error)
    }
  }

  /**
   * Cleanup listeners
   */
  destroy(): void {
    if (this.chromeAPI && this.storageChangeListener) {
      this.chromeAPI.storage.onChanged.removeListener(this.storageChangeListener)
    }

    if (this.chromeAPI && this.messageListener && this.chromeAPI.runtime.onMessage) {
      this.chromeAPI.runtime.onMessage.removeListener(this.messageListener)
    }

    this.isInitialized = false
    console.log('✅ Auth sync service destroyed')
  }
}

// Export singleton instance
export const authSyncService = new AuthSyncService()
export default authSyncService