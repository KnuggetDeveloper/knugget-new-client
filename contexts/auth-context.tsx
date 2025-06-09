/* eslint-disable @typescript-eslint/no-unused-vars */
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
      return { ...state, isLoading: true, error: null }
    case 'AUTH_SUCCESS':
      return { ...state, user: action.payload, isAuthenticated: true, isLoading: false, error: null }
    case 'AUTH_ERROR':
      return { ...state, user: null, isAuthenticated: false, isLoading: false, error: action.payload }
    case 'AUTH_LOGOUT':
      return { ...state, user: null, isAuthenticated: false, isLoading: false, error: null }
    case 'AUTH_CLEAR_ERROR':
      return { ...state, error: null }
    case 'AUTH_UPDATE_USER':
      return { ...state, user: state.user ? { ...state.user, ...action.payload } : null }
    default:
      return state
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState)
  const router = useRouter()

  // Enhanced initialization with extension sync
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

  // Listen for extension auth changes
  useEffect(() => {
    const handleExtensionAuthChange = async (event: Event) => {
      try {
        const customEvent = event as CustomEvent<{ isAuthenticated: boolean; user: User }>
        const { isAuthenticated, user } = customEvent.detail

        if (isAuthenticated && user) {
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
    return () => window.removeEventListener('extensionAuthChange', handleExtensionAuthChange)
  }, [])

  // Enhanced login with extension sync
  async function login(email: string, password: string) {
    try {
      dispatch({ type: 'AUTH_START' })

      const response = await authService.login({ email, password })

      if (response.success && response.data) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user })

        // Try to sync to extension (non-blocking)
        try {
          await authSyncService.syncAuthSuccess({
            user: response.data.user,
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
            expiresAt: response.data.expiresAt
          })
        } catch (syncError) {
          console.log('ℹ️ Extension sync failed (extension may not be installed):', syncError)
          // Don't fail the login process if extension sync fails
        }

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
      await clearAuthData()
      throw error
    }
  }

  // Enhanced signup with extension sync
  async function signup(email: string, password: string, name?: string) {
    try {
      dispatch({ type: 'AUTH_START' })

      const response = await authService.register({ email, password, name })

      if (response.success && response.data) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user })

        // Try to sync to extension (non-blocking)
        try {
          await authSyncService.syncAuthSuccess({
            user: response.data.user,
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
            expiresAt: response.data.expiresAt
          })
        } catch (syncError) {
          console.log('ℹ️ Extension sync failed (extension may not be installed):', syncError)
          // Don't fail the signup process if extension sync fails
        }

        router.push('/dashboard')
      } else {
        const errorMessage = response.error || 'Signup failed'
        dispatch({ type: 'AUTH_ERROR', payload: errorMessage })
        throw new Error(errorMessage)
      }
    } catch (error) {
      const errorMessage = formatError(error)
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage })
      await clearAuthData()
      throw error
    }
  }

  // Enhanced logout with extension sync
  async function logout() {
    try {
      dispatch({ type: 'AUTH_START' })

      // Call logout API (don't fail if this errors)
      try {
        await authService.logout()
      } catch (error) {
        console.warn('⚠️ Logout API call failed:', error)
      }

      // Try to sync logout to extension (non-blocking)
      try {
        await authSyncService.syncLogout()
      } catch (syncError) {
        console.log('ℹ️ Extension logout sync failed (extension may not be installed):', syncError)
        // Don't fail the logout process if extension sync fails
      }

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

  // Enhanced token refresh
  async function refreshAuth() {
    try {
      dispatch({ type: 'AUTH_START' })

      const response = await authService.refreshToken()

      if (response.success && response.data) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user })
        
        // Try to sync refreshed tokens to extension (non-blocking)
        try {
          await authSyncService.syncAuthSuccess({
            user: response.data.user,
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
            expiresAt: response.data.expiresAt
          })
        } catch (syncError) {
          console.log('ℹ️ Extension sync failed during refresh (extension may not be installed):', syncError)
          // Don't fail the refresh process if extension sync fails
        }
        
        console.log('✅ Auth refresh successful')
      } else {
        await handleAuthFailure('Session expired. Please sign in again.')
      }
    } catch (error) {
      console.error('❌ Failed to refresh auth:', error)
      await handleAuthFailure('Authentication error. Please sign in again.')
    }
  }

  // Profile update
  async function updateProfile(data: UpdateProfileRequest) {
    try {
      dispatch({ type: 'AUTH_UPDATE_USER', payload: data })
      console.log('✅ Profile updated successfully')
    } catch (error) {
      console.error('❌ Profile update failed:', error)
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

  // Validate user data structure
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

  // Handle authentication failures
  async function handleAuthFailure(errorMessage: string): Promise<void> {
    try {
      console.log('🔄 Handling auth failure:', errorMessage)
      await clearAuthData()
      
      // Try to sync logout to extension (non-blocking)
      try {
        await authSyncService.syncLogout()
      } catch (syncError) {
        console.log('ℹ️ Extension logout sync failed during auth failure:', syncError)
        // Don't fail the auth failure handling if extension sync fails
      }
      
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage })
    } catch (error) {
      console.error('❌ Error handling auth failure:', error)
      dispatch({ type: 'AUTH_LOGOUT' })
    }
  }

  // Clear all authentication data
  async function clearAuthData(): Promise<void> {
    try {
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

      await authSyncService.clearExtensionAuth()
      console.log('✅ Auth data cleared')
    } catch (error) {
      console.error('❌ Error clearing auth data:', error)
    }
  }

  function clearError() {
    dispatch({ type: 'AUTH_CLEAR_ERROR' })
  }

  const contextValue: AuthContextType = {
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
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}