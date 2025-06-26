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
  // Use environment variable for worker URL, fallback to localhost:8787 in dev
  const workerUrl = import.meta.env.VITE_TLDRAW_WORKER_URL || 
    (import.meta.env.DEV ? 'http://localhost:8787' : 'https://tldraw-worker.le-jckn.workers.dev')
  
  // Convert HTTP to WebSocket URL
  const wsUrl = workerUrl.replace(/^http/, 'ws')
  const uri = `${wsUrl}/connect/${roomId}`

  console.log('🔗 Connecting to sync server:', uri)

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