import { useExtensionAuthSync } from '@/hooks/use-extension-auth-sync'
import { formatRelativeTime } from '@/lib/utils'

export function SyncStatus() {
    const {
        isExtensionAvailable,
        isSyncing,
        lastSyncTime,
        syncError,
    } = useExtensionAuthSync()

    if (!isExtensionAvailable) {
        return (
            <div className="text-sm text-muted-foreground">
                Chrome extension not detected
            </div>
        )
    }

    return (
        <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${syncError ? 'bg-red-500' : 'bg-green-500'}`} />
            <span className="text-sm">
                {isSyncing ? 'Syncing...' : 'Extension connected'}
            </span>
            {lastSyncTime && (
                <span className="text-xs text-muted-foreground">
                    Last sync: {formatRelativeTime(lastSyncTime)}
                </span>
            )}
        </div>
    )
} 