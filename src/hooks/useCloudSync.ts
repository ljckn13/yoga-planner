import { useSync } from '@tldraw/sync'
import { useMemo, useRef } from 'react'
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
  
  // Memoize the URI to prevent unnecessary reconnections - only change when roomId changes
  const memoizedUri = useMemo(() => {
    // Convert HTTP to WebSocket URL
    const wsUrl = workerUrl.replace(/^http/, 'ws')
    return `${wsUrl}/connect/${roomId}`
  }, [workerUrl, roomId]);
  
  // Track if we've already logged this connection
  const hasLoggedRef = useRef(false);
  
  // Track the current roomId to prevent unnecessary recreations
  const currentRoomIdRef = useRef<string | null>(null);

  // Only log once per roomId
  if (!hasLoggedRef.current || currentRoomIdRef.current !== roomId) {
    console.log('🔗 [DEBUG] useCloudSync: Creating sync connection');
    console.log('🔗 [DEBUG] useCloudSync: roomId:', roomId);
    console.log('🔗 [DEBUG] useCloudSync: userId:', userId);
    console.log('🔗 [DEBUG] useCloudSync: uri:', memoizedUri);
    hasLoggedRef.current = true;
    currentRoomIdRef.current = roomId;
  }

  // Move useSync to the top level - this fixes the Rules of Hooks violation
  const syncResult = useSync({
    uri: memoizedUri,
    assets: assetStore,
    shapeUtils: [YogaPoseShapeUtil, YogaPoseSvgShapeUtil, ...defaultShapeUtils],
    bindingUtils: defaultBindingUtils,
  });

  console.log('🔗 [DEBUG] useCloudSync: Sync store created, status:', syncResult.status);

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
  };
} 