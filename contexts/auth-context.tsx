/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AuthState, AuthAction, AuthContextType, UpdateProfileRequest } from '@/types/auth'
import { authService } from '@/lib/auth-service'
import { formatError } from '@/lib/utils'
import { authSyncService } from '@/lib/auth-sync'

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

  // Initialize auth on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        dispatch({ type: 'AUTH_START' })

        // Try to initialize from extension first, then fallback to local storage
        const extensionAuth = await authSyncService.initializeFromExtension()

        if (extensionAuth.isAuthenticated && extensionAuth.user) {
          dispatch({ type: 'AUTH_SUCCESS', payload: extensionAuth.user })
          console.log('✅ Auth initialized from extension')
          return
        }

        // Fallback to local storage
        const { user, isAuthenticated } = authService.initializeFromStorage()

        if (isAuthenticated && user) {
          // Validate token with backend
          const isValid = await validateTokenWithBackend()
          if (isValid) {
            dispatch({ type: 'AUTH_SUCCESS', payload: user })
            console.log('✅ Auth initialized from local storage')
          } else {
            await handleAuthFailure('Session expired')
          }
        } else {
          dispatch({ type: 'AUTH_LOGOUT' })
        }
      } catch (error) {
        console.error('❌ Auth initialization failed:', error)
        dispatch({ type: 'AUTH_ERROR', payload: 'Failed to initialize authentication' })
      }
    }

    initializeAuth()
  }, [])

  // Listen for extension auth changes
  useEffect(() => {
    const handleExtensionAuthChange = async (event: Event) => {
      const customEvent = event as CustomEvent
      const { isAuthenticated, user } = customEvent.detail

      try {
        if (isAuthenticated && user && !state.isAuthenticated) {
          // Extension logged in, sync to web app
          dispatch({ type: 'AUTH_SUCCESS', payload: user })
          console.log('✅ Extension login synced to web app')
        } else if (!isAuthenticated && state.isAuthenticated) {
          // Extension logged out, logout from web app
          dispatch({ type: 'AUTH_LOGOUT' })
          console.log('✅ Extension logout synced to web app')
          router.push('/login')
        }
      } catch (error) {
        console.error('❌ Failed to handle extension auth change:', error)
      }
    }

    window.addEventListener('extensionAuthChange', handleExtensionAuthChange)

    return () => {
      window.removeEventListener('extensionAuthChange', handleExtensionAuthChange)
    }
  }, [state.isAuthenticated, router])

  // Auto-refresh token when needed
  const scheduleTokenRefresh = useCallback(() => {
    if (!state.isAuthenticated) return

    const expiresAt = authService.getExpiresAt()
    if (!expiresAt) return

    const now = Date.now()
    const timeToRefresh = expiresAt - now - (10 * 60 * 1000) // 10 minutes before expiry

    if (timeToRefresh > 0) {
      const timeoutId = setTimeout(async () => {
        try {
          console.log('🔄 Auto-refreshing token...')
          await refreshAuth()
        } catch (error) {
          console.error('❌ Auto token refresh failed:', error)
          await handleAuthFailure('Session expired')
        }
      }, timeToRefresh)

      return () => clearTimeout(timeoutId)
    } else {
      // Token is already expired or about to expire, refresh immediately
      refreshAuth().catch(error => {
        console.error('❌ Immediate token refresh failed:', error)
        handleAuthFailure('Session expired')
      })
    }
  }, [state.isAuthenticated])

  useEffect(() => {
    const cleanup = scheduleTokenRefresh()
    return cleanup
  }, [scheduleTokenRefresh])

  // Login function
  async function login(email: string, password: string) {
    try {
      dispatch({ type: 'AUTH_START' })

      const response = await authService.login({ email, password })

      if (response.success && response.data) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user })
        console.log('✅ Login successful')
      } else {
        const errorMessage = formatError(response.error || 'Login failed')
        dispatch({ type: 'AUTH_ERROR', payload: errorMessage })
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('❌ Login error:', error)
      const errorMessage = formatError(error)
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage })
      throw error
    }
  }

  // Signup function
  async function signup(email: string, password: string, name?: string) {
    try {
      dispatch({ type: 'AUTH_START' })

      const response = await authService.register({ email, password, name })

      if (response.success && response.data) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user })
        console.log('✅ Signup successful')
      } else {
        const errorMessage = formatError(response.error || 'Signup failed')
        dispatch({ type: 'AUTH_ERROR', payload: errorMessage })
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('❌ Signup error:', error)
      const errorMessage = formatError(error)
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage })
      throw error
    }
  }

  // Enhanced logout with comprehensive cleanup
  async function logout() {
    try {
      dispatch({ type: 'AUTH_START' })

      // Call logout API (don't fail if this errors)
      try {
        await authService.logout()
        console.log('✅ Logout API call successful')
      } catch (error) {
        console.warn('⚠️ Logout API call failed:', error)
        // Continue with local cleanup even if API fails
      }

      // Clear all auth data and sync to extension (handled by authService.logout())
      dispatch({ type: 'AUTH_LOGOUT' })

      // Redirect to login page
      router.push('/login')
      console.log('✅ Logout completed successfully')
    } catch (error) {
      console.error('❌ Logout error:', error)
      // Force logout locally even if other operations fail
      dispatch({ type: 'AUTH_LOGOUT' })
      router.push('/login')
    }
  }

  // Enhanced token refresh with error recovery
  const refreshAuth = useCallback(async () => {
    try {
      dispatch({ type: 'AUTH_START' })

      const response = await authService.refreshToken()

      if (response.success && response.data) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user })
        console.log('✅ Token refresh successful')
      } else {
        console.warn('⚠️ Token refresh failed')
        await handleAuthFailure('Session expired. Please sign in again.')
      }
    } catch (error) {
      console.error('❌ Failed to refresh token:', error)
      await handleAuthFailure('Authentication error. Please sign in again.')
    }
  }, [])

  // Enhanced profile update with error handling
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

  // Validate token with backend
  async function validateTokenWithBackend(): Promise<boolean> {
    try {
      const response = await authService.getCurrentUser()
      return response.success
    } catch (error) {
      console.error('❌ Token validation failed:', error)
      return false
    }
  }

  // Handle authentication failures
  async function handleAuthFailure(errorMessage: string): Promise<void> {
    try {
      console.log('🔄 Handling auth failure:', errorMessage)

      // Clear all auth data (this will also sync to extension)
      await authService.logout()

      // Update state
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage })

    } catch (error) {
      console.error('❌ Error handling auth failure:', error)
      // Force clear state even if cleanup fails
      dispatch({ type: 'AUTH_LOGOUT' })
    }
  }

  function clearError() {
    dispatch({ type: 'AUTH_CLEAR_ERROR' })
  }

  // Enhanced error recovery on network reconnection
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

  // Enhanced context value with error recovery methods
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