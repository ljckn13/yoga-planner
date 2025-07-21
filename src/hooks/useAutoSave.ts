import { useEffect, useCallback, useState, useRef } from 'react';
import { type Editor } from 'tldraw';
import { useCanvasState } from './useCanvasState';

export interface UseAutoSaveReturn {
  saveStatus: 'saved' | 'saving' | 'error' | 'unsaved';
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  manualSave: () => Promise<void>;
  clearSavedState: () => void;
  error: string | null;
}

export interface UseAutoSaveOptions {
  canvasId?: string;
  autoSaveDelay?: number; // milliseconds
  enableAutoSave?: boolean;
  saveCurrentCanvas?: () => Promise<boolean>; // Add this if not present
  isLoadingRef?: React.MutableRefObject<boolean>; // NEW: Loading flag from canvas manager
  isDragInProgress?: boolean; // NEW: Block auto-save during drag
  isReordering?: boolean; // NEW: Block auto-save during reorder
  canvases?: Array<{ id: string }>; // Pass the current list of canvases
  isDeletionInProgress?: boolean; // Block auto-save during deletion
}

const STORAGE_KEY_PREFIX = 'yoga_flow_canvas_';

export function useAutoSave(
  editor: Editor | null,
  options: UseAutoSaveOptions = {}
): UseAutoSaveReturn {
  const {
    canvasId = 'default',
    autoSaveDelay = 500, // 0.5 second delay for auto-save (faster)
    saveCurrentCanvas, // NEW: Canvas manager save function
    isLoadingRef, // NEW: Loading flag from canvas manager
    canvases = [], // NEW: List of current canvases
    isDeletionInProgress = false, // Block auto-save during deletion
  } = options;

  const { serializeCanvas, error: serializeError } = useCanvasState(editor);
  
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'unsaved'>('saved');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | number | null>(null);
  const isInitialLoadRef = useRef(true); // NEW: Track initial load to prevent auto-save during loading

  const clearAutoSaveTimeout = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }
  }, []);



  const saveToStorage = useCallback(async () => {
    if (!editor || !canvasId) {
      return;
    }
    if (isDeletionInProgress) {
      // Optionally log for debug: console.log('Skipping auto-save during deletion', canvasId);
      return;
    }
    // Guard: If the canvasId is not in the current canvases list, skip save
    if (!canvases.some(c => c.id === canvasId)) {
      // Optionally log for debug: console.log('Skipping auto-save for deleted canvas', canvasId);
      return;
    }
    const storageKey = `${STORAGE_KEY_PREFIX}${canvasId}`;

    try {
      setSaveStatus('saving');
      setError(null);
      
      // Use canvas manager save function if available (saves to both Supabase and localStorage)
      if (saveCurrentCanvas) {
        const success = await saveCurrentCanvas();
        if (success) {
          setLastSaved(new Date());
          setSaveStatus('saved');
          setHasUnsavedChanges(false);
        } else {
          throw new Error('Canvas manager save failed');
        }
      } else {
        // Fallback to old localStorage-only method
        const canvasState = await serializeCanvas();
        if (!canvasState) {
          throw new Error('Failed to serialize canvas');
        }
        
        localStorage.setItem(storageKey, JSON.stringify(canvasState));
        setLastSaved(new Date());
        setSaveStatus('saved');
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Save failed';
      setError(errorMessage);
      setSaveStatus('error');
      console.error('❌ [AutoSave] Save failed:', err);
    }
  }, [editor, serializeCanvas, canvasId, saveCurrentCanvas, canvases, isDeletionInProgress]);

  const manualSave = useCallback(async () => {
    clearAutoSaveTimeout();
    await saveToStorage();
  }, [clearAutoSaveTimeout, saveToStorage]);

  const clearSavedState = useCallback(() => {
    if (!canvasId) return;
    const storageKey = `${STORAGE_KEY_PREFIX}${canvasId}`;
    localStorage.removeItem(storageKey);
    setLastSaved(null);
    setSaveStatus('saved');
    setHasUnsavedChanges(false);
    setError(null);
  }, [canvasId]);

  useEffect(() => {
    if (!editor || !canvasId || canvasId.trim() === '') {
      return;
    }
    // Block auto-save if drag or reorder is in progress
    if (options.isDragInProgress || options.isReordering) {
      return;
    }

    // Don't auto-save immediately on initial load - wait for user interaction
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      setSaveStatus('saved');
    } else {
      // Only save immediately when switching canvases (not on initial load)
      setSaveStatus('saving');
      saveToStorage();
    }

    const handleStoreChange = () => {
      // Skip auto-save during initial load or when canvas is loading
      if (isInitialLoadRef.current || (isLoadingRef?.current)) {
        return;
      }

      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Always trigger auto-save when store changes, regardless of shape count
      // This ensures we save even when deleting the last shape (shape count = 0)
      setSaveStatus('saving');
      setHasUnsavedChanges(true);
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveToStorage();
      }, autoSaveDelay);
    };

    // Listen to all store changes to ensure we capture user edits
    const unsubscribe = editor.store.listen(handleStoreChange);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      unsubscribe();
    };
  }, [editor, canvasId, saveToStorage, autoSaveDelay, options.isDragInProgress, options.isReordering]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        manualSave();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [manualSave]);

  const combinedError = error || serializeError;

  return {
    saveStatus,
    lastSaved,
    hasUnsavedChanges,
    manualSave,
    clearSavedState,
    error: combinedError,
  };
}