/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
// hooks/use-extension-auth-sync.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { authSyncService } from '@/lib/auth-sync'

interface ExtensionSyncState {
  isExtensionAvailable: boolean
  isSyncing: boolean
  lastSyncTime: string | null
  syncError: string | null
}

export function useExtensionAuthSync() {
  const { user, isAuthenticated, login, logout } = useAuth()
  const [syncState, setSyncState] = useState<ExtensionSyncState>({
    isExtensionAvailable: false,
    isSyncing: false,
    lastSyncTime: null,
    syncError: null,
  })

  // Check if extension is available
  useEffect(() => {
    const checkExtension = async () => {
      const isAvailable = await authSyncService.isExtensionAvailable()
      setSyncState(prev => ({ ...prev, isExtensionAvailable: isAvailable }))
    }
    checkExtension()
  }, [])

  // Sync auth state to extension on login
  useEffect(() => {
    if (isAuthenticated && user && syncState.isExtensionAvailable) {
      syncToExtension()
    }
  }, [isAuthenticated, user, syncState.isExtensionAvailable])

  // Listen for extension auth changes
  useEffect(() => {
    if (!syncState.isExtensionAvailable) return

    const handleExtensionAuthChange = async (event: CustomEvent) => {
      const { isAuthenticated: extIsAuth, user: extUser } = event.detail
      
      // If extension logged in but web not logged in, sync to web
      if (extIsAuth && extUser && !isAuthenticated) {
        try {
          setSyncState(prev => ({ ...prev, isSyncing: true, syncError: null }))
          await syncFromExtension()
        } catch (error) {
          setSyncState(prev => ({ 
            ...prev, 
            syncError: error instanceof Error ? error.message : 'Sync failed' 
          }))
        } finally {
          setSyncState(prev => ({ ...prev, isSyncing: false }))
        }
      }
      
      // If extension logged out, logout from web
      if (!extIsAuth && isAuthenticated) {
        await logout()
      }
    }

    window.addEventListener('extensionAuthChange', handleExtensionAuthChange as unknown as EventListener)
    
    return () => {
      window.removeEventListener('extensionAuthChange', handleExtensionAuthChange as unknown as EventListener)
    }
  }, [syncState.isExtensionAvailable, isAuthenticated, logout])

  // Sync auth data to extension
  const syncToExtension = useCallback(async () => {
    if (!user || !syncState.isExtensionAvailable) return

    try {
      setSyncState(prev => ({ ...prev, isSyncing: true, syncError: null }))
      
      const success = await authSyncService.syncToExtension({
        user,
        accessToken: localStorage.getItem('knugget_access_token') || '',
        refreshToken: localStorage.getItem('knugget_refresh_token') || '',
        expiresAt: parseInt(localStorage.getItem('knugget_expires_at') || '0'),
      })

      if (success) {
        setSyncState(prev => ({ 
          ...prev, 
          lastSyncTime: new Date().toISOString(),
          syncError: null 
        }))
      } else {
        throw new Error('Failed to sync to extension')
      }
    } catch (error) {
      setSyncState(prev => ({ 
        ...prev, 
        syncError: error instanceof Error ? error.message : 'Sync failed' 
      }))
    } finally {
      setSyncState(prev => ({ ...prev, isSyncing: false }))
    }
  }, [user, syncState.isExtensionAvailable])

  // Sync auth data from extension
  const syncFromExtension = useCallback(async () => {
    if (!syncState.isExtensionAvailable) return

    try {
      setSyncState(prev => ({ ...prev, isSyncing: true, syncError: null }))
      
      const authData = await authSyncService.getExtensionAuthData()
      
      if (authData && authData.user && authData.token) {
        // Store tokens in localStorage
        localStorage.setItem('knugget_access_token', authData.token)
        localStorage.setItem('knugget_refresh_token', authData.refreshToken)
        localStorage.setItem('knugget_expires_at', authData.expiresAt.toString())
        localStorage.setItem('knugget_user_data', JSON.stringify(authData.user))

        // Trigger auth context update
        window.dispatchEvent(new CustomEvent('authChange', {
          detail: { user: authData.user, isAuthenticated: true }
        }))

        setSyncState(prev => ({ 
          ...prev, 
          lastSyncTime: new Date().toISOString(),
          syncError: null 
        }))
      }
    } catch (error) {
      setSyncState(prev => ({ 
        ...prev, 
        syncError: error instanceof Error ? error.message : 'Sync failed' 
      }))
    } finally {
      setSyncState(prev => ({ ...prev, isSyncing: false }))
    }
  }, [syncState.isExtensionAvailable])

  // Clear extension auth data
  const clearExtensionAuth = useCallback(async () => {
    if (!syncState.isExtensionAvailable) return

    try {
      await authSyncService.clearExtensionAuth()
      setSyncState(prev => ({ ...prev, lastSyncTime: null }))
    } catch (error) {
      setSyncState(prev => ({ 
        ...prev, 
        syncError: error instanceof Error ? error.message : 'Clear failed' 
      }))
    }
  }, [syncState.isExtensionAvailable])

  // Manual sync trigger
  const forcSync = useCallback(async () => {
    if (isAuthenticated && user) {
      await syncToExtension()
    } else {
      await syncFromExtension()
    }
  }, [isAuthenticated, user, syncToExtension, syncFromExtension])

  return {
    ...syncState,
    syncToExtension,
    syncFromExtension,
    clearExtensionAuth,
    forcSync,
  }
}