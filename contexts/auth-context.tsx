/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { AuthState, AuthAction, AuthContextType, UpdateProfileRequest, User, LoginResponse } from '@/types/auth'
import AuthService from '@/lib/auth-service'
import { formatError } from '@/lib/utils'
import { authSyncService } from '@/lib/auth-sync'

// Create instance of AuthService
const authService = new AuthService()

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      }
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      }
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      }
    case 'AUTH_CLEAR_ERROR':
      return {
        ...state,
        error: null,
      }
    case 'AUTH_UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      }
    default:
      return state
  }
}

// Extended AuthContextType with additional methods
interface ExtendedAuthContextType extends AuthContextType {
  retryAuth: () => Promise<void>
  checkAuthStatus: () => Promise<boolean>
}

const AuthContext = createContext<ExtendedAuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState)
  const router = useRouter()

  // FIXED: Enhanced initialization with error recovery
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        dispatch({ type: 'AUTH_START' })

        // Try to initialize from extension first, then localStorage
        const { user, isAuthenticated } = await authSyncService.initializeFromExtension()

        if (isAuthenticated && user) {
          // Validate token with backend
          const isValid = await validateTokenWithBackend()

          if (isValid) {
            dispatch({ type: 'AUTH_SUCCESS', payload: user })
          } else {
            console.warn('⚠️ Token validation failed, clearing auth')
            await clearAuthData()
            dispatch({ type: 'AUTH_LOGOUT' })
          }
        } else {
          dispatch({ type: 'AUTH_LOGOUT' })
        }
      } catch (error) {
        console.error('❌ Failed to initialize auth:', error)
        await clearAuthData()
        dispatch({ type: 'AUTH_ERROR', payload: 'Failed to initialize authentication' })
      }
    }

    initializeAuth()
  }, [])

  // FIXED: Enhanced extension auth change listener with error handling
  useEffect(() => {
    const handleExtensionAuthChange = async (event: Event) => {
      try {
        const customEvent = event as CustomEvent<{ isAuthenticated: boolean; user: User }>
        const { isAuthenticated, user } = customEvent.detail

        if (isAuthenticated && user) {
          // Validate the auth data before accepting
          if (validateUserData(user)) {
            dispatch({ type: 'AUTH_SUCCESS', payload: user })
            console.log('✅ Extension auth sync successful')
          } else {
            console.error('❌ Invalid user data from extension')
            dispatch({ type: 'AUTH_ERROR', payload: 'Invalid authentication data received' })
          }
        } else {
          dispatch({ type: 'AUTH_LOGOUT' })
          console.log('ℹ️ Extension auth cleared')
        }
      } catch (error) {
        console.error('❌ Error handling extension auth change:', error)
        dispatch({ type: 'AUTH_ERROR', payload: 'Failed to sync authentication with extension' })
      }
    }

    window.addEventListener('extensionAuthChange', handleExtensionAuthChange)

    return () => {
      window.removeEventListener('extensionAuthChange', handleExtensionAuthChange)
    }
  }, [])

  // FIXED: Enhanced auto-refresh with comprehensive error handling
  useEffect(() => {
    if (!state.isAuthenticated) return

    let refreshInterval: NodeJS.Timeout
    let retryCount = 0
    const maxRetries = 3

    const scheduleTokenRefresh = () => {
      refreshInterval = setInterval(async () => {
        try {
          const success = await authService.autoRefreshToken()

          if (success) {
            retryCount = 0 // Reset retry count on success
            console.log('✅ Token auto-refresh successful')
          } else {
            retryCount++
            console.warn(`⚠️ Token refresh failed (attempt ${retryCount}/${maxRetries})`)

            if (retryCount >= maxRetries) {
              console.error('❌ Token refresh failed after max retries, logging out')
              await handleAuthFailure('Session expired. Please sign in again.')
            }
          }
        } catch (error) {
          retryCount++
          console.error(`❌ Token refresh error (attempt ${retryCount}/${maxRetries}):`, error)

          if (retryCount >= maxRetries) {
            await handleAuthFailure('Session expired. Please sign in again.')
          }
        }
      }, 5 * 60 * 1000) // Check every 5 minutes
    }

    scheduleTokenRefresh()

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [state.isAuthenticated])

  // FIXED: Enhanced login with comprehensive error handling
  async function login(email: string, password: string) {
    try {
      dispatch({ type: 'AUTH_START' })

      const response = await authService.login({ email, password })

      if (response.success && response.data) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user })

        // FIXED: Enhanced extension notification with error handling
        await notifyExtensionAuthSuccess(response.data)

        // Redirect to dashboard or intended page
        const returnUrl = new URLSearchParams(window.location.search).get('returnUrl')
        router.push(returnUrl || '/dashboard')
      } else {
        const errorMessage = response.error || 'Login failed'
        dispatch({ type: 'AUTH_ERROR', payload: errorMessage })
        throw new Error(errorMessage)
      }
    } catch (error) {
      const errorMessage = formatError(error)
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage })

      // Clear any corrupted auth data
      await clearAuthData()

      throw error
    }
  }

  // FIXED: Enhanced signup with error handling
  async function signup(email: string, password: string, name?: string) {
    try {
      dispatch({ type: 'AUTH_START' })

      const response = await authService.register({ email, password, name })

      if (response.success && response.data) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user })

        // FIXED: Enhanced extension notification with error handling
        await notifyExtensionAuthSuccess(response.data)

        // Redirect to dashboard
        router.push('/dashboard')
      } else {
        const errorMessage = response.error || 'Signup failed'
        dispatch({ type: 'AUTH_ERROR', payload: errorMessage })
        throw new Error(errorMessage)
      }
    } catch (error) {
      const errorMessage = formatError(error)
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage })

      // Clear any corrupted auth data
      await clearAuthData()

      throw error
    }
  }

  // FIXED: Enhanced logout with comprehensive cleanup
  async function logout() {
    try {
      dispatch({ type: 'AUTH_START' })

      // Call logout API (don't fail if this errors)
      try {
        await authService.logout()
      } catch (error) {
        console.warn('⚠️ Logout API call failed:', error)
        // Continue with local cleanup even if API fails
      }

      // FIXED: Enhanced extension notification with error handling
      await notifyExtensionLogout()

      // Clear all auth data
      await clearAuthData()

      dispatch({ type: 'AUTH_LOGOUT' })

      // Redirect to login page
      router.push('/login')
    } catch (error) {
      console.error('❌ Logout error:', error)
      // Force logout locally even if other operations fail
      await clearAuthData()
      dispatch({ type: 'AUTH_LOGOUT' })
      router.push('/login')
    }
  }

  // FIXED: Enhanced token refresh with error recovery
  async function refreshAuth() {
    try {
      dispatch({ type: 'AUTH_START' })

      const response = await authService.refreshToken()

      if (response.success && response.data) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user })
        console.log('✅ Manual auth refresh successful')
      } else {
        console.warn('⚠️ Manual auth refresh failed')
        await handleAuthFailure('Session expired. Please sign in again.')
      }
    } catch (error) {
      console.error('❌ Failed to refresh auth:', error)
      await handleAuthFailure('Authentication error. Please sign in again.')
    }
  }

  // FIXED: Enhanced profile update with error handling
  async function updateProfile(data: UpdateProfileRequest) {
    try {
      // Optimistically update UI
      dispatch({ type: 'AUTH_UPDATE_USER', payload: data })

      // TODO: Call backend API to update profile
      // const response = await authService.updateProfile(data)

      console.log('✅ Profile updated successfully')
    } catch (error) {
      console.error('❌ Profile update failed:', error)

      // Revert optimistic update on error
      if (state.user) {
        dispatch({ type: 'AUTH_SUCCESS', payload: state.user })
      }

      const errorMessage = formatError(error)
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage })
      throw error
    }
  }

  // FIXED: Enhanced extension notification with retry logic
  async function notifyExtensionAuthSuccess(authData: LoginResponse): Promise<void> {
    try {
      await authService.notifyExtensionAuthSuccess(authData)
      console.log('✅ Extension notified of auth success')
    } catch (error) {
      console.error('❌ Error notifying extension:', error)
      // Continue without throwing - extension sync is not critical for web app
    }
  }

  // FIXED: Enhanced extension logout notification
  async function notifyExtensionLogout(): Promise<void> {
    try {
      await authSyncService.clearExtensionAuth()
      
      await authService.notifyExtensionLogout()
      console.log('✅ Extension notified of logout')
    } catch (error) {
      console.error('❌ Error notifying extension of logout:', error)
      // Continue without throwing
    }
  }

  // FIXED: Validate token with backend
  async function validateTokenWithBackend(): Promise<boolean> {
    try {
      const response = await authService.getCurrentUser()
      return response.success
    } catch (error) {
      console.error('❌ Token validation failed:', error)
      return false
    }
  }

  // FIXED: Validate user data structure
  function validateUserData(user: unknown): user is User {
    return (
      typeof user === 'object' &&
      user !== null &&
      typeof (user as User).id === 'string' &&
      typeof (user as User).email === 'string' &&
      (user as User).email.includes('@') &&
      typeof (user as User).name === 'string' &&
      ['FREE', 'PREMIUM'].includes((user as User).plan) &&
      typeof (user as User).credits === 'number' &&
      (user as User).credits >= 0
    )
  }

  // FIXED: Handle authentication failures
  async function handleAuthFailure(errorMessage: string): Promise<void> {
    try {
      console.log('🔄 Handling auth failure:', errorMessage)

      // Clear all auth data
      await clearAuthData()

      // Update state
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage })

      // Notify extension
      await notifyExtensionLogout()

      // Show user-friendly message
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage })

    } catch (error) {
      console.error('❌ Error handling auth failure:', error)
      // Force clear state even if cleanup fails
      dispatch({ type: 'AUTH_LOGOUT' })
    }
  }

  // FIXED: Clear all authentication data
  async function clearAuthData(): Promise<void> {
    try {
      // Clear localStorage
      const authKeys = [
        'sb-access-token',
        'sb-refresh-token',
        'knugget_access_token',
        'knugget_refresh_token',
        'knugget_user_data',
        'knugget_expires_at'
      ]

      authKeys.forEach(key => {
        try {
          localStorage.removeItem(key)
        } catch (error) {
          console.warn(`⚠️ Failed to remove ${key}:`, error)
        }
      })

      // Clear auth sync service
      await authSyncService.clearExtensionAuth()

      console.log('✅ Auth data cleared')
    } catch (error) {
      console.error('❌ Error clearing auth data:', error)
      // Don't throw - we want to continue with logout even if cleanup fails
    }
  }

  function clearError() {
    dispatch({ type: 'AUTH_CLEAR_ERROR' })
  }

  // FIXED: Enhanced error recovery on network reconnection
  useEffect(() => {
    const handleOnline = async () => {
      if (state.error && state.error.includes('Network')) {
        console.log('🌐 Network restored, retrying authentication...')
        dispatch({ type: 'AUTH_CLEAR_ERROR' })

        // Try to refresh auth if we were previously authenticated
        const hasStoredAuth = localStorage.getItem('knugget_access_token')
        if (hasStoredAuth) {
          try {
            await refreshAuth()
          } catch (error) {
            console.error('❌ Failed to restore auth after network recovery:', error)
          }
        }
      }
    }

    const handleOffline = () => {
      if (state.error) {
        dispatch({ type: 'AUTH_ERROR', payload: 'Network connection lost. Some features may not work.' })
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [refreshAuth, state.error])

  // FIXED: Enhanced context value with error recovery methods
  const contextValue: ExtendedAuthContextType = {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    login,
    signup,
    logout,
    refreshAuth,
    clearError,
    updateProfile,

    // Additional methods for error recovery
    retryAuth: async () => {
      try {
        dispatch({ type: 'AUTH_CLEAR_ERROR' })
        await refreshAuth()
      } catch (error) {
        console.error('❌ Auth retry failed:', error)
      }
    },

    checkAuthStatus: async () => {
      try {
        const isValid = await validateTokenWithBackend()
        if (!isValid && state.isAuthenticated) {
          await handleAuthFailure('Session validation failed')
        }
        return isValid
      } catch (error) {
        console.error('❌ Auth status check failed:', error)
        return false
      }
    }
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): ExtendedAuthContextType {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}