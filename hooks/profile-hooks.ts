// hooks/use-profile.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { formatError } from '@/lib/utils'
import { profileService } from '@/lib/profile-service'

export interface UserProfile {
  id: string
  email: string
  name: string | null
  avatar: string | null
  plan: 'FREE' | 'PREMIUM'
  credits: number
  emailVerified: boolean
  createdAt: string
  lastLoginAt: string | null
}

export interface UserStats {
  totalSummaries: number
  summariesThisMonth: number
  completedSummaries: number
  failedSummaries: number
  creditsUsed: number
  averageSummaryLength: number
  recentActivity: Array<{
    id: string
    type: 'created' | 'updated' | 'deleted'
    summaryTitle: string
    timestamp: string
  }>
}

export interface UpdateProfileRequest {
  name?: string
  avatar?: string
}

export interface UpgradePlanRequest {
  plan: 'PREMIUM'
  paymentMethod?: string
}

/**
 * Hook for managing user profile data
 */
export function useProfile() {
  const { user, isAuthenticated, updateProfile: updateAuthProfile } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await profileService.getProfile()

      if (response.success && response.data) {
        setProfile(response.data)
      } else {
        setError(response.error || 'Failed to fetch profile')
      }
    } catch (err) {
      const errorMessage = formatError(err)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  // Update profile
  const updateProfile = useCallback(async (data: UpdateProfileRequest): Promise<boolean> => {
    if (!isAuthenticated || !profile) return false

    try {
      setIsUpdating(true)
      setError(null)

      const response = await profileService.updateProfile(data)

      if (response.success && response.data) {
        setProfile(response.data)
        
        // Update auth context
        await updateAuthProfile(data)
        
        return true
      } else {
        setError(response.error || 'Failed to update profile')
        return false
      }
    } catch (err) {
      const errorMessage = formatError(err)
      setError(errorMessage)
      return false
    } finally {
      setIsUpdating(false)
    }
  }, [isAuthenticated, profile, updateAuthProfile])

  // Initialize profile from user data or fetch from API
  useEffect(() => {
    if (isAuthenticated && user) {
      // Use user data from auth context as initial profile
      setProfile({
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        plan: user.plan,
        credits: user.credits,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      })
      setIsLoading(false)
      
      // Optionally fetch fresh data from API
      fetchProfile()
    } else {
      setProfile(null)
      setIsLoading(false)
    }
  }, [isAuthenticated, user, fetchProfile])

  return {
    profile,
    isLoading,
    isUpdating,
    error,
    updateProfile,
    refetch: fetchProfile,
  }
}

/**
 * Hook for managing user statistics
 */
export function useUserStats() {
  const { isAuthenticated } = useAuth()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await profileService.getUserStats()

      if (response.success && response.data) {
        setStats(response.data)
      } else {
        setError(response.error || 'Failed to fetch statistics')
      }
    } catch (err) {
      const errorMessage = formatError(err)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  }
}

/**
 * Hook for handling plan upgrades
 */
export function useUpgrade() {
  const { user, refreshAuth } = useAuth()
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upgradePlan = useCallback(async (data: UpgradePlanRequest): Promise<boolean> => {
    if (!user) return false

    try {
      setIsUpgrading(true)
      setError(null)

      const response = await profileService.upgradePlan(data)

      if (response.success) {
        // Refresh auth to get updated user data
        await refreshAuth()
        return true
      } else {
        setError(response.error || 'Failed to upgrade plan')
        return false
      }
    } catch (err) {
      const errorMessage = formatError(err)
      setError(errorMessage)
      return false
    } finally {
      setIsUpgrading(false)
    }
  }, [user, refreshAuth])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    upgradePlan,
    isUpgrading,
    error,
    clearError,
  }
}

/**
 * Hook for account deletion
 */
export function useDeleteAccount() {
  const { logout } = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteAccount = useCallback(async (confirmationEmail: string): Promise<boolean> => {
    try {
      setIsDeleting(true)
      setError(null)

      const response = await profileService.deleteAccount({ confirmationEmail })

      if (response.success) {
        // Log out user after successful deletion
        await logout()
        return true
      } else {
        setError(response.error || 'Failed to delete account')
        return false
      }
    } catch (err) {
      const errorMessage = formatError(err)
      setError(errorMessage)
      return false
    } finally {
      setIsDeleting(false)
    }
  }, [logout])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    deleteAccount,
    isDeleting,
    error,
    clearError,
  }
}