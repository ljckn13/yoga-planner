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
  // Use wss:// in production, ws:// in development
  const uri = import.meta.env.DEV
    ? `ws://localhost:5172/connect/${roomId}`
    : `wss://tldraw-worker.le-jckn.workers.dev/connect/${roomId}`

  const syncResult = useSync({
    uri,
    assets: assetStore,
    shapeUtils: useMemo(() => [YogaPoseShapeUtil, YogaPoseSvgShapeUtil, ...defaultShapeUtils], []),
    bindingUtils: useMemo(() => defaultBindingUtils, []),
  })

  return {
    store: syncResult.store,
    roomId,
    userId,
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