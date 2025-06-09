/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/auth-sync.ts - Enhanced and simplified auth sync service
import { User, ExtensionAuthData } from '@/types/auth'

interface ChromeAPI {
  storage: any
  runtime: {
    sendMessage: (extensionId: string, message: any) => Promise<any>
    onMessage?: {
      addListener: (callback: (message: any, sender: any, sendResponse: any) => void) => void
    }
  }
}

// Type guard for Chrome API (only need runtime for message passing)
function getChromeAPI(): ChromeAPI | null {
  if (typeof window === 'undefined') return null
  if (typeof chrome === 'undefined') return null
  if (!chrome.runtime) return null
  // Note: We don't need chrome.storage for web pages - only runtime for messaging
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
  private extensionId: string | null = null

  constructor() {
    this.chromeAPI = getChromeAPI()
    this.extensionId = process.env.NEXT_PUBLIC_CHROME_EXTENSION_ID || null
    this.setupListeners()
  }

  /**
   * Check if Chrome extension API is available
   */
  async isExtensionAvailable(): Promise<boolean> {
    if (!this.chromeAPI || !this.extensionId) {
      console.log('ℹ️ Chrome runtime API or Extension ID not available')
      return false
    }
    
    try {
      // Try to ping the extension directly
      const response = await this.chromeAPI.runtime.sendMessage(this.extensionId, {
        type: 'KNUGGET_CHECK_AUTH',
        timestamp: new Date().toISOString()
      })
      console.log('✅ Extension is available and responding:', response)
      return true
    } catch (error) {
      console.log('ℹ️ Extension not responding:', error)
      return false
    }
  }

  /**
   * Sync authentication success to Chrome extension
   */
  async syncAuthSuccess(authData: WebAuthData): Promise<boolean> {
    if (!this.chromeAPI) {
      console.log('ℹ️ Chrome API not available - extension not installed')
      return false
    }

    if (!this.extensionId) {
      console.log('ℹ️ Extension ID not configured')
      return false
    }

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

      // Try to send message to extension first (this will fail if extension isn't installed)
      try {
        await this.chromeAPI.runtime.sendMessage(this.extensionId, {
          type: 'KNUGGET_AUTH_SUCCESS',
          payload: {
            accessToken: authData.accessToken,
            refreshToken: authData.refreshToken,
            user: authData.user,
            expiresAt: authData.expiresAt,
          },
          timestamp: new Date().toISOString()
        })
        console.log('✅ Extension message sent successfully')
      } catch (messageError) {
        console.log('ℹ️ Extension not responding to message (may not be installed):', messageError)
        // Continue with storage sync even if message fails
      }

      // Try to store in Chrome storage (this may also fail if extension isn't installed)
      try {
        await Promise.all([
          this.chromeAPI.storage.sync.set({ knugget_auth: extensionAuthData }),
          this.chromeAPI.storage.local.set({ knuggetUserInfo: extensionAuthData })
        ])
        console.log('✅ Auth data stored in extension storage')
      } catch (storageError) {
        console.log('ℹ️ Failed to store in extension storage (extension may not be installed):', storageError)
        return false
      }

      console.log('✅ Auth success synced to extension')
      return true
    } catch (error) {
      console.log('ℹ️ Extension sync failed (extension may not be installed):', error)
      return false
    }
  }

  /**
   * Sync logout to Chrome extension
   */
  async syncLogout(): Promise<boolean> {
    console.log('🔄 Attempting to sync logout to extension...')
    
    if (!this.chromeAPI) {
      console.log('ℹ️ Chrome runtime API not available')
      return false
    }

    if (!this.extensionId) {
      console.log('ℹ️ Extension ID not configured')
      return false
    }

    try {
      console.log('📤 Sending logout message to extension:', this.extensionId)

      // Send logout message to extension background script
      const response = await this.chromeAPI.runtime.sendMessage(this.extensionId, {
        type: 'KNUGGET_LOGOUT',
        timestamp: new Date().toISOString()
      })

      console.log('✅ Extension responded to logout:', response)
      return true
    } catch (error) {
      console.error('❌ Failed to sync logout to extension:', error)
      return false
    }
  }

  /**
   * Initialize auth from extension on page load
   */
  async initializeFromExtension(): Promise<{ user: User | null; isAuthenticated: boolean }> {
    // First check localStorage (web pages can only access their own localStorage)
    const localUser = this.getCurrentUser()
    const isLocalValid = localUser && this.isTokenValid()

    if (isLocalValid) {
      return { user: localUser, isAuthenticated: true }
    }

    // If local auth is invalid, try to get auth from extension via message
    try {
      if (this.chromeAPI && this.extensionId) {
        const response = await this.chromeAPI.runtime.sendMessage(this.extensionId, {
          type: 'KNUGGET_CHECK_AUTH',
          timestamp: new Date().toISOString()
        })
        
        if (response && response.isAuthenticated && response.user) {
          // Convert extension user format and store locally
          const user = this.convertExtensionUser(response.user)
          return { user, isAuthenticated: true }
        }
      }
    } catch (error) {
      console.log('ℹ️ Could not get auth from extension:', error)
    }

    return { user: null, isAuthenticated: false }
  }

  /**
   * Clear extension auth data (via message)
   */
  async clearExtensionAuth(): Promise<boolean> {
    if (!this.chromeAPI || !this.extensionId) return false

    try {
      await this.chromeAPI.runtime.sendMessage(this.extensionId, {
        type: 'KNUGGET_LOGOUT',
        timestamp: new Date().toISOString()
      })
      return true
    } catch (error) {
      console.error('❌ Failed to clear extension auth:', error)
      return false
    }
  }

  /**
   * Setup listeners for extension auth changes (via message events)
   */
  private setupListeners(): void {
    if (!this.chromeAPI) return

    // Listen for messages from extension (this is how extensions communicate with web pages)
    if (this.chromeAPI.runtime && this.chromeAPI.runtime.onMessage) {
      this.chromeAPI.runtime.onMessage.addListener((message: any, sender: any, sendResponse: any) => {
        if (message.type === 'KNUGGET_AUTH_CHANGED') {
          if (message.data?.isAuthenticated && message.data?.user) {
            // Extension logged in
            window.dispatchEvent(new CustomEvent('extensionAuthChange', {
              detail: { 
                isAuthenticated: true, 
                user: this.convertExtensionUser(message.data.user),
                timestamp: new Date().toISOString() 
              }
            }))
          } else {
            // Extension logged out
            window.dispatchEvent(new CustomEvent('extensionAuthChange', {
              detail: { 
                isAuthenticated: false, 
                user: null,
                timestamp: new Date().toISOString() 
              }
            }))
          }
          sendResponse({ received: true })
        }
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
  private convertExtensionUser(extUser: any): User {
    return {
      id: extUser.id,
      email: extUser.email,
      name: extUser.name,
      avatar: null,
      plan: extUser.plan?.toUpperCase() as 'FREE' | 'PREMIUM' || 'FREE',
      credits: extUser.credits || 0,
      emailVerified: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    }
  }
}

// Export singleton instance
export const authSyncService = new AuthSyncService()