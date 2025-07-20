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
  saveCurrentCanvas?: () => Promise<boolean>; // NEW: Canvas manager save function
  isLoadingRef?: React.MutableRefObject<boolean>; // NEW: Loading flag from canvas manager
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
  }, [editor, serializeCanvas, canvasId, saveCurrentCanvas]);

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

      // Only trigger auto-save if there are actual changes
      const shapeIds = editor.getCurrentPageShapeIds();
      if (shapeIds.size > 0) {
        setSaveStatus('saving');
        setHasUnsavedChanges(true);
        autoSaveTimeoutRef.current = setTimeout(() => {
          saveToStorage();
        }, autoSaveDelay);
      } else {
        // No shapes, clear unsaved changes flag
        setHasUnsavedChanges(false);
      }
    };

    // Listen to all store changes to ensure we capture user edits
    const unsubscribe = editor.store.listen(handleStoreChange);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      unsubscribe();
    };
  }, [editor, canvasId, saveToStorage, autoSaveDelay]);

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