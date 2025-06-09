import { useEffect, useState } from 'react'
import { authSyncService } from '@/lib/auth-sync'
import { formatRelativeTime } from '@/lib/utils'

interface SyncState {
    isExtensionAvailable: boolean
    isSyncing: boolean
    lastSyncTime: string | null
    syncError: string | null
}

export function SyncStatus() {
    const [syncState, setSyncState] = useState<SyncState>({
        isExtensionAvailable: false,
        isSyncing: false,
        lastSyncTime: null,
        syncError: null,
    })

    useEffect(() => {
        const checkExtensionAvailability = async () => {
            try {
                const isAvailable = await authSyncService.isExtensionAvailable()
                setSyncState(prev => ({
                    ...prev,
                    isExtensionAvailable: isAvailable,
                    syncError: isAvailable ? null : 'Extension not available'
                }))
            } catch (error) {
                setSyncState(prev => ({
                    ...prev,
                    isExtensionAvailable: false,
                    syncError: error instanceof Error ? error.message : 'Failed to check extension'
                }))
            }
        }

        checkExtensionAvailability()

        // Check periodically
        const interval = setInterval(checkExtensionAvailability, 30000) // Every 30 seconds

        return () => clearInterval(interval)
    }, [])

    // Listen for extension auth changes to update sync status
    useEffect(() => {
        const handleExtensionAuthChange = (event: Event) => {
            const customEvent = event as CustomEvent
            setSyncState(prev => ({
                ...prev,
                lastSyncTime: customEvent.detail.timestamp || new Date().toISOString(),
                syncError: null,
            }))
        }

        window.addEventListener('extensionAuthChange', handleExtensionAuthChange)

        return () => {
            window.removeEventListener('extensionAuthChange', handleExtensionAuthChange)
        }
    }, [])

    if (!syncState.isExtensionAvailable) {
        return (
            <div className="text-sm text-muted-foreground">
                Chrome extension not detected
            </div>
        )
    }

    return (
        <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${syncState.syncError ? 'bg-red-500' : 'bg-green-500'}`} />
            <span className="text-sm">
                {syncState.isSyncing ? 'Syncing...' : 'Extension connected'}
            </span>
            {syncState.lastSyncTime && (
                <span className="text-xs text-muted-foreground">
                    Last sync: {formatRelativeTime(syncState.lastSyncTime)}
                </span>
            )}
            {syncState.syncError && (
                <span className="text-xs text-red-500">
                    {syncState.syncError}
                </span>
            )}
        </div>
    )
} 