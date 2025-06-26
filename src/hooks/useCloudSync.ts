import { useSync } from '@tldraw/sync'
import { useMemo } from 'react'
import { assetStore } from '../services/assetStore'
import { YogaPoseShapeUtil, YogaPoseSvgShapeUtil } from '../shapes'
import { defaultShapeUtils, defaultBindingUtils } from 'tldraw'

interface UseCloudSyncOptions {
  roomId: string
  userId?: string
}

export function useCloudSync({ roomId, userId }: UseCloudSyncOptions) {
  // Create the sync store with our custom shapes and asset store
  const syncResult = useSync({
    uri: `${import.meta.env.DEV ? 'ws://localhost:5172' : import.meta.env.VITE_TLDRAW_WORKER_URL}/connect/${roomId}`,
    assets: assetStore,
    shapeUtils: useMemo(() => [YogaPoseShapeUtil, YogaPoseSvgShapeUtil, ...defaultShapeUtils], []),
    bindingUtils: useMemo(() => defaultBindingUtils, []),
  })

  return {
    store: syncResult.store,
    roomId,
    userId,
    // Helper function to get sync status
    getSyncStatus: () => {
      return {
        isConnected: syncResult.status === 'synced-remote',
        isSyncing: syncResult.status === 'loading',
        hasError: syncResult.status === 'error',
        error: syncResult.error,
      }
    },
  }
} 