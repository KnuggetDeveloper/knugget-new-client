'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { UseLoginReturn, UseSignupReturn } from '@/types/auth'
import { formatError } from '@/lib/utils'
import { authService } from '@/lib/auth-service'

/**
 * Hook for login form functionality
 */
export function useLogin(): UseLoginReturn {
  const { login: authLogin } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      setError(null)
      await authLogin(email, password)
    } catch (err) {
      const errorMessage = formatError(err)
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const clearError = () => {
    setError(null)
  }

  return {
    login,
    isLoading,
    error,
    clearError,
  }
}

/**
 * Hook for signup form functionality
 */
export function useSignup(): UseSignupReturn {
  const { signup: authSignup } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signup = async (email: string, password: string, name?: string) => {
    try {
      setIsLoading(true)
      setError(null)
      await authSignup(email, password, name)
    } catch (err) {
      const errorMessage = formatError(err)
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const clearError = () => {
    setError(null)
  }

  return {
    signup,
    isLoading,
    error,
    clearError,
  }
}

/**
 * Hook for password reset functionality
 */
export function usePasswordReset() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const requestPasswordReset = async (email: string) => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccess(false)

      const response = await authService.forgotPassword(email)

      if (response.success) {
        setSuccess(true)
      } else {
        setError(response.error || 'Failed to send password reset email')
        throw new Error(response.error || 'Failed to send password reset email')
      }
    } catch (err) {
      const errorMessage = formatError(err)
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const resetPassword = async (token: string, password: string) => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccess(false)

      const response = await authService.resetPassword(token, password)

      if (response.success) {
        setSuccess(true)
      } else {
        setError(response.error || 'Failed to reset password')
        throw new Error(response.error || 'Failed to reset password')
      }
    } catch (err) {
      const errorMessage = formatError(err)
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const clearError = () => {
    setError(null)
  }

  const clearSuccess = () => {
    setSuccess(false)
  }

  return {
    requestPasswordReset,
    resetPassword,
    isLoading,
    error,
    success,
    clearError,
    clearSuccess,
  }
}

/**
 * Hook for checking authentication status
 */
export function useAuthStatus() {
  const { user, isAuthenticated, isLoading } = useAuth()

  return {
    user,
    isAuthenticated,
    isLoading,
    isGuest: !isAuthenticated && !isLoading,
  }
}

/**
 * Hook for user profile management
 */
export function useProfile() {
  const { user, updateProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const updateUserProfile = async (data: { name?: string; avatar?: string }) => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccess(false)

      await updateProfile(data)
      setSuccess(true)
    } catch (err) {
      const errorMessage = formatError(err)
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const clearError = () => {
    setError(null)
  }

  const clearSuccess = () => {
    setSuccess(false)
  }

  return {
    user,
    updateUserProfile,
    isLoading,
    error,
    success,
    clearError,
    clearSuccess,
  }
}