import { useSync } from '@tldraw/sync'
import { useMemo, useEffect } from 'react'
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
    uri: `${import.meta.env.DEV ? 'ws://localhost:5172' : 'https://tldraw-worker.le-jckn.workers.dev'}/connect/${roomId}`,
    assets: assetStore,
    shapeUtils: useMemo(() => [YogaPoseShapeUtil, YogaPoseSvgShapeUtil, ...defaultShapeUtils], []),
    bindingUtils: useMemo(() => defaultBindingUtils, []),
  })

  // Debug logging
  console.log('🎨 Shape Utils:', {
    yogaPoseShape: YogaPoseShapeUtil,
    yogaPoseSvgShape: YogaPoseSvgShapeUtil,
    defaultShapes: defaultShapeUtils.length,
    allShapeTypes: [YogaPoseShapeUtil, YogaPoseSvgShapeUtil, ...defaultShapeUtils].map(util => util.type)
  })

  console.log('🔄 Sync Status:', {
    status: syncResult.status,
    error: syncResult.error,
    roomId,
    storeRecords: syncResult.store ? Object.keys(syncResult.store.getSnapshot()) : []
  })

  // Monitor for sync errors
  useEffect(() => {
    if (syncResult.error) {
      console.error('🔴 Sync Error Details:', {
        error: syncResult.error,
        status: syncResult.status,
        roomId
      })
    }
  }, [syncResult.error, syncResult.status, roomId])

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